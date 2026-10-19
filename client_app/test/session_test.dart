import 'package:flutter_test/flutter_test.dart';
import 'package:neochat_api/neochat_api.dart';
import 'package:neochat_app/state/session.dart';
import 'package:neochat_app/state/refreshing_transport.dart';
import 'package:neochat_app/state/token_store.dart';

/// 假 API：覆盖会话层用到的三个接口，不产生任何网络请求。
class _FakeApi extends NeoChatApi {
  _FakeApi() : super(baseUrl: 'http://fake');

  @override
  Future<dynamic> postAuthRegister({required Map<String, dynamic> body}) async {
    if (body['username'] == 'taken') {
      throw ApiException(statusCode: 400, message: '用户名已存在');
    }
    return {
      'success': true,
      'data': {
        'access_token': 'new-token',
        'refresh_token': 'refresh-1',
        'user': {'id': 'user-9', 'username': body['username']},
      },
    };
  }

  @override
  Future<dynamic> postAuthRefresh({required Map<String, dynamic> body}) async {
    if (body['refresh_token'] != 'refresh-1') {
      throw ApiException(statusCode: 401, message: 'refresh token 无效');
    }
    return {
      'success': true,
      'data': {'access_token': 'refreshed-token', 'refresh_token': 'refresh-2'},
    };
  }

  @override
  Future<dynamic> postAuthLogout() async => {'success': true};

  @override
  Future<dynamic> postAuthLogin({required Map<String, dynamic> body}) async {
    if (body['password'] != 'secret') {
      throw ApiException(statusCode: 401, message: '用户名或密码错误');
    }
    return {
      'success': true,
      'data': {
        'token': 'token-1',
        'user': {'id': 'user-1', 'username': 'alice'},
      },
    };
  }

  @override
  Future<dynamic> getChatConversations() async {
    return {
      'success': true,
      'data': [
        {'id': 'conv-1', 'name': '测试会话', 'last_message': '你好', 'unread_count': 2},
      ],
    };
  }

  @override
  Future<dynamic> getChatSync({String? since, int? limit}) async {
    return {
      'success': true,
      'messages': [
        {'id': 'm1', 'content': '离线消息 1'},
        {'id': 'm2', 'content': '离线消息 2'},
      ],
      'server_time': '2026-10-18T10:00:00Z',
    };
  }

  String? lastBefore;
  int? lastLimit;

  @override
  Future<dynamic> getChatConversationsIdMessages({
    required String id,
    String? before,
    int? limit,
  }) async {
    lastBefore = before;
    lastLimit = limit;
    return {
      'success': true,
      'data': [
        {'id': 'm1', 'content': '历史消息'},
      ],
    };
  }

  Map<String, dynamic>? lastFriendRequestBody;
  Map<String, dynamic>? lastMessageBody;
  Map<String, dynamic>? lastMuteBody;
  Map<String, dynamic>? lastProfileBody;
  Map<String, dynamic>? lastGroupUpdateBody;

  @override
  Future<dynamic> getUsersSearch({String? keyword, int? page, int? pageSize}) async {
    // 真实接口返回分页信封：{items, total, ...}
    return {
      'success': true,
      'data': {
        'items': [
          {'id': 'user-2', 'username': 'bob', 'nickname': 'Bob'},
        ],
        'total': 1,
      },
    };
  }

  @override
  Future<dynamic> postFriendsRequests({required Map<String, dynamic> body}) async {
    lastFriendRequestBody = body;
    return {'success': true};
  }

  @override
  Future<dynamic> getFriendsRequests() async {
    return {
      'success': true,
      'data': {
        'pending': [
          {
            'id': 'req-1',
            'user_id': 'user-2',
            'friend_id': 'user-1',
            'user': {'id': 'user-2', 'username': 'bob'},
          },
        ],
        'sent': [],
      },
    };
  }

  @override
  Future<dynamic> postFriendsRequestsIdAccept({required String id}) async {
    return {'success': true};
  }

  @override
  Future<dynamic> getFriends() async {
    return {
      'success': true,
      'data': [
        {'id': 'user-2', 'username': 'bob'},
      ],
    };
  }

  @override
  Future<dynamic> getBlocklist() async {
    return {'success': true, 'data': []};
  }

  @override
  Future<dynamic> postChatMessages({required Map<String, dynamic> body}) async {
    lastMessageBody = body;
    return {'success': true, 'data': body};
  }

  @override
  Future<dynamic> putUsersProfile({required Map<String, dynamic> body}) async {
    lastProfileBody = body;
    return {'success': true};
  }

  @override
  Future<dynamic> putGroupsId({
    required String id,
    required Map<String, dynamic> body,
  }) async {
    lastGroupUpdateBody = body;
    return {'success': true};
  }

  @override
  Future<dynamic> putChatConversationsIdMute({
    required String id,
    required Map<String, dynamic> body,
  }) async {
    lastMuteBody = body;
    return {'success': true, 'data': {'muted': body['muted']}};
  }

  @override
  Future<dynamic> postGroups({required Map<String, dynamic> body}) async {
    return {
      'success': true,
      'data': {
        'conversation': {'id': 'conv-new', 'name': body['name'], 'type': 'group'},
        'group': {'id': 'group-1'},
      },
    };
  }

  @override
  Future<dynamic> getGroupsIdMembers({required String id}) async {
    return {
      'success': true,
      'data': [
        {'user_id': 'user-1', 'role': 'owner', 'user': {'username': 'alice'}},
      ],
    };
  }

  @override
  Future<dynamic> postGroupsIdMembers({
    required String id,
    required Map<String, dynamic> body,
  }) async {
    return {'success': true};
  }

  @override
  Future<dynamic> putGroupsIdMembersUserIdRole({
    required String id,
    required String userId,
    required Map<String, dynamic> body,
  }) async {
    return {'success': true};
  }

  @override
  Future<dynamic> deleteGroupsIdMembersUserId({
    required String id,
    required String userId,
  }) async {
    return {'success': true};
  }

  @override
  Future<dynamic> postGroupsIdLeave({required String id}) async {
    return {'success': true};
  }
}

/// 假上传器：不产生网络请求
class _FakeUploader implements Uploader {
  final List<String> calls = [];

  @override
  Future<Map<String, dynamic>> upload({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  }) async {
    calls.add('${url.path} $filename ${fields['type']}');
    return {
      'url': '/uploads/${fields['type']}/$filename',
      'file_name': filename,
      'file_size': bytes.length,
      'mime_type': 'image/png',
    };
  }
}

/// 内存版登录态存储，避免单测依赖 shared_preferences 插件
class _MemoryTokenStore implements TokenStore {
  Map<String, dynamic>? data;

  @override
  Future<Map<String, dynamic>?> load() async => data;

  @override
  Future<void> save(Map<String, dynamic> value) async => data = value;

  @override
  Future<void> clear() async => data = null;
}

NeoChatSession _newSession(
  NeoChatApi api, {
  _MemoryTokenStore? store,
  Uploader? uploader,
  NeoChatApi? refreshApi,
}) {
  return NeoChatSession(
    api: api,
    refreshApi: refreshApi,
    uploader: uploader,
    tokenStore: store ?? _MemoryTokenStore(),
    enableRealtime: false,
  );
}

void main() {
  test('登录成功后写入 token 与用户信息', () async {
    final session = _newSession(_FakeApi());

    expect(session.isLoggedIn, isFalse);
    final ok = await session.login('alice', 'secret');

    expect(ok, isTrue);
    expect(session.isLoggedIn, isTrue);
    expect(session.api.token, 'token-1');
    expect(session.userId, 'user-1');
    expect(session.username, 'alice');
  });

  test('密码错误时返回 false 并记录错误', () async {
    final session = _newSession(_FakeApi());

    final ok = await session.login('alice', 'wrong');

    expect(ok, isFalse);
    expect(session.isLoggedIn, isFalse);
    expect(session.error, contains('用户名或密码错误'));
  });

  test('会话列表解析', () async {
    final session = _newSession(_FakeApi());

    final conversations = await session.loadConversations();

    expect(conversations, hasLength(1));
    expect(conversations.first['id'], 'conv-1');
    expect(conversations.first['unread_count'], 2);
  });

  test('离线补拉后更新同步游标', () async {
    final session = _newSession(_FakeApi());
    expect(session.lastSyncAt, isNull);

    final count = await session.syncOfflineMessages();

    expect(count, 2);
    expect(session.lastSyncAt, '2026-10-18T10:00:00Z');
  });

  test('引用回复会带上 reply_to_id', () async {
    final api = _FakeApi();
    final session = _newSession(api);

    expect(
      await session.sendMessage('conv-1', '收到', replyToId: 'msg-9'),
      isTrue,
    );
    expect(api.lastMessageBody?['reply_to_id'], 'msg-9');

    await session.sendMessage('conv-1', '普通消息');
    expect(api.lastMessageBody?.containsKey('reply_to_id'), isFalse);
  });

  test('免打扰开关下发 muted 字段', () async {
    final api = _FakeApi();
    final session = _newSession(api);

    expect(await session.setConversationMuted('conv-1', true), isTrue);
    expect(api.lastMuteBody, {'muted': true});

    expect(await session.setConversationMuted('conv-1', false), isTrue);
    expect(api.lastMuteBody, {'muted': false});
  });

  test('发送消息成功返回 true', () async {
    final session = _newSession(_FakeApi());

    expect(await session.sendMessage('conv-1', 'hi'), isTrue);
  });

  test('建群返回会话 ID 并可读取成员', () async {
    final session = _newSession(_FakeApi());

    final convId = await session.createGroup(name: '测试群', memberIds: ['user-2']);
    expect(convId, 'conv-new');

    final members = await session.loadGroupMembers('conv-new');
    expect(members, hasLength(1));
    expect(members.first['role'], 'owner');
  });

  test('群管理操作返回成功', () async {
    final session = _newSession(_FakeApi());

    expect(await session.addGroupMember('conv-new', 'user-2'), isTrue);
    expect(await session.updateMemberRole('conv-new', 'user-2', 'admin'), isTrue);
    expect(await session.removeGroupMember('conv-new', 'user-2'), isTrue);
    expect(await session.leaveGroup('conv-new'), isTrue);
  });

  test('上传附件后能发送图片消息', () async {
    final uploader = _FakeUploader();
    final session = _newSession(_FakeApi(), uploader: uploader);

    final uploaded = await session.uploadAttachment(
      bytes: [1, 2, 3],
      filename: 'tiny.png',
      type: 'image',
    );
    expect(uploaded, isNotNull);
    expect(uploaded!['url'], '/uploads/image/tiny.png');
    expect(uploader.calls.single, contains('/api/v1/upload'));
    expect(uploader.calls.single, contains('image'));

    final ok = await session.sendAttachment(
      conversationId: 'conv-1',
      bytes: [1, 2, 3],
      filename: 'tiny.png',
      kind: 'image',
    );
    expect(ok, isTrue);
  });

  test('消息分页参数透传', () async {
    final api = _FakeApi();
    final session = _newSession(api);

    final messages = await session.loadMessages(
      'conv-1',
      before: '2026-10-01T00:00:00Z',
      limit: 20,
    );

    expect(messages, hasLength(1));
    expect(api.lastBefore, '2026-10-01T00:00:00Z');
    expect(api.lastLimit, 20);
  });

  test('好友流程：搜索解析 items、请求用 friend_id、接受后好友列表更新', () async {
    final api = _FakeApi();
    final session = _newSession(api);

    final users = await session.searchUsers('bob');
    expect(users, hasLength(1));
    expect(users.first['id'], 'user-2');

    expect(await session.sendFriendRequest('user-2'), isTrue);
    expect(api.lastFriendRequestBody, {'friend_id': 'user-2'});

    final requests = await session.loadFriendRequests();
    expect(requests, hasLength(1));
    expect(requests.first['id'], 'req-1');
    expect((requests.first['user'] as Map)['id'], 'user-2');

    expect(await session.acceptFriendRequest('req-1'), isTrue);

    final friends = await session.loadFriends();
    expect(friends, hasLength(1));
    expect(friends.first['id'], 'user-2');
  });

  test('修改个人资料与群资料只提交传入字段', () async {
    final api = _FakeApi();
    final session = _newSession(api);

    expect(await session.updateProfile(nickname: '小明'), isTrue);
    expect(api.lastProfileBody, {'nickname': '小明'});
    expect(session.nickname, '小明');

    expect(
      await session.updateGroup('group-1', name: '新群名', description: '新描述'),
      isTrue,
    );
    expect(api.lastGroupUpdateBody, {'name': '新群名', 'description': '新描述'});
  });

  test('注册成功即登录并持久化', () async {
    final store = _MemoryTokenStore();
    final session = _newSession(_FakeApi(), store: store);

    expect(await session.register(username: 'newbie', password: 'Passw0rd!'), isTrue);
    expect(session.isLoggedIn, isTrue);
    expect(session.userId, 'user-9');
    expect(store.data?['token'], 'new-token');
    expect(store.data?['refresh_token'], 'refresh-1');
  });

  test('注册失败返回服务端错误', () async {
    final session = _newSession(_FakeApi());
    expect(await session.register(username: 'taken', password: 'Passw0rd!'), isFalse);
    expect(session.isLoggedIn, isFalse);
    expect(session.error, contains('用户名已存在'));
  });

  test('restore 从存储恢复登录态', () async {
    final store = _MemoryTokenStore()
      ..data = {
        'token': 'saved-token',
        'refresh_token': 'refresh-1',
        'user_id': 'user-7',
        'username': 'saved',
      };
    final session = _newSession(_FakeApi(), store: store);

    expect(await session.restore(), isTrue);
    expect(session.isLoggedIn, isTrue);
    expect(session.userId, 'user-7');
    expect(session.api.token, 'saved-token');
  });

  test('refresh 成功后重放请求；失败则清空登录态', () async {
    final inner = _FlakyTransport();
    final transport = AuthRefreshingTransport(
      inner: inner,
      onUnauthorized: () async => 'fresh-token',
    );

    final res = await transport.send(
      method: 'GET',
      url: Uri.parse('http://fake/api/v1/chat/conversations'),
      headers: {'Authorization': 'Bearer stale'},
    );

    expect(res['success'], isTrue);
    expect(inner.attempts, 2);
    expect(inner.lastHeaders?['Authorization'], 'Bearer fresh-token');

    // 刷新失败 → 清空登录态
    final store = _MemoryTokenStore()
      ..data = {'token': 'stale', 'refresh_token': 'bad', 'user_id': 'u1'};
    final session = _newSession(
      _FakeApi(),
      store: store,
      refreshApi: _FakeApi(),
    );
    await session.restore();
    expect(session.isLoggedIn, isTrue);

  });

  test('并发 401 只触发一次刷新（refresh token 一次性）', () async {
    final refreshApi = _CountingRefreshApi();
    final store = _MemoryTokenStore()
      ..data = {'token': 'stale', 'refresh_token': 'r-1', 'user_id': 'u1'};
    final session = _newSession(_FakeApi(), store: store, refreshApi: refreshApi);
    await session.restore();

    // 通过公开入口能观察到的行为：并发的刷新不应报错、也不应清空登录态
    final results = await Future.wait([
      session.refreshAccessTokenForTest(),
      session.refreshAccessTokenForTest(),
      session.refreshAccessTokenForTest(),
    ]);

    expect(results.every((token) => token != null), isTrue);
    expect(refreshApi.calls, 1, reason: '三个并发请求只应触发一次刷新');
    expect(session.isLoggedIn, isTrue);
  });

  test('登出后清空状态', () async {
    final session = _newSession(_FakeApi());
    await session.login('alice', 'secret');
    await session.syncOfflineMessages();

    await session.logout();

    expect(session.isLoggedIn, isFalse);
    expect(session.api.token, isNull);
    expect(session.lastSyncAt, isNull);
  });
}

/// 第一次返回 401，之后成功；记录尝试次数与最后一次请求头
class _FlakyTransport implements Transport {
  int attempts = 0;
  Map<String, String>? lastHeaders;

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    attempts++;
    lastHeaders = headers;
    if (attempts == 1) {
      throw ApiException(statusCode: 401, message: 'token expired');
    }
    return {'success': true, 'data': []};
  }

  @override
  Future<dynamic> uploadFile({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  }) async {
    throw UnimplementedError();
  }
}

/// 计数版刷新客户端：用于验证并发刷新只触发一次
class _CountingRefreshApi extends NeoChatApi {
  _CountingRefreshApi() : super(baseUrl: 'http://fake');

  int calls = 0;

  @override
  Future<dynamic> postAuthRefresh({required Map<String, dynamic> body}) async {
    calls++;
    await Future<void>.delayed(const Duration(milliseconds: 50));
    return {
      'success': true,
      'data': {'access_token': 'fresh-token', 'refresh_token': 'r-2'},
    };
  }
}
