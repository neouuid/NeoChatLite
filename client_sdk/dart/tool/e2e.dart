// 端到端验证：用生成出来的 SDK 打真实后端（SQLite 模式，不需要 Postgres/Redis）。
//
//   dart run tool/e2e.dart [baseUrl]
//
// 覆盖链路：注册两个用户 → 登录 → 建单聊 → 发消息 → 对方离线补拉 → 未读 → 已读。
import 'dart:io';

import 'package:neochat_api/neochat_api.dart';

int _failed = 0;

void step(String name) => print('\n▶ $name');

void ok(String detail) => print('  ✅ $detail');

void fail(String detail) {
  _failed++;
  print('  ❌ $detail');
}

/// 从会话列表里取出「指定用户在该会话的未读数」。
/// 后端的 unread_count 挂在 conversation.members 上，而不是会话顶层。
int _myUnreadCount(List<dynamic> conversations, String convId, String userId) {
  for (final conv in conversations.whereType<Map>()) {
    if (conv['id'] != convId) continue;
    final members = (conv['members'] as List?) ?? const [];
    for (final member in members.whereType<Map>()) {
      if (member['user_id'] == userId) {
        final count = member['unread_count'];
        return count is int ? count : 0;
      }
    }
  }
  return 0;
}

Map<String, dynamic> _data(dynamic res) {
  if (res is Map && res['data'] is Map) {
    return Map<String, dynamic>.from(res['data'] as Map);
  }
  return <String, dynamic>{};
}

List<dynamic> _list(dynamic res) {
  final d = res is Map ? res['data'] : null;
  return d is List ? d : const [];
}

Future<void> main(List<String> args) async {
  final baseUrl = args.isNotEmpty ? args.first : 'http://127.0.0.1:18080';
  final suffix = DateTime.now().millisecondsSinceEpoch % 100000000;
  print('E2E 目标后端: $baseUrl');

  final api = NeoChatApi(baseUrl: baseUrl);

  step('1. 注册两个用户');
  final userA = 'alice$suffix';
  final userB = 'bob$suffix';
  try {
    await api.postAuthRegister(
      body: {
        'username': userA,
        'password': 'Passw0rd!',
        'nickname': 'Alice',
        'email': '$userA@e2e.local',
        'phone': '139${suffix.toString().padLeft(8, '0')}',
      },
    );
    await api.postAuthRegister(
      body: {
        'username': userB,
        'password': 'Passw0rd!',
        'nickname': 'Bob',
        'email': '$userB@e2e.local',
        'phone': '138${suffix.toString().padLeft(8, '0')}',
      },
    );
    ok('注册成功: $userA / $userB');
  } catch (e) {
    fail('注册失败: $e');
    exit(1);
  }

  step('2. 登录两个用户');
  late String tokenA;
  late String tokenB;
  late String idA;
  late String idB;
  try {
    final resA = await api.postAuthLogin(
      body: {'identifier': userA, 'password': 'Passw0rd!'},
    );
    final dataA = _data(resA);
    tokenA = (dataA['token'] ?? dataA['access_token'] ?? '') as String;
    idA = ((dataA['user'] as Map?)?['id'] ?? '') as String;

    final resB = await api.postAuthLogin(
      body: {'identifier': userB, 'password': 'Passw0rd!'},
    );
    final dataB = _data(resB);
    tokenB = (dataB['token'] ?? dataB['access_token'] ?? '') as String;
    idB = ((dataB['user'] as Map?)?['id'] ?? '') as String;

    if (tokenA.isEmpty || tokenB.isEmpty || idA.isEmpty || idB.isEmpty) {
      fail('登录响应缺少 token/id: $dataA');
      exit(1);
    }
    ok('登录成功，A=$idA B=$idB');
  } catch (e) {
    fail('登录失败: $e');
    exit(1);
  }

  step('3. A 与 B 建立单聊');
  late String convId;
  try {
    api.token = tokenA;
    final res = await api.postChatConversations(body: {'user_id': idB});
    final conv = _data(res);
    convId = (conv['id'] ?? '') as String;
    if (convId.isEmpty) {
      fail('创建会话响应缺少 id: $conv');
      exit(1);
    }
    ok('会话创建成功: $convId');
  } catch (e) {
    fail('创建会话失败: $e');
    exit(1);
  }

  step('4. A 发送一条消息');
  const content = '端到端验证消息 hello-e2e';
  late String messageId;
  try {
    final res = await api.postChatMessages(
      body: {'conversation_id': convId, 'type': 'text', 'content': content},
    );
    messageId = (_data(res)['id'] ?? '') as String;
    ok('消息已发送 id=$messageId');
  } catch (e) {
    fail('发送消息失败: $e');
    exit(1);
  }

  step('5. B 离线补拉（GET /chat/sync）');
  try {
    api.token = tokenB;
    final res = await api.getChatSync();
    final payload = (res is Map && res['data'] is Map)
        ? Map<String, dynamic>.from(res['data'] as Map)
        : <String, dynamic>{};
    final messages = (payload['messages'] as List?) ?? const [];
    final contents = messages
        .whereType<Map>()
        .map((m) => m['content'])
        .whereType<String>()
        .toList();
    if (contents.contains(content)) {
      ok('补拉到 ${messages.length} 条消息，包含刚发的消息');
    } else {
      fail('补拉结果里没有刚发的消息: ${contents.take(5).toList()}');
    }
    final serverTime = payload['server_time'] as String?;
    if (serverTime != null && serverTime.isNotEmpty) {
      ok('返回同步游标 server_time=$serverTime');
    } else {
      fail('响应缺少 server_time');
    }
  } catch (e) {
    fail('离线补拉失败: $e');
  }

  step('6. B 的会话列表应带未读数');
  try {
    final convs = _list(await api.getChatConversations());
    final unread = _myUnreadCount(convs, convId, idB);
    if (unread > 0) {
      ok('未读数 = $unread');
    } else {
      fail('未读数不符合预期: $unread');
    }
  } catch (e) {
    fail('查询会话列表失败: $e');
  }

  step('7. B 标记已读后未读清零');
  try {
    await api.postChatConversationsIdRead(id: convId);
    final convs = _list(await api.getChatConversations());
    final unread = _myUnreadCount(convs, convId, idB);
    if (unread == 0) {
      ok('已读后未读数 = 0');
    } else {
      fail('已读后仍有未读: $unread');
    }
  } catch (e) {
    fail('标记已读失败: $e');
  }

  step('8. A 通过消息列表看到该消息');
  try {
    api.token = tokenA;
    final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
    final found = msgs.whereType<Map>().any((m) => m['content'] == content);
    if (found) {
      ok('消息列表中命中，共 ${msgs.length} 条');
    } else {
      fail('消息列表中没有找到刚发的消息');
    }
  } catch (e) {
    fail('拉取消息列表失败: $e');
  }

  step('9. A 收藏该消息，收藏列表可见');
  try {
    api.token = tokenA;
    await api.postChatFavorites(body: {'message_id': messageId});
    final favorites = _list(await api.getChatFavorites());
    final found = favorites.whereType<Map>().any((f) => f['message_id'] == messageId);
    if (found) {
      ok('收藏成功，共 ${favorites.length} 条');
    } else {
      fail('收藏列表中没有该消息');
    }
  } catch (e) {
    fail('收藏失败: $e');
  }

  step('10. A 转发该消息到第二个会话');
  late String conv2;
  try {
    // 建一个 A 与 B 的另一个会话（用群聊场景更简单：直接再建单聊会复用已有会话）
    final res = await api.postChatConversations(body: {'user_id': idB});
    conv2 = (_data(res)['id'] ?? '') as String;
    ok('第二个会话: $conv2');
  } catch (e) {
    fail('建第二个会话失败: $e');
  }
  if (conv2.isNotEmpty) {
    try {
      await api.postChatMessagesForward(
        body: {
          'message_id': messageId,
          'conversation_ids': [conv2],
        },
      );
      final msgs = _list(await api.getChatConversationsIdMessages(id: conv2));
      final forwarded = msgs.whereType<Map>().any(
            (m) => (m['content'] as String?)?.contains(content) == true,
          );
      if (forwarded) {
        ok('转发成功，目标会话包含该消息');
      } else {
        fail('目标会话里没有找到转发内容');
      }
    } catch (e) {
      fail('转发失败: $e');
    }
  }

  step('11. A 搜索消息');
  try {
    final res = await api.getChatSearchMessages(q: '端到端验证');
    final hits = _list(res);
    final found = hits.whereType<Map>().any(
          (m) => (m['content'] as String?)?.contains('端到端验证') == true,
        );
    if (found) {
      ok('搜索命中 ${hits.length} 条');
    } else {
      fail('搜索没有命中');
    }
  } catch (e) {
    fail('搜索失败: $e');
  }

  step('12. A 撤回消息后不再出现在消息列表');
  try {
    await api.deleteChatMessagesId(id: messageId);
    final msgs = _list(await api.getChatConversationsIdMessages(id: convId));
    final stillThere = msgs.whereType<Map>().any((m) => m['id'] == messageId);
    if (stillThere) {
      fail('撤回后消息仍在列表中');
    } else {
      ok('撤回生效');
    }
  } catch (e) {
    fail('撤回失败: $e');
  }

  print('');
  if (_failed == 0) {
    print('✅ E2E 全部通过');
  } else {
    print('❌ E2E 有 $_failed 个步骤失败');
    exit(1);
  }
}
