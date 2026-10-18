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
}

void main() {
  test('登录成功后写入 token 与用户信息', () async {
    final session = NeoChatSession(api: _FakeApi());

    expect(session.isLoggedIn, isFalse);
    final ok = await session.login('alice', 'secret');

    expect(ok, isTrue);
    expect(session.isLoggedIn, isTrue);
    expect(session.api.token, 'token-1');
    expect(session.userId, 'user-1');
    expect(session.username, 'alice');
  });

  test('密码错误时返回 false 并记录错误', () async {
    final session = NeoChatSession(api: _FakeApi());

    final ok = await session.login('alice', 'wrong');

    expect(ok, isFalse);
    expect(session.isLoggedIn, isFalse);
    expect(session.error, contains('用户名或密码错误'));
  });

  test('会话列表解析', () async {
    final session = NeoChatSession(api: _FakeApi());

    final conversations = await session.loadConversations();

    expect(conversations, hasLength(1));
    expect(conversations.first['id'], 'conv-1');
    expect(conversations.first['unread_count'], 2);
  });

  test('离线补拉后更新同步游标', () async {
    final session = NeoChatSession(api: _FakeApi());
    expect(session.lastSyncAt, isNull);

    final count = await session.syncOfflineMessages();

    expect(count, 2);
    expect(session.lastSyncAt, '2026-10-18T10:00:00Z');
  });

  test('发送消息成功返回 true', () async {
    final session = NeoChatSession(api: _FakeApi());

    expect(await session.sendMessage('conv-1', 'hi'), isTrue);
  });

  test('登出后清空状态', () async {
    final session = NeoChatSession(api: _FakeApi());
    await session.login('alice', 'secret');
    await session.syncOfflineMessages();

    session.logout();

    expect(session.isLoggedIn, isFalse);
    expect(session.api.token, isNull);
    expect(session.lastSyncAt, isNull);
  });
}
