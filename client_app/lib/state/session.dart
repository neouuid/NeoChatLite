import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:neochat_api/neochat_api.dart';

import 'refreshing_transport.dart';
import 'token_store.dart';

/// 客户端会话状态：登录态、当前用户、离线同步游标。
///
/// 只依赖 `neochat_api`（纯 Dart），不直接依赖具体页面，便于单独测试。
/// 待发送消息的状态
enum PendingSendStatus { sending, failed }

/// 一条排队中 / 发送失败的消息。
///
/// 网络抖动或服务端 5xx 时不能把消息丢掉：先留在队列里，
/// 自动退避重试，失败后仍然可见并可手动重试。
class PendingMessage {
  PendingMessage({
    required this.localId,
    required this.conversationId,
    required this.body,
    required this.preview,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  final String localId;
  final String conversationId;
  final Map<String, dynamic> body;

  /// 气泡里显示的文本（媒体消息用「[图片]」这类占位）
  final String preview;
  final DateTime createdAt;

  PendingSendStatus status = PendingSendStatus.sending;
  int attempts = 0;
  String? error;

  bool get isFailed => status == PendingSendStatus.failed;
}

class NeoChatSession extends ChangeNotifier {
  NeoChatSession({
    String? baseUrl,
    NeoChatApi? api,
    NeoChatApi? refreshApi,
    Uploader? uploader,
    TokenStore? tokenStore,
    bool enableRealtime = true,
  })  : _uploader = uploader ?? createDefaultUploader(),
        _tokenStore = tokenStore ?? PrefsTokenStore(),
        _baseUrl = baseUrl ?? defaultBaseUrl,
        _enableRealtime = enableRealtime {
    // 传输层里的 401 回调需要引用 this，因此放在构造体里赋值
    _api = api ??
        NeoChatApi(
          baseUrl: _baseUrl,
          transport: AuthRefreshingTransport(
            inner: createDefaultTransport(),
            onUnauthorized: () => _refreshAccessToken(),
          ),
        );
    _api.token = _token;
    _refreshApi = refreshApi;
  }

  /// 默认服务端地址，可通过 `--dart-define=NEOCHAT_BASE_URL=...` 覆盖
  static const String defaultBaseUrl = String.fromEnvironment(
    'NEOCHAT_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  late final NeoChatApi _api;
  NeoChatApi? _refreshApi;
  NeoChatApi get api => _api;

  final String _baseUrl;
  final Uploader _uploader;
  final TokenStore _tokenStore;
  String? _refreshToken;
  final bool _enableRealtime;

  /// conversationId -> 待发送/失败的消息（仅内存；重启后丢失）
  final Map<String, List<PendingMessage>> _pending = {};
  int _pendingSeq = 0;

  /// 自动重试的最大尝试次数（首次发送算第 1 次）
  static const int maxSendAttempts = 3;

  /// 退避间隔：第 n 次失败后等待
  static const List<Duration> retryBackoff = [
    Duration(seconds: 2),
    Duration(seconds: 5),
  ];

  /// 服务端地址（拼接上传后的相对 URL 用）
  String get baseUrl => _baseUrl;

  /// 把上传返回的相对路径拼成可访问 URL。
  ///
  /// 上传文件接口已改为鉴权访问，而 <img>/<video>/<audio> 无法设置请求头，
  /// 所以这里把 token 放进查询参数（与 WebSocket 同一取舍）。
  String fileUrl(String mediaUrl) {
    if (mediaUrl.isEmpty) return '';
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }
    final token = _token;
    final sep = mediaUrl.contains('?') ? '&' : '?';
    return token == null || token.isEmpty
        ? '$_baseUrl$mediaUrl'
        : '$_baseUrl$mediaUrl${sep}token=$token';
  }
  RealtimeClient? _realtime;
  StreamSubscription<RealtimeEvent>? _realtimeSub;
  StreamSubscription<RealtimeStatus>? _realtimeStatusSub;

  /// 实时事件流（未连接时为 null）
  Stream<RealtimeEvent>? get realtimeEvents => _realtime?.events;

  String? _token;
  String? _userId;
  String? _username;
  String? _nickname;
  String? _bio;
  String? _avatar;
  String? _lastSyncAt;
  bool _busy = false;
  String? _error;

  bool get isLoggedIn => _token != null && _token!.isNotEmpty;
  String? get userId => _userId;
  String? get username => _username;
  String? get nickname => _nickname;
  String? get bio => _bio;
  String? get avatar => _avatar;
  String? get lastSyncAt => _lastSyncAt;
  bool get busy => _busy;
  String? get error => _error;

  Future<bool> login(String identifier, String password) async {
    _setBusy(true);
    try {
      final res = await _api.postAuthLogin(
        body: {'identifier': identifier, 'password': password},
      );
      final ok = await _applyAuth(_asMap(res['data']));
      if (ok) _error = null;
      return ok;
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

  /// 注册并直接进入已登录状态（服务端注册接口返回 token）
  Future<bool> register({
    required String username,
    required String password,
    String? email,
    String? phone,
    String? nickname,
  }) async {
    _setBusy(true);
    try {
      final res = await _api.postAuthRegister(
        body: {
          'username': username,
          'password': password,
          if (email != null && email.isNotEmpty) 'email': email,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (nickname != null && nickname.isNotEmpty) 'nickname': nickname,
        },
      );
      final ok = await _applyAuth(_asMap(res['data']));
      if (ok) _error = null;
      return ok;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = '注册失败：$e';
      return false;
    } finally {
      _setBusy(false);
    }
  }

  /// 启动时恢复登录态（token 落盘在 TokenStore）
  Future<bool> restore() async {
    try {
      final saved = await _tokenStore.load();
      if (saved == null) return false;

      final token = _asString(saved['token']);
      if (token == null || token.isEmpty) return false;

      _token = token;
      _api.token = token;
      _refreshToken = _asString(saved['refresh_token']);
      _userId = _asString(saved['user_id']);
      _username = _asString(saved['username']);
      _nickname = _asString(saved['nickname']);
      _bio = _asString(saved['bio']);
      _avatar = _asString(saved['avatar']);
      _lastSyncAt = _asString(saved['last_sync_at']);
      notifyListeners();

      if (_enableRealtime) {
        unawaited(_connectRealtime(token));
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /// 把服务端返回的鉴权信息写入内存并持久化
  Future<bool> _applyAuth(Map<String, dynamic> data) async {
    final token = _asString(data['token']) ?? _asString(data['access_token']);
    if (token == null || token.isEmpty) {
      _error = '鉴权响应缺少 token';
      return false;
    }

    _token = token;
    _api.token = token;
    _refreshToken = _asString(data['refresh_token']);

    final user = _asMap(data['user']);
    _userId = _asString(user['id']);
    _username = _asString(user['username']);
    _nickname = _asString(user['nickname']);
    _bio = _asString(user['bio']);
    _avatar = _asString(user['avatar']);

    if (_enableRealtime) {
      unawaited(_connectRealtime(token));
    }
    await _persistAuth();
    notifyListeners();
    return true;
  }

  Future<void> _persistAuth() async {
    if (_token == null) return;
    await _tokenStore.save({
      'token': _token,
      'refresh_token': _refreshToken,
      'user_id': _userId,
      'username': _username,
      'nickname': _nickname,
      'bio': _bio,
      'avatar': _avatar,
      'last_sync_at': _lastSyncAt,
    });
  }

  /// 仅供测试：显式触发一次刷新（并发调用应只真正刷新一次）
  @visibleForTesting
  Future<String?> refreshAccessTokenForTest() => _refreshAccessToken();

  /// 刷新中的 Future：并发 401 只触发一次刷新。
  /// 刷新令牌是一次性的，多个请求同时刷新会被服务端判为重放并吊销全部令牌。
  Future<String?>? _refreshInFlight;

  Future<String?> _refreshAccessToken() {
    final inFlight = _refreshInFlight;
    if (inFlight != null) return inFlight;

    final future = _doRefreshAccessToken();
    _refreshInFlight = future;
    future.whenComplete(() {
      if (identical(_refreshInFlight, future)) _refreshInFlight = null;
    });
    return future;
  }

  Future<String?> _doRefreshAccessToken() async {
    final refresh = _refreshToken;
    if (refresh == null || refresh.isEmpty) {
      await _forceLogout();
      return null;
    }

    try {
      // 用不带刷新拦截的裸客户端，避免递归
      final raw = _refreshApi ??= NeoChatApi(
        baseUrl: _baseUrl,
        transport: createDefaultTransport(),
      );
      final res = await raw.postAuthRefresh(
        body: {'refresh_token': refresh},
      );
      final data = _asMap(res['data']);
      final token = _asString(data['access_token']) ?? _asString(data['token']);
      if (token == null || token.isEmpty) {
        await _forceLogout();
        return null;
      }

      _token = token;
      _api.token = token;
      _refreshToken = _asString(data['refresh_token']) ?? refresh;
      await _persistAuth();
      notifyListeners();

      if (_enableRealtime) {
        unawaited(_connectRealtime(token));
      }
      return token;
    } catch (_) {
      await _forceLogout();
      return null;
    }
  }

  /// 被动登出（刷新失败）：清状态并回到登录页
  Future<void> _forceLogout() async {
    await _tokenStore.clear();
    _token = null;
    _refreshToken = null;
    _userId = null;
    _username = null;
    _nickname = null;
    _bio = null;
    _avatar = null;
    _api.token = null;
    _error = '登录已过期，请重新登录';
    unawaited(_disposeRealtime());
    notifyListeners();
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

  /// 发送文本消息；[replyToId] 非空时作为引用回复
  /// 某会话的待发送/失败消息（按创建时间升序）
  List<PendingMessage> pendingFor(String conversationId) =>
      List.unmodifiable(_pending[conversationId] ?? const <PendingMessage>[]);

  /// 所有会话的待发送数量（用于顶栏提示）
  int get pendingCount =>
      _pending.values.fold(0, (sum, list) => sum + list.length);

  /// 发送文本消息。
  ///
  /// 消息先进入待发送队列，因此这里返回 true 表示「已受理」，
  /// 真正的发送结果看 [pendingFor] 里的状态。
  Future<bool> sendMessage(
    String conversationId,
    String content, {
    String? replyToId,
  }) async {
    return _enqueue(
      conversationId,
      {
        'conversation_id': conversationId,
        'content': content,
        'type': 'text',
        if (replyToId != null && replyToId.isNotEmpty) 'reply_to_id': replyToId,
      },
      preview: content,
    );
  }

  /// 把消息放入队列并尝试发送。
  Future<bool> _enqueue(
    String conversationId,
    Map<String, dynamic> body, {
    required String preview,
  }) async {
    final pending = PendingMessage(
      // localId 同时作为服务端幂等键，必须跨设备/跨次启动唯一
      localId: 'local-${DateTime.now().microsecondsSinceEpoch}-${++_pendingSeq}',
      conversationId: conversationId,
      body: body,
      preview: preview,
    );
    // 幂等键一并放进请求体：重试时服务端据此去重，避免产生重复消息
    pending.body['client_msg_id'] = pending.localId;

    _pending.putIfAbsent(conversationId, () => []).add(pending);
    notifyListeners();

    await _attemptSend(pending);
    return true;
  }

  /// 单次发送尝试；失败时按需安排退避重试
  Future<void> _attemptSend(PendingMessage pending, {bool autoRetry = true}) async {
    pending.status = PendingSendStatus.sending;
    pending.error = null;
    pending.attempts++;
    notifyListeners();

    try {
      await _api.postChatMessages(body: pending.body);
      _removePending(pending);
      return;
    } catch (e) {
      pending.status = PendingSendStatus.failed;
      pending.error = _describeSendError(e);

      final retryable = _isRetryable(e);
      final canRetry = autoRetry &&
          retryable &&
          pending.attempts < maxSendAttempts &&
          isLoggedIn;

      notifyListeners();

      if (canRetry) {
        // 退避后自动重试；期间用户也可以手动点重试，先移除旧的定时任务
        final delay = retryBackoff[
            (pending.attempts - 1).clamp(0, retryBackoff.length - 1)];
        final seq = pending.attempts;
        unawaited(Future<void>.delayed(delay, () async {
          if (pending.attempts != seq) return; // 已被手动重试接手
          if (!_pendingContains(pending)) return;
          await _attemptSend(pending);
        }));
      }
    }
  }

  /// 重试一条失败的消息
  Future<bool> retryPending(String localId) async {
    // 快照：发送过程会修改 _pending，直接迭代会触发并发修改错误
    for (final list in _pending.values.toList()) {
      for (final pending in list.toList()) {
        if (pending.localId != localId) continue;
        pending.attempts = 0;
        await _attemptSend(pending, autoRetry: false);
        return !pending.isFailed;
      }
    }
    return false;
  }

  /// 放弃一条失败的消息（从队列中移除）
  void discardPending(String localId) {
    final emptyKeys = <String>[];
    for (final entry in _pending.entries) {
      entry.value.removeWhere((p) => p.localId == localId);
      if (entry.value.isEmpty) emptyKeys.add(entry.key);
    }
    for (final key in emptyKeys) {
      _pending.remove(key);
    }
    notifyListeners();
  }

  /// 把某个会话（或全部）的失败消息重新发一遍，用于重连后补发
  Future<void> flushPending([String? conversationId]) async {
    final conversations = conversationId != null
        ? [conversationId]
        : _pending.keys.toList();
    for (final convId in conversations) {
      final items = List<PendingMessage>.from(_pending[convId] ?? const []);
      for (final pending in items) {
        if (pending.isFailed) {
          pending.attempts = 0;
          await _attemptSend(pending, autoRetry: false);
        }
      }
    }
  }

  bool _pendingContains(PendingMessage target) {
    for (final list in _pending.values.toList()) {
      if (list.any((p) => p.localId == target.localId)) return true;
    }
    return false;
  }

  void _removePending(PendingMessage target) {
    final emptyKeys = <String>[];
    for (final entry in _pending.entries) {
      entry.value.removeWhere((p) => p.localId == target.localId);
      if (entry.value.isEmpty) emptyKeys.add(entry.key);
    }
    // 先收集再删除：在迭代 map 时删除会抛 ConcurrentModificationError
    for (final key in emptyKeys) {
      _pending.remove(key);
    }
    notifyListeners();
  }

  /// 只有网络错误 / 限流 / 服务端 5xx 值得重试；4xx 参数错误重试也没用
  bool _isRetryable(Object error) {
    if (error is! ApiException) return true; // 网络层异常，重试
    final code = error.statusCode;
    return code == 0 || code == 408 || code == 429 || code >= 500;
  }

  String _describeSendError(Object error) {
    if (error is ApiException) {
      if (error.statusCode == 429) return '发送过于频繁，稍后自动重试';
      if (error.statusCode >= 500) return '服务暂时不可用，稍后自动重试';
      return error.message;
    }
    return '网络异常，稍后自动重试';
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

  /// 修改密码。成功后服务端会吊销全部 refresh token，
  /// 因此客户端也主动清空登录态，要求用新密码重新登录。
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      await _api.postAuthChangePassword(
        body: {'old_password': oldPassword, 'new_password': newPassword},
      );
      await logout();
      return true;
    } catch (e) {
      _error = '修改密码失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 请求密码重置。开发环境（未配置 SMTP）服务端会回传 token，
  /// 生产环境只发邮件、响应里没有 token。
  Future<String?> requestPasswordReset(String email) async {
    try {
      final res = await _api.postAuthForgotPassword(body: {'email': email});
      final data = _asMap(res['data']);
      return _asString(data['token']);
    } catch (e) {
      _error = '发送重置请求失败：$e';
      notifyListeners();
      return null;
    }
  }

  /// 用重置令牌设置新密码
  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _api.postAuthResetPassword(
        body: {'token': token, 'new_password': newPassword},
      );
      return true;
    } catch (e) {
      _error = '重置密码失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 注销账号（软删除）。需要密码确认。
  Future<bool> deleteAccount(String password) async {
    try {
      await _api.postAuthDeleteAccount(body: {'password': password});
      await logout();
      return true;
    } catch (e) {
      _error = '注销失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 编辑自己发送的文本消息
  Future<bool> editMessage(String messageId, String content) async {
    try {
      await _api.putChatMessagesId(id: messageId, body: {'content': content});
      return true;
    } catch (e) {
      _error = '编辑消息失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 查看他人资料
  Future<Map<String, dynamic>?> loadUserProfile(String userId) async {
    try {
      final res = await _api.getUsersId(id: userId);
      return _asMap(res['data']);
    } catch (e) {
      _error = '加载用户资料失败：$e';
      notifyListeners();
      return null;
    }
  }

  /// 搜索群（按群名）
  Future<List<Map<String, dynamic>>> searchGroups(String keyword) async {
    final res = await _api.getChatSearchGroups(q: keyword);
    return _asList(res['data']);
  }

  /// 修改群资料（群名 / 描述 / 头像），仅群主与管理员可用
  Future<bool> updateGroup(
    String groupId, {
    String? name,
    String? description,
    String? avatar,
  }) async {
    try {
      await _api.putGroupsId(
        id: groupId,
        body: {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
          if (avatar != null) 'avatar': avatar,
        },
      );
      return true;
    } catch (e) {
      _error = '修改群资料失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 修改个人资料（昵称 / 签名 / 头像）
  Future<bool> updateProfile({
    String? nickname,
    String? bio,
    String? avatar,
  }) async {
    try {
      await _api.putUsersProfile(
        body: {
          if (nickname != null) 'nickname': nickname,
          if (bio != null) 'bio': bio,
          if (avatar != null) 'avatar': avatar,
        },
      );
      if (nickname != null) _nickname = nickname;
      if (bio != null) _bio = bio;
      if (avatar != null) _avatar = avatar;
      notifyListeners();
      return true;
    } catch (e) {
      _error = '修改资料失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 设置会话置顶（置顶会话排在列表最前）
  Future<bool> setConversationPinned(String conversationId, bool pinned) async {
    try {
      await _api.putChatConversationsIdPin(
        id: conversationId,
        body: {'pinned': pinned},
      );
      return true;
    } catch (e) {
      _error = '设置置顶失败：$e';
      notifyListeners();
      return false;
    }
  }

  /// 设置会话免打扰
  Future<bool> setConversationMuted(String conversationId, bool muted) async {
    try {
      await _api.putChatConversationsIdMute(
        id: conversationId,
        body: {'muted': muted},
      );
      return true;
    } catch (e) {
      _error = '设置免打扰失败：$e';
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

    const previews = {
      'image': '[图片]',
      'audio': '[语音]',
      'video': '[视频]',
      'file': '[文件]',
    };
    final ok = await sendMessagePayload(
      {
        'conversation_id': conversationId,
        'type': kind,
        // 图片/语音/视频不需要把文件名当正文；普通文件展示文件名
        'content': kind == 'file' ? filename : '',
        'media_url': url,
        'file_name': _asString(uploaded['file_name']) ?? filename,
        'file_size': uploaded['file_size'] ?? bytes.length,
      },
      preview: kind == 'file' ? '[文件] $filename' : (previews[kind] ?? '[消息]'),
    );
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
  Future<bool> sendMessagePayload(
    Map<String, dynamic> body, {
    String preview = '[消息]',
  }) async {
    final convId = (body['conversation_id'] as String?) ?? '';
    return _enqueue(convId, body, preview: preview);
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
      if (status == RealtimeStatus.connected) {
        if (_lastSyncAt != null) unawaited(syncOfflineMessages());
        // 网络恢复后把之前失败的发送补一遍
        unawaited(flushPending());
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

  Future<void> logout() async {
    _pending.clear();
    // 先通知服务端（失败也无所谓），再清本地
    try {
      await _api.postAuthLogout();
    } catch (_) {}

    final hadToken = _token;
    _token = null;
    _refreshToken = null;
    _userId = null;
    _nickname = null;
    _bio = null;
    _avatar = null;
    _username = null;
    _lastSyncAt = null;
    _api.token = null;
    _error = null;
    await _tokenStore.clear();
    unawaited(_disposeRealtime());
    if (hadToken != null) notifyListeners();
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
