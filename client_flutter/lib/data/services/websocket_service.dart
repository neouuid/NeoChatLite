import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:neochat/core/constants/app_constants.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/data/services/api_service.dart';

class WebSocketService {
  final ApiService _apiService;
  WebSocketChannel? _channel;
  final StreamController<Message> _messageController = StreamController<Message>.broadcast();
  final StreamController<Conversation> _conversationController = StreamController<Conversation>.broadcast();
  final StreamController<bool> _connectionController = StreamController<bool>.broadcast();
  final StreamController<Map<String, dynamic>> _eventController = StreamController<Map<String, dynamic>>.broadcast();
  Timer? _reconnectTimer;
  bool _isManuallyClosed = false;

  Stream<Message> get messageStream => _messageController.stream;
  Stream<Conversation> get conversationStream => _conversationController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;
  Stream<Map<String, dynamic>> get eventStream => _eventController.stream;
  bool get isConnected => _channel != null;

  WebSocketService(this._apiService) {
    _initConnectionListener();
  }

  void _initConnectionListener() {
    _connectionController.add(false);
  }

  Future<void> connect() async {
    if (_channel != null && !_isManuallyClosed) {
      Logger.debug('WebSocket already connected');
      return;
    }

    try {
      _isManuallyClosed = false;
      final token = _apiService.getAccessToken();
      if (token == null) {
        Logger.warning('Cannot connect WebSocket: no access token');
        return;
      }

      final wsUrl = Uri.parse('${AppConstants.wsBaseUrl}/ws?token=$token');

      Logger.debug('Connecting to WebSocket: $wsUrl');
      _channel = WebSocketChannel.connect(wsUrl);

      _connectionController.add(true);
      _listenMessages();

      _channel!.ready.then((_) {
        Logger.debug('WebSocket connected successfully');
      });
    } catch (e, stackTrace) {
      Logger.error('WebSocket connection failed', error: e, stackTrace: stackTrace);
      _connectionController.add(false);
      _scheduleReconnect();
    }
  }

  void _listenMessages() {
    _channel!.stream.listen(
      (dynamic data) {
        Logger.debug('Received WebSocket message: $data');
        try {
          _handleMessage(data);
        } catch (e, stackTrace) {
          Logger.error('Failed to handle message', error: e, stackTrace: stackTrace);
        }
      },
      onError: (dynamic error) {
        Logger.error('WebSocket error', error: error);
        _connectionController.add(false);
        _scheduleReconnect();
      },
      onDone: () {
        Logger.debug('WebSocket connection closed');
        _connectionController.add(false);
        if (!_isManuallyClosed) {
          _scheduleReconnect();
        }
      },
    );
  }

  void _handleMessage(dynamic data) {
    try {
      final jsonData = jsonDecode(data as String);
      final type = jsonData['type'] as String?;

      _eventController.add(jsonData);

      switch (type) {
        case 'new_message':
          final messageJson = jsonData['data'];
          final message = Message.fromJson(messageJson as Map<String, dynamic>);
          _messageController.add(message);
          break;
        case 'conversation_update':
          final convJson = jsonData['data'];
          final conversation = Conversation.fromJson(convJson as Map<String, dynamic>);
          _conversationController.add(conversation);
          break;
        default:
          Logger.debug('Unhandled WebSocket message type: $type');
      }
    } catch (e, stackTrace) {
      Logger.error('Failed to parse WebSocket message', error: e, stackTrace: stackTrace);
    }
  }

  void _scheduleReconnect() {
    if (_isManuallyClosed) return;

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(AppConstants.wsReconnectDelay, () {
      Logger.debug('Attempting to reconnect WebSocket...');
      connect();
    });
  }

  void sendMessage(Map<String, dynamic> data) {
    if (_channel == null) {
      Logger.warning('Cannot send message: WebSocket not connected');
      return;
    }
    _channel!.sink.add(jsonEncode(data));
  }

  void sendTextMessage(String conversationId, String content) {
    sendMessage({
      'type': 'send_message',
      'data': {
        'conversation_id': conversationId,
        'content': content,
        'type': 'text',
      },
    });
  }

  void markAsRead(String messageId) {
    sendMessage({
      'type': 'mark_read',
      'data': {
        'message_id': messageId,
      },
    });
  }

  void typing(String conversationId, bool isTyping) {
    sendMessage({
      'type': 'typing',
      'data': {
        'conversation_id': conversationId,
        'is_typing': isTyping,
      },
    });
  }

  Future<void> disconnect() async {
    _isManuallyClosed = true;
    _reconnectTimer?.cancel();
    await _channel?.sink.close();
    _channel = null;
    _connectionController.add(false);
    Logger.debug('WebSocket disconnected');
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _conversationController.close();
    _connectionController.close();
    _eventController.close();
  }
}