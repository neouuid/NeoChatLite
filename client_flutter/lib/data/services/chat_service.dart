import 'package:neochat/data/models/chat.dart';
import 'package:neochat/data/models/common.dart';
import 'package:neochat/data/models/favorite.dart';
import 'package:neochat/data/services/api_service.dart';

class ChatService {
  final ApiService _api;

  ChatService(this._api);

  Future<ApiResponse<List<Conversation>>> getConversations() async {
    final response = await _api.get('/chat/conversations');
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => Conversation.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ApiResponse<Conversation>> createConversation(Map<String, dynamic> data) async {
    final response = await _api.post('/chat/conversations', data: data);
    return ApiResponse.fromJson(
      response.data,
      (json) => Conversation.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<Conversation>> getConversation(String conversationId) async {
    final response = await _api.get('/chat/conversations/$conversationId');
    return ApiResponse.fromJson(
      response.data,
      (json) => Conversation.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<Conversation>> updateConversation(
    String conversationId,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.put('/chat/conversations/$conversationId', data: data);
    return ApiResponse.fromJson(
      response.data,
      (json) => Conversation.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> deleteConversation(String conversationId) async {
    final response = await _api.delete('/chat/conversations/$conversationId');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> markConversationRead(String conversationId) async {
    final response = await _api.post('/chat/conversations/$conversationId/read');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<PaginatedResponse<Message>>> getMessages(
    String conversationId, {
    int page = 1,
    int pageSize = 50,
  }) async {
    final response = await _api.get(
      '/chat/conversations/$conversationId/messages',
      queryParameters: {
        'page': page,
        'page_size': pageSize,
      },
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => PaginatedResponse.fromJson(
        json as Map<String, dynamic>,
        (item) => Message.fromJson(item as Map<String, dynamic>),
      ),
    );
  }

  Future<ApiResponse<Message>> sendMessage(
    String conversationId,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.post(
      '/chat/conversations/$conversationId/messages',
      data: data,
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => Message.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<Message>> editMessage(
    String conversationId,
    String messageId,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.put(
      '/chat/conversations/$conversationId/messages/$messageId',
      data: data,
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => Message.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> deleteMessage(
    String conversationId,
    String messageId,
  ) async {
    final response = await _api.delete(
      '/chat/conversations/$conversationId/messages/$messageId',
    );
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> forwardMessage(
    String messageId,
    List<String> conversationIds,
  ) async {
    final response = await _api.post(
      '/chat/messages/forward',
      data: {
        'message_id': messageId,
        'conversation_ids': conversationIds,
      },
    );
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<List<Favorite>>> getFavorites() async {
    final response = await _api.get('/chat/favorites');
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => Favorite.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ApiResponse<Favorite>> addFavorite(String messageId, {String? note}) async {
    final response = await _api.post(
      '/chat/favorites',
      data: {
        'message_id': messageId,
        if (note != null) 'note': note,
      },
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => Favorite.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> removeFavorite(String favoriteId) async {
    final response = await _api.delete('/chat/favorites/$favoriteId');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> clearChatHistory(String conversationId) async {
    final response = await _api.delete('/chat/conversations/$conversationId/messages');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  // ==================== Call API Methods ====================

  Future<ApiResponse<CallRecord>> initiateCall(String calleeId, String type) async {
    final response = await _api.post('/call/initiate', data: {
      'callee_id': calleeId,
      'type': type,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => CallRecord.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<CallRecord>> acceptCall(String callId) async {
    final response = await _api.post('/call/$callId/accept');
    return ApiResponse.fromJson(
      response.data,
      (json) => CallRecord.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> rejectCall(String callId) async {
    final response = await _api.post('/call/$callId/reject');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> endCall(String callId) async {
    final response = await _api.post('/call/$callId/end');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<CallRecord>> getCallRecord(String callId) async {
    final response = await _api.get('/call/$callId');
    return ApiResponse.fromJson(
      response.data,
      (json) => CallRecord.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<List<CallRecord>>> getUserCallRecords({int limit = 50}) async {
    final response = await _api.get('/calls', queryParameters: {
      'limit': limit.toString(),
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => CallRecord.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
