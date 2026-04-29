import 'package:neochat/data/models/common.dart';
import 'package:neochat/data/models/group.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/models/favorite.dart';
import 'package:neochat/data/services/api_service.dart';

class UserService {
  final ApiService _api;

  UserService(this._api);

  Future<ApiResponse<PaginatedResponse<User>>> searchUsers(
    String query, {
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.get(
      '/users/search',
      queryParameters: {
        'q': query,
        'page': page,
        'page_size': pageSize,
      },
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => PaginatedResponse.fromJson(
        json as Map<String, dynamic>,
        (item) => User.fromJson(item as Map<String, dynamic>),
      ),
    );
  }

  Future<ApiResponse<User>> getUser(String userId) async {
    final response = await _api.get('/users/$userId');
    return ApiResponse.fromJson(
      response.data,
      (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<List<Friend>>> getFriends() async {
    final response = await _api.get('/friends');
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => Friend.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ApiResponse<List<Friend>>> getFriendRequests() async {
    final response = await _api.get('/friends/requests');
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => Friend.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ApiResponse<void>> sendFriendRequest(String userId) async {
    final response = await _api.post('/friends/requests', data: {
      'user_id': userId,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> acceptFriendRequest(String requestId) async {
    final response = await _api.post('/friends/requests/$requestId/accept');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> rejectFriendRequest(String requestId) async {
    final response = await _api.post('/friends/requests/$requestId/reject');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> deleteFriend(String friendId) async {
    final response = await _api.delete('/friends/$friendId');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> updateFriendAlias(
    String friendId,
    String alias,
  ) async {
    final response = await _api.put('/friends/$friendId', data: {
      'alias': alias,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<List<Friend>>> getBlocklist() async {
    final response = await _api.get('/blocklist');
    return ApiResponse.fromJson(
      response.data,
      (json) => (json as List<dynamic>)
          .map((item) => Friend.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<ApiResponse<void>> blockUser(String userId, {String? reason}) async {
    final response = await _api.post('/blocklist', data: {
      'user_id': userId,
      if (reason != null) 'reason': reason,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> unblockUser(String userId) async {
    final response = await _api.delete('/blocklist/$userId');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<Group>> createGroup(Map<String, dynamic> data) async {
    final response = await _api.post('/groups', data: data);
    return ApiResponse.fromJson(
      response.data,
      (json) => Group.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<Group>> getGroup(String groupId) async {
    final response = await _api.get('/groups/$groupId');
    return ApiResponse.fromJson(
      response.data,
      (json) => Group.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<Group>> updateGroup(
    String groupId,
    Map<String, dynamic> data,
  ) async {
    final response = await _api.put('/groups/$groupId', data: data);
    return ApiResponse.fromJson(
      response.data,
      (json) => Group.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> inviteGroupMembers(
    String groupId,
    List<String> userIds,
  ) async {
    final response = await _api.post('/groups/$groupId/members', data: {
      'user_ids': userIds,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> removeGroupMember(
    String groupId,
    String userId,
  ) async {
    final response = await _api.delete('/groups/$groupId/members/$userId');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> updateMemberRole(
    String groupId,
    String userId,
    String role,
  ) async {
    final response = await _api.put('/groups/$groupId/members/$userId/role', data: {
      'role': role,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<void>> leaveGroup(String groupId) async {
    final response = await _api.post('/groups/$groupId/leave');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }

  Future<ApiResponse<PaginatedResponse<Favorite>>> getFavorites({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.get(
      '/favorites',
      queryParameters: {
        'page': page,
        'page_size': pageSize,
      },
    );
    return ApiResponse.fromJson(
      response.data,
      (json) => PaginatedResponse.fromJson(
        json as Map<String, dynamic>,
        (item) => Favorite.fromJson(item as Map<String, dynamic>),
      ),
    );
  }

  Future<ApiResponse<Favorite>> addFavorite(
    String messageId, {
    String? note,
  }) async {
    final response = await _api.post('/favorites', data: {
      'message_id': messageId,
      if (note != null) 'note': note,
    });
    return ApiResponse.fromJson(
      response.data,
      (json) => Favorite.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> deleteFavorite(String favoriteId) async {
    final response = await _api.delete('/favorites/$favoriteId');
    return ApiResponse.fromJson(
      response.data,
      (json) => null,
    );
  }
}
