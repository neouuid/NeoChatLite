import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:neochat_api/neochat_api.dart';

/// 客户端会话状态：登录态、当前用户、离线同步游标。
///
/// 只依赖 `neochat_api`（纯 Dart），不直接依赖具体页面，便于单独测试。
class NeoChatSession extends ChangeNotifier {
  NeoChatSession({
    String? baseUrl,
    NeoChatApi? api,
    Uploader? uploader,
    bool enableRealtime = true,
  })  : _uploader = uploader ?? createDefaultUploader(),
        _api = api ??
            NeoChatApi(
              baseUrl: baseUrl ?? defaultBaseUrl,
            ),
        _baseUrl = baseUrl ?? defaultBaseUrl,
        _enableRealtime = enableRealtime;

  /// 默认服务端地址，可通过 `--dart-define=NEOCHAT_BASE_URL=...` 覆盖
  static const String defaultBaseUrl = String.fromEnvironment(
    'NEOCHAT_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  final NeoChatApi _api;
  NeoChatApi get api => _api;

  final String _baseUrl;
  final Uploader _uploader;
  final bool _enableRealtime;

  /// 服务端地址（拼接上传后的相对 URL 用）
  String get baseUrl => _baseUrl;
  RealtimeClient? _realtime;
  StreamSubscription<RealtimeEvent>? _realtimeSub;
  StreamSubscription<RealtimeStatus>? _realtimeStatusSub;

  /// 实时事件流（未连接时为 null）
  Stream<RealtimeEvent>? get realtimeEvents => _realtime?.events;

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
      if (_enableRealtime) {
        unawaited(_connectRealtime(token));
      }
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

  /// 拉取某个会话的消息。
  /// [before] 为时间游标（RFC3339），用于向上翻更早的历史消息。
  Future<List<Map<String, dynamic>>> loadMessages(
    String conversationId, {
    String? before,
    int? limit,
  }) async {
    final res = await _api.getChatConversationsIdMessages(
      id: conversationId,
      before: before,
      limit: limit,
    );
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

  /// 撤回（删除）一条消息
  Future<bool> deleteMessage(String messageId) async {
    try {
      await _api.deleteChatMessagesId(id: messageId);
      return true;
    } catch (e) {
      _error = '撤回失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 转发消息到多个会话
  Future<bool> forwardMessage(String messageId, List<String> conversationIds) async {
    try {
      await _api.postChatMessagesForward(
        body: {'message_id': messageId, 'conversation_ids': conversationIds},
      );
      return true;
    } catch (e) {
      _error = '转发失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 收藏消息
  Future<bool> favoriteMessage(String messageId, {String? note}) async {
    try {
      await _api.postChatFavorites(
        body: {'message_id': messageId, if (note != null) 'note': note},
      );
      return true;
    } catch (e) {
      _error = '收藏失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 搜索消息（返回 [{id, conversation_id, content, ...}]）
  Future<List<Map<String, dynamic>>> searchMessages(String query) async {
    final res = await _api.getChatSearchMessages(q: query);
    return _asList(res['data']);
  }

  /// 我收到的 @提及列表
  Future<List<Map<String, dynamic>>> loadMentions({int? limit}) async {
    final res = await _api.getChatMentions(limit: limit);
    return _asList(res['data']);
  }

  /// 未读提及数
  Future<int> unreadMentionCount() async {
    final res = await _api.getChatMentionsUnreadCount();
    final data = _asMap(res['data']);
    final count = data['count'];
    return count is num ? count.toInt() : 0;
  }

  /// 标记单条提及已读
  Future<bool> markMentionRead(String mentionId) async {
    try {
      await _api.postChatMentionIdRead(id: mentionId);
      return true;
    } catch (e) {
      _error = '标记已读失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 全部提及标记已读
  Future<bool> markAllMentionsRead() async {
    try {
      await _api.postChatMentionsReadAll();
      return true;
    } catch (e) {
      _error = '标记已读失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 我的收藏
  Future<List<Map<String, dynamic>>> loadFavorites() async {
    final res = await _api.getChatFavorites();
    return _asList(res['data']);
  }

  /// 取消收藏
  Future<bool> removeFavorite(String favoriteId) async {
    try {
      await _api.deleteChatFavoritesId(id: favoriteId);
      return true;
    } catch (e) {
      _error = '取消收藏失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 好友列表（建群/拉人时选人用）
  Future<List<Map<String, dynamic>>> loadFriends() async {
    final res = await _api.getFriends();
    return _asList(res['data']);
  }

  /// 创建群聊，返回新会话 ID
  Future<String?> createGroup({
    required String name,
    List<String> memberIds = const [],
  }) async {
    try {
      final res = await _api.postGroups(body: {
        'name': name,
        'member_ids': memberIds,
      });
      final data = _asMap(res['data']);
      final conversation = _asMap(data['conversation']);
      return _asString(conversation['id']);
    } catch (e) {
      _error = '建群失败：$e';
      notifyListeners();
      return null;
    }
  }

  /// 群成员列表
  Future<List<Map<String, dynamic>>> loadGroupMembers(String groupId) async {
    final res = await _api.getGroupsIdMembers(id: groupId);
    return _asList(res['data']);
  }

  /// 拉人进群
  Future<bool> addGroupMember(String groupId, String userId) async {
    try {
      await _api.postGroupsIdMembers(id: groupId, body: {'user_id': userId});
      return true;
    } catch (e) {
      _error = '添加成员失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 移出群成员
  Future<bool> removeGroupMember(String groupId, String userId) async {
    try {
      await _api.deleteGroupsIdMembersUserId(id: groupId, userId: userId);
      return true;
    } catch (e) {
      _error = '移除成员失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 修改成员角色（member / admin / owner）
  Future<bool> updateMemberRole(
    String groupId,
    String userId,
    String role,
  ) async {
    try {
      await _api.putGroupsIdMembersUserIdRole(
        id: groupId,
        userId: userId,
        body: {'role': role},
      );
      return true;
    } catch (e) {
      _error = '修改角色失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 退出群聊
  Future<bool> leaveGroup(String groupId) async {
    try {
      await _api.postGroupsIdLeave(id: groupId);
      return true;
    } catch (e) {
      _error = '退群失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 解散群聊（群主）
  Future<bool> disbandGroup(String groupId) async {
    try {
      await _api.deleteGroupsId(id: groupId);
      return true;
    } catch (e) {
      _error = '解散失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 搜索用户（加好友用）
  Future<List<Map<String, dynamic>>> searchUsers(String keyword) async {
    final res = await _api.getUsersSearch(keyword: keyword);
    // 搜索接口返回分页信封：data = {items, total, page, page_size, has_more}
    final data = _asMap(res['data']);
    return _asList(data['items']);
  }

  /// 发送好友请求
  Future<bool> sendFriendRequest(String userId) async {
    try {
      await _api.postFriendsRequests(body: {'friend_id': userId});
      return true;
    } catch (e) {
      _error = '发送好友请求失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 收到的好友请求
  Future<List<Map<String, dynamic>>> loadFriendRequests() async {
    final res = await _api.getFriendsRequests();
    // 返回 {pending: [...], sent: [...]}，这里只取收到的请求
    final data = _asMap(res['data']);
    return _asList(data['pending']);
  }

  /// 接受好友请求
  Future<bool> acceptFriendRequest(String requestId) async {
    try {
      await _api.postFriendsRequestsIdAccept(id: requestId);
      return true;
    } catch (e) {
      _error = '接受请求失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 拒绝好友请求
  Future<bool> rejectFriendRequest(String requestId) async {
    try {
      await _api.postFriendsRequestsIdReject(id: requestId);
      return true;
    } catch (e) {
      _error = '拒绝请求失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 删除好友
  Future<bool> deleteFriend(String userId) async {
    try {
      await _api.deleteFriendsId(id: userId);
      return true;
    } catch (e) {
      _error = '删除好友失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 黑名单
  Future<List<Map<String, dynamic>>> loadBlocklist() async {
    final res = await _api.getBlocklist();
    return _asList(res['data']);
  }

  /// 拉黑用户
  Future<bool> blockUser(String userId) async {
    try {
      await _api.postBlocklist(body: {'user_id': userId});
      return true;
    } catch (e) {
      _error = '拉黑失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 移出黑名单
  Future<bool> unblockUser(String userId) async {
    try {
      await _api.deleteBlocklistId(id: userId);
      return true;
    } catch (e) {
      _error = '解除拉黑失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 上传附件，返回服务端 data（含 url）
  Future<Map<String, dynamic>?> uploadAttachment({
    required List<int> bytes,
    required String filename,
    String type = 'file',
  }) async {
    try {
      return await uploadWithUploader(
        uploader: _uploader,
        baseUrl: _baseUrl,
        bytes: bytes,
        filename: filename,
        type: type,
        token: _api.token,
      );
    } catch (e) {
      _error = '上传失败：$e';
      notifyListeners();
      return null;
    }
  }

  /// 上传并发送一条附件消息。
  /// [kind] 取值：image / file / audio / video，与消息 type 一致。
  Future<bool> sendAttachment({
    required String conversationId,
    required List<int> bytes,
    required String filename,
    String kind = 'file',
  }) async {
    final uploaded = await uploadAttachment(
      bytes: bytes,
      filename: filename,
      type: kind,
    );
    if (uploaded == null) return false;

    final url = (_asString(uploaded['url']) ?? '');
    if (url.isEmpty) {
      _error = '上传响应缺少 url';
      notifyListeners();
      return false;
    }

    final ok = await sendMessagePayload({
      'conversation_id': conversationId,
      'type': kind,
      // 图片/语音/视频不需要把文件名当正文；普通文件展示文件名
      'content': kind == 'file' ? filename : '',
      'media_url': url,
      'file_name': _asString(uploaded['file_name']) ?? filename,
      'file_size': uploaded['file_size'] ?? bytes.length,
    });
    return ok;
  }

  /// 发送语音消息
  Future<bool> sendVoice({
    required String conversationId,
    required List<int> bytes,
    String filename = 'voice.m4a',
  }) {
    return sendAttachment(
      conversationId: conversationId,
      bytes: bytes,
      filename: filename,
      kind: 'audio',
    );
  }

  /// 发送视频消息
  Future<bool> sendVideo({
    required String conversationId,
    required List<int> bytes,
    required String filename,
  }) {
    return sendAttachment(
      conversationId: conversationId,
      bytes: bytes,
      filename: filename,
      kind: 'video',
    );
  }

  /// 发送一条自定义消息体（附件等场景复用）
  Future<bool> sendMessagePayload(Map<String, dynamic> body) async {
    try {
      await _api.postChatMessages(body: body);
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

  /// 发送「正在输入」状态（未建立实时连接时是空操作）
  void sendTyping(String conversationId, {bool typing = true}) {
    _realtime?.sendTyping(conversationId, typing: typing);
  }

  /// 建立实时连接；重连成功后自动补拉离线消息。
  Future<void> _connectRealtime(String token) async {
    final client = RealtimeClient(baseUrl: _baseUrl);
    _realtime = client;

    _realtimeStatusSub = client.statusStream.listen((status) {
      // 断线重连成功时补拉这期间错过的消息
      if (status == RealtimeStatus.connected && _lastSyncAt != null) {
        unawaited(syncOfflineMessages());
      }
    });
    _realtimeSub = client.events.listen((event) {
      if (event.type == 'new_message') {
        notifyListeners();
      }
    });

    try {
      await client.connect(token);
    } catch (e) {
      _error = '实时连接失败：$e';
      notifyListeners();
    }
  }

  Future<void> _disposeRealtime() async {
    await _realtimeSub?.cancel();
    await _realtimeStatusSub?.cancel();
    _realtimeSub = null;
    _realtimeStatusSub = null;
    final client = _realtime;
    _realtime = null;
    await client?.dispose();
  }

  void logout() {
    _token = null;
    _userId = null;
    _username = null;
    _lastSyncAt = null;
    _api.token = null;
    _error = null;
    unawaited(_disposeRealtime());
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
