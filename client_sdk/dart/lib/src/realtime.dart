// 实时消息（WebSocket）客户端。
//
// 服务端地址：ws://host/api/v1/chat/ws?token=<JWT>
// 浏览器无法自定义请求头，所以 token 走 query 参数（服务端 WebSocketAuthMiddleware）。
//
// 传输层可替换：默认用 dart:io 的 WebSocket，Flutter Web 可注入自己的 RealtimeConnector。
import 'dart:async';
import 'dart:convert';

import 'realtime_stub.dart'
    if (dart.library.io) 'realtime_io.dart'
    if (dart.library.js_interop) 'realtime_web.dart' as platform;

/// 服务端下发的实时事件（type 见服务端 WSMessageType，例如 new_message / typing）
class RealtimeEvent {
  RealtimeEvent({
    required this.type,
    required this.raw,
    this.data,
    this.fromId,
    this.convId,
  });

  final String type;
  final Map<String, dynamic> raw;
  final dynamic data;
  final String? fromId;
  final String? convId;

  static RealtimeEvent? fromJson(dynamic json) {
    if (json is! Map) return null;
    final map = Map<String, dynamic>.from(json);
    final type = map['type'];
    if (type is! String) return null;
    return RealtimeEvent(
      type: type,
      raw: map,
      data: map['data'],
      fromId: map['from_id'] as String?,
      convId: map['conv_id'] as String?,
    );
  }
}

/// 连接状态
enum RealtimeStatus { disconnected, connecting, connected }

/// 可替换的底层连接
abstract class RealtimeSocket {
  Stream<String> get messages;

  void send(String data);

  Future<void> close();
}

/// 建立连接的函数，便于测试时注入假实现
typedef RealtimeConnector = Future<RealtimeSocket> Function(
  Uri uri,
  Map<String, String> headers,
);

/// 按当前平台创建默认 WebSocket 连接器
RealtimeConnector createDefaultRealtimeConnector() =>
    platform.createRealtimeConnector();

/// 当前平台默认连接器名字
String defaultRealtimeConnectorName() => platform.connectorName();

/// 实时客户端：自动重连 + 心跳 + 事件流
class RealtimeClient {
  RealtimeClient({
    required this.baseUrl,
    RealtimeConnector? connector,
    this.pingInterval = const Duration(seconds: 25),
    this.reconnectDelays = const [
      Duration(seconds: 1),
      Duration(seconds: 2),
      Duration(seconds: 5),
      Duration(seconds: 10),
      Duration(seconds: 20),
    ],
  }) : _connector = connector ?? createDefaultRealtimeConnector();

  final String baseUrl;
  final RealtimeConnector _connector;
  final Duration pingInterval;
  final List<Duration> reconnectDelays;

  final _events = StreamController<RealtimeEvent>.broadcast();
  final _statuses = StreamController<RealtimeStatus>.broadcast();

  RealtimeSocket? _socket;
  StreamSubscription<String>? _subscription;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  String? _token;
  int _attempt = 0;
  bool _closedByUser = false;
  RealtimeStatus _status = RealtimeStatus.disconnected;

  /// 收到的实时事件
  Stream<RealtimeEvent> get events => _events.stream;

  /// 连接状态变化（重连成功后会再次发 connected，可用于触发离线补拉）
  Stream<RealtimeStatus> get statusStream => _statuses.stream;

  RealtimeStatus get status => _status;

  /// 连接；重复调用会先断开旧连接
  Future<void> connect(String token) async {
    _token = token;
    _closedByUser = false;
    _attempt = 0;
    await _teardown();
    await _open();
  }

  /// 发送「正在输入」/「停止输入」。
  /// 服务端会转发给同会话的其他成员（type: typing / stop_typing）。
  void sendTyping(String conversationId, {bool typing = true}) {
    _sendEvent({
      'type': typing ? 'typing' : 'stop_typing',
      'conv_id': conversationId,
      'data': {'conversation_id': conversationId},
    });
  }

  /// 发送任意已约定的 WS 事件（用于 WebRTC 信令等扩展场景）
  void sendEvent(Map<String, dynamic> event) => _sendEvent(event);

  void _sendEvent(Map<String, dynamic> event) {
    final socket = _socket;
    if (socket == null) return;
    try {
      socket.send(jsonEncode(event));
    } catch (_) {
      _scheduleReconnect();
    }
  }

  /// 主动断开，不再自动重连
  Future<void> disconnect() async {
    _closedByUser = true;
    _reconnectTimer?.cancel();
    await _teardown();
    _setStatus(RealtimeStatus.disconnected);
  }

  Future<void> dispose() async {
    await disconnect();
    await _events.close();
    await _statuses.close();
  }

  Uri _buildUri(String token) {
    final httpUri = Uri.parse(baseUrl);
    final scheme = httpUri.scheme == 'https' ? 'wss' : 'ws';
    return httpUri.replace(
      scheme: scheme,
      path: '/api/v1/chat/ws',
      queryParameters: {'token': token},
    );
  }

  Future<void> _open() async {
    final token = _token;
    if (token == null || token.isEmpty) {
      return;
    }

    _setStatus(RealtimeStatus.connecting);
    try {
      // 原生平台也可以带 Authorization 头；Web 端会忽略，服务端会回退看 ?token=
      final socket = await _connector(_buildUri(token), {
        'Authorization': 'Bearer $token',
      });
      _socket = socket;
      _attempt = 0;
      _setStatus(RealtimeStatus.connected);

      _subscription = socket.messages.listen(
        _onMessage,
        onError: (_) => _scheduleReconnect(),
        onDone: _scheduleReconnect,
        cancelOnError: true,
      );

      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(pingInterval, (_) {
        try {
          socket.send(jsonEncode({'type': 'ping'}));
        } catch (_) {
          _scheduleReconnect();
        }
      });
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _onMessage(String raw) {
    try {
      final decoded = jsonDecode(raw);
      // 心跳回包不入业务事件流
      if (decoded is Map && decoded['type'] == 'pong') return;
      final event = RealtimeEvent.fromJson(decoded);
      if (event != null) {
        _events.add(event);
      }
    } catch (_) {
      // 非法 JSON 直接忽略，不影响连接
    }
  }

  void _scheduleReconnect() {
    _pingTimer?.cancel();
    _subscription?.cancel();
    _subscription = null;
    _socket = null;

    if (_closedByUser) {
      _setStatus(RealtimeStatus.disconnected);
      return;
    }

    _setStatus(RealtimeStatus.disconnected);
    final delay = reconnectDelays[
        _attempt < reconnectDelays.length ? _attempt : reconnectDelays.length - 1];
    _attempt++;

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      if (_closedByUser) return;
      _open();
    });
  }

  Future<void> _teardown() async {
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    await _subscription?.cancel();
    _subscription = null;
    final socket = _socket;
    _socket = null;
    if (socket != null) {
      try {
        await socket.close();
      } catch (_) {}
    }
  }

  void _setStatus(RealtimeStatus status) {
    _status = status;
    if (!_statuses.isClosed) {
      _statuses.add(status);
    }
  }
}
