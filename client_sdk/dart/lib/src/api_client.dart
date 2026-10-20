// 由 scripts/gen_dart_client.py 根据 swagger.json 生成，请勿手工修改。

// ignore_for_file: non_constant_identifier_names, unused_element

import 'transport.dart';

/// NeoChat 服务端 API 客户端。
class NeoChatApi {
  NeoChatApi({required this.baseUrl, Transport? transport, this.token})
      : transport = transport ?? createDefaultTransport();

  final String baseUrl;
  final Transport transport;
  String? token;

  Map<String, String> _headers() {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final uri = Uri.parse('$baseUrl$path');
    if (query == null || query.isEmpty) return uri;
    final params = <String, String>{};
    query.forEach((key, value) {
      if (value != null) params[key] = value.toString();
    });
    return uri.replace(queryParameters: params);
  }

  /// 修改密码
  Future<dynamic> postAuthChangePassword({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/change-password';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 注销账号
  Future<dynamic> postAuthDeleteAccount({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/delete-account';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 忘记密码
  Future<dynamic> postAuthForgotPassword({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/forgot-password';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 用户登录
  Future<dynamic> postAuthLogin({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/login';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 用户登出
  Future<dynamic> postAuthLogout() async {
    final requestPath = '/api/v1/auth/logout';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取当前用户信息
  Future<dynamic> getAuthMe() async {
    final requestPath = '/api/v1/auth/me';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 获取当前用户信息
  Future<dynamic> getAuthProfile() async {
    final requestPath = '/api/v1/auth/profile';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 刷新访问令牌
  Future<dynamic> postAuthRefresh({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/refresh';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 用户注册
  Future<dynamic> postAuthRegister({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/register';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 重置密码
  Future<dynamic> postAuthResetPassword({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/reset-password';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 发送邮箱验证邮件
  Future<dynamic> postAuthSendVerificationEmail() async {
    final requestPath = '/api/v1/auth/send-verification-email';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 验证邮箱
  Future<dynamic> postAuthVerifyEmail({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/auth/verify-email';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 获取黑名单
  Future<dynamic> getBlocklist() async {
    final requestPath = '/api/v1/blocklist';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 拉黑用户
  Future<dynamic> postBlocklist({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/blocklist';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 取消拉黑
  Future<dynamic> deleteBlocklistId({required String id}) async {
    final requestPath = '/api/v1/blocklist/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 获取通话记录列表
  Future<dynamic> getCalls({int? limit}) async {
    final requestPath = '/api/v1/calls';
    final query = <String, dynamic>{'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 发起通话
  Future<dynamic> postCallsInitiate({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/calls/initiate';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 获取通话记录
  Future<dynamic> getCallsId({required String id}) async {
    final requestPath = '/api/v1/calls/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 接受通话
  Future<dynamic> postCallsIdAccept({required String id}) async {
    final requestPath = '/api/v1/calls/${id}/accept';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 结束通话
  Future<dynamic> postCallsIdEnd({required String id}) async {
    final requestPath = '/api/v1/calls/${id}/end';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 拒绝通话
  Future<dynamic> postCallsIdReject({required String id}) async {
    final requestPath = '/api/v1/calls/${id}/reject';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取会话列表
  Future<dynamic> getChatConversations() async {
    final requestPath = '/api/v1/chat/conversations';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 创建单聊会话
  Future<dynamic> postChatConversations({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/conversations';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 获取会话详情
  Future<dynamic> getChatConversationsId({required String id}) async {
    final requestPath = '/api/v1/chat/conversations/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 更新会话
  Future<dynamic> putChatConversationsId({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/conversations/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 删除会话
  Future<dynamic> deleteChatConversationsId({required String id}) async {
    final requestPath = '/api/v1/chat/conversations/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 获取会话消息
  Future<dynamic> getChatConversationsIdMessages({required String id, String? before, int? limit}) async {
    final requestPath = '/api/v1/chat/conversations/${id}/messages';
    final query = <String, dynamic>{'before': before, 'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 设置免打扰
  Future<dynamic> putChatConversationsIdMute({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/conversations/${id}/mute';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 设置置顶
  Future<dynamic> putChatConversationsIdPin({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/conversations/${id}/pin';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 标记会话为已读
  Future<dynamic> postChatConversationsIdRead({required String id}) async {
    final requestPath = '/api/v1/chat/conversations/${id}/read';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取收藏列表
  Future<dynamic> getChatFavorites() async {
    final requestPath = '/api/v1/chat/favorites';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 添加收藏
  Future<dynamic> postChatFavorites({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/favorites';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 移除收藏
  Future<dynamic> deleteChatFavoritesId({required String id}) async {
    final requestPath = '/api/v1/chat/favorites/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 标记提及为已读
  Future<dynamic> postChatMentionIdRead({required String id}) async {
    final requestPath = '/api/v1/chat/mention/${id}/read';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取提及列表
  Future<dynamic> getChatMentions({int? limit}) async {
    final requestPath = '/api/v1/chat/mentions';
    final query = <String, dynamic>{'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 标记所有提及为已读
  Future<dynamic> postChatMentionsReadAll() async {
    final requestPath = '/api/v1/chat/mentions/read-all';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取未读提及数量
  Future<dynamic> getChatMentionsUnreadCount() async {
    final requestPath = '/api/v1/chat/mentions/unread-count';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 发送消息
  Future<dynamic> postChatMessages({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/messages';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 转发消息
  Future<dynamic> postChatMessagesForward({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/messages/forward';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 编辑消息
  Future<dynamic> putChatMessagesId({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/chat/messages/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 删除消息
  Future<dynamic> deleteChatMessagesId({required String id}) async {
    final requestPath = '/api/v1/chat/messages/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 搜索群组
  Future<dynamic> getChatSearchGroups({String? q, int? limit}) async {
    final requestPath = '/api/v1/chat/search/groups';
    final query = <String, dynamic>{'q': q, 'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 搜索消息
  Future<dynamic> getChatSearchMessages({String? q, int? limit}) async {
    final requestPath = '/api/v1/chat/search/messages';
    final query = <String, dynamic>{'q': q, 'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 离线消息同步
  Future<dynamic> getChatSync({String? since, int? limit}) async {
    final requestPath = '/api/v1/chat/sync';
    final query = <String, dynamic>{'since': since, 'limit': limit};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 下载/查看上传文件
  Future<dynamic> getFilesPath({required String path, String? token}) async {
    final requestPath = '/api/v1/files/${path}';
    final query = <String, dynamic>{'token': token};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 获取好友列表
  Future<dynamic> getFriends() async {
    final requestPath = '/api/v1/friends';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 获取好友请求列表
  Future<dynamic> getFriendsRequests() async {
    final requestPath = '/api/v1/friends/requests';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 发送好友请求
  Future<dynamic> postFriendsRequests({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/friends/requests';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 接受好友请求
  Future<dynamic> postFriendsRequestsIdAccept({required String id}) async {
    final requestPath = '/api/v1/friends/requests/${id}/accept';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 取消好友请求
  Future<dynamic> postFriendsRequestsIdCancel({required String id}) async {
    final requestPath = '/api/v1/friends/requests/${id}/cancel';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 拒绝好友请求
  Future<dynamic> postFriendsRequestsIdReject({required String id}) async {
    final requestPath = '/api/v1/friends/requests/${id}/reject';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 删除好友
  Future<dynamic> deleteFriendsId({required String id}) async {
    final requestPath = '/api/v1/friends/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 更新好友备注
  Future<dynamic> putFriendsIdAlias({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/friends/${id}/alias';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 创建群组
  Future<dynamic> postGroups({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/groups';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 获取群组信息
  Future<dynamic> getGroupsId({required String id}) async {
    final requestPath = '/api/v1/groups/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 更新群组信息
  Future<dynamic> putGroupsId({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/groups/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 解散群组
  Future<dynamic> deleteGroupsId({required String id}) async {
    final requestPath = '/api/v1/groups/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 退出群组
  Future<dynamic> postGroupsIdLeave({required String id}) async {
    final requestPath = '/api/v1/groups/${id}/leave';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取群成员列表
  Future<dynamic> getGroupsIdMembers({required String id}) async {
    final requestPath = '/api/v1/groups/${id}/members';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 添加群成员
  Future<dynamic> postGroupsIdMembers({required String id, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/groups/${id}/members';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers(), body: body);
  }

  /// 移除群成员
  Future<dynamic> deleteGroupsIdMembersUserId({required String id, required String userId}) async {
    final requestPath = '/api/v1/groups/${id}/members/${userId}';
    final url = _uri(requestPath);
    return transport.send(method: 'DELETE', url: url, headers: _headers());
  }

  /// 更新成员角色
  Future<dynamic> putGroupsIdMembersUserIdRole({required String id, required String userId, required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/groups/${id}/members/${userId}/role';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 上传文件
  Future<dynamic> postUpload() async {
    final requestPath = '/api/v1/upload';
    final url = _uri(requestPath);
    return transport.send(method: 'POST', url: url, headers: _headers());
  }

  /// 获取当前用户资料
  Future<dynamic> getUsersProfile() async {
    final requestPath = '/api/v1/users/profile';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 更新用户资料
  Future<dynamic> putUsersProfile({required Map<String, dynamic> body}) async {
    final requestPath = '/api/v1/users/profile';
    final url = _uri(requestPath);
    return transport.send(method: 'PUT', url: url, headers: _headers(), body: body);
  }

  /// 搜索用户
  Future<dynamic> getUsersSearch({String? keyword, int? page, int? pageSize}) async {
    final requestPath = '/api/v1/users/search';
    final query = <String, dynamic>{'keyword': keyword, 'page': page, 'page_size': pageSize};
    final url = _uri(requestPath, query);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

  /// 获取用户资料
  Future<dynamic> getUsersId({required String id}) async {
    final requestPath = '/api/v1/users/${id}';
    final url = _uri(requestPath);
    return transport.send(method: 'GET', url: url, headers: _headers());
  }

}