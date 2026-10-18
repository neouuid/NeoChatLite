import 'package:flutter_test/flutter_test.dart';
import 'package:neochat_api/neochat_api.dart';
import 'package:neochat_app/state/session.dart';

/// 假 API：覆盖会话层用到的三个接口，不产生任何网络请求。
class _FakeApi extends NeoChatApi {
  _FakeApi() : super(baseUrl: 'http://fake');

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

  @override
  Future<dynamic> postChatMessages({required Map<String, dynamic> body}) async {
    return {'success': true, 'data': body};
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

void main() {
  test('登录成功后写入 token 与用户信息', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    expect(session.isLoggedIn, isFalse);
    final ok = await session.login('alice', 'secret');

    expect(ok, isTrue);
    expect(session.isLoggedIn, isTrue);
    expect(session.api.token, 'token-1');
    expect(session.userId, 'user-1');
    expect(session.username, 'alice');
  });

  test('密码错误时返回 false 并记录错误', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    final ok = await session.login('alice', 'wrong');

    expect(ok, isFalse);
    expect(session.isLoggedIn, isFalse);
    expect(session.error, contains('用户名或密码错误'));
  });

  test('会话列表解析', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    final conversations = await session.loadConversations();

    expect(conversations, hasLength(1));
    expect(conversations.first['id'], 'conv-1');
    expect(conversations.first['unread_count'], 2);
  });

  test('离线补拉后更新同步游标', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);
    expect(session.lastSyncAt, isNull);

    final count = await session.syncOfflineMessages();

    expect(count, 2);
    expect(session.lastSyncAt, '2026-10-18T10:00:00Z');
  });

  test('发送消息成功返回 true', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    expect(await session.sendMessage('conv-1', 'hi'), isTrue);
  });

  test('建群返回会话 ID 并可读取成员', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    final convId = await session.createGroup(name: '测试群', memberIds: ['user-2']);
    expect(convId, 'conv-new');

    final members = await session.loadGroupMembers('conv-new');
    expect(members, hasLength(1));
    expect(members.first['role'], 'owner');
  });

  test('群管理操作返回成功', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);

    expect(await session.addGroupMember('conv-new', 'user-2'), isTrue);
    expect(await session.updateMemberRole('conv-new', 'user-2', 'admin'), isTrue);
    expect(await session.removeGroupMember('conv-new', 'user-2'), isTrue);
    expect(await session.leaveGroup('conv-new'), isTrue);
  });

  test('登出后清空状态', () async {
    final session = NeoChatSession(api: _FakeApi(), enableRealtime: false);
    await session.login('alice', 'secret');
    await session.syncOfflineMessages();

    session.logout();

    expect(session.isLoggedIn, isFalse);
    expect(session.api.token, isNull);
    expect(session.lastSyncAt, isNull);
  });
}
