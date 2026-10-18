import 'package:flutter/foundation.dart';
import 'package:neochat_api/neochat_api.dart';

/// 客户端会话状态：登录态、当前用户、离线同步游标。
///
/// 只依赖 `neochat_api`（纯 Dart），不直接依赖具体页面，便于单独测试。
class NeoChatSession extends ChangeNotifier {
  NeoChatSession({
    String? baseUrl,
    NeoChatApi? api,
  }) : _api = api ??
            NeoChatApi(
              baseUrl: baseUrl ?? defaultBaseUrl,
            );

  /// 默认服务端地址，可通过 `--dart-define=NEOCHAT_BASE_URL=...` 覆盖
  static const String defaultBaseUrl = String.fromEnvironment(
    'NEOCHAT_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  final NeoChatApi _api;
  NeoChatApi get api => _api;

  String? _token;
  String? _userId;
  String? _username;
  String? _lastSyncAt;
  bool _busy = false;
  String? _error;

  bool get isLoggedIn => _token != null && _token!.isNotEmpty;
  String? get userId => _userId;
  String? get username => _username;
  String? get lastSyncAt => _lastSyncAt;
  bool get busy => _busy;
  String? get error => _error;

  Future<bool> login(String identifier, String password) async {
    _setBusy(true);
    try {
      final res = await _api.postAuthLogin(
        body: {'identifier': identifier, 'password': password},
      );
      final data = _asMap(res['data']);
      final token = _asString(data['token']) ?? _asString(data['access_token']);
      if (token == null) {
        _error = '登录响应缺少 token';
        return false;
      }
      _token = token;
      _api.token = token;

      final user = _asMap(data['user']);
      _userId = _asString(user['id']);
      _username = _asString(user['username']);
      _error = null;
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = '登录失败：$e';
      return false;
    } finally {
      _setBusy(false);
    }
  }

  /// 拉取会话列表（后端返回 [{...}]，这里统一成 Map 列表）
  Future<List<Map<String, dynamic>>> loadConversations() async {
    final res = await _api.getChatConversations();
    return _asList(res['data']);
  }

  /// 拉取某个会话的历史消息（按后端默认分页）
  Future<List<Map<String, dynamic>>> loadMessages(String conversationId) async {
    final res = await _api.getChatConversationsIdMessages(id: conversationId);
    return _asList(res['data']);
  }

  /// 发送文本消息
  Future<bool> sendMessage(String conversationId, String content) async {
    try {
      await _api.postChatMessages(
        body: {'conversation_id': conversationId, 'content': content, 'type': 'text'},
      );
      return true;
    } catch (e) {
      _error = '发送失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 离线消息补拉：带上上次同步得到的 server_time 作为游标。
  /// 返回本次补到的消息条数。
  Future<int> syncOfflineMessages() async {
    final res = await _api.getChatSync(since: _lastSyncAt);
    final messages = _asList(res['messages']);
    _lastSyncAt = _asString(res['server_time']) ?? _lastSyncAt;
    notifyListeners();
    return messages.length;
  }

  void logout() {
    _token = null;
    _userId = null;
    _username = null;
    _lastSyncAt = null;
    _api.token = null;
    _error = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    if (value) {
      _error = null;
    }
    notifyListeners();
  }

  static Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map) return Map<String, dynamic>.from(value);
    return <String, dynamic>{};
  }

  static List<Map<String, dynamic>> _asList(dynamic value) {
    if (value is List) {
      return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return <Map<String, dynamic>>[];
  }

  static String? _asString(dynamic value) => value is String ? value : null;
}
