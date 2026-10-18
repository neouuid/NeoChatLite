// 实时消息端到端验证：
//   dart run tool/e2e_realtime.dart [baseUrl]
//
// 覆盖：注册/登录 → 建会话 → 双方建立 WebSocket →
//       发送消息(new_message) → 正在输入(typing) → 已读回执(message_read)
import 'dart:async';
import 'dart:io';

import 'package:neochat_api/neochat_api.dart';

int _failed = 0;

void step(String name) => print('\n▶ $name');

void ok(String detail) => print('  ✅ $detail');

void fail(String detail) {
  _failed++;
  print('  ❌ $detail');
}

Map<String, dynamic> _data(dynamic res) {
  if (res is Map && res['data'] is Map) {
    return Map<String, dynamic>.from(res['data'] as Map);
  }
  return <String, dynamic>{};
}

/// 在超时时间内等待满足条件的事件
Future<RealtimeEvent?> _waitFor(
  List<RealtimeEvent> events,
  bool Function(RealtimeEvent) predicate, {
  Duration timeout = const Duration(seconds: 5),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    for (final event in events) {
      if (predicate(event)) return event;
    }
    await Future<void>.delayed(const Duration(milliseconds: 120));
  }
  return null;
}

Future<void> main(List<String> args) async {
  final baseUrl = args.isNotEmpty ? args.first : 'http://127.0.0.1:18080';
  final suffix = DateTime.now().millisecondsSinceEpoch % 100000000;
  print('实时 E2E 目标后端: $baseUrl');

  final api = NeoChatApi(baseUrl: baseUrl);
  final userA = 'rt_a$suffix';
  final userB = 'rt_b$suffix';

  step('1. 注册并登录两个用户');
  late String tokenA;
  late String tokenB;
  late String idB;
  try {
    for (final entry in [
      {'username': userA, 'phone': '135${suffix.toString().padLeft(8, '0')}'},
      {'username': userB, 'phone': '134${suffix.toString().padLeft(8, '0')}'},
    ]) {
      await api.postAuthRegister(
        body: {
          'username': entry['username'],
          'password': 'Passw0rd!',
          'email': '${entry['username']}@e2e.local',
          'phone': entry['phone'],
        },
      );
    }
    final resA = _data(
      await api.postAuthLogin(
        body: {'identifier': userA, 'password': 'Passw0rd!'},
      ),
    );
    final resB = _data(
      await api.postAuthLogin(
        body: {'identifier': userB, 'password': 'Passw0rd!'},
      ),
    );
    tokenA = (resA['access_token'] ?? '') as String;
    tokenB = (resB['access_token'] ?? '') as String;
    idB = ((resB['user'] as Map?)?['id'] ?? '') as String;
    if (tokenA.isEmpty || tokenB.isEmpty) {
      fail('登录失败');
      exit(1);
    }
    ok('登录成功');
  } catch (e) {
    fail('注册/登录失败: $e');
    exit(1);
  }

  step('2. A 与 B 建立单聊');
  late String convId;
  try {
    api.token = tokenA;
    convId = (_data(await api.postChatConversations(body: {'user_id': idB}))['id'] ?? '')
        as String;
    ok('会话: $convId');
  } catch (e) {
    fail('建会话失败: $e');
    exit(1);
  }

  step('3. 双方建立 WebSocket 连接');
  final rtA = RealtimeClient(baseUrl: baseUrl);
  final rtB = RealtimeClient(baseUrl: baseUrl);
  final eventsA = <RealtimeEvent>[];
  final eventsB = <RealtimeEvent>[];
  final subs = <StreamSubscription>[];

  Future<bool> connectClient(RealtimeClient client, String token) async {
    final connected = Completer<bool>();
    subs.add(client.statusStream.listen((status) {
      if (status == RealtimeStatus.connected && !connected.isCompleted) {
        connected.complete(true);
      }
    }));
    await client.connect(token);
    return connected.future
        .timeout(const Duration(seconds: 5), onTimeout: () => false);
  }

  try {
    subs.add(rtA.events.listen(eventsA.add));
    subs.add(rtB.events.listen(eventsB.add));
    if (!await connectClient(rtA, tokenA)) {
      fail('A 未能在 5 秒内连上');
      exit(1);
    }
    if (!await connectClient(rtB, tokenB)) {
      fail('B 未能在 5 秒内连上');
      exit(1);
    }
    ok('两端均已连接');
  } catch (e) {
    fail('连接失败: $e');
    exit(1);
  }

  step('4. A 发送消息，B 应实时收到 new_message');
  const content = '实时消息验证 hello-realtime';
  try {
    api.token = tokenA;
    await api.postChatMessages(
      body: {'conversation_id': convId, 'type': 'text', 'content': content},
    );

    final hit = await _waitFor(
      eventsB,
      (e) =>
          e.type == 'new_message' &&
          e.convId == convId &&
          e.data is Map &&
          (e.data as Map)['content'] == content,
    );
    if (hit != null) {
      ok('B 收到 new_message');
    } else {
      fail('B 未收到 new_message，收到: ${eventsB.map((e) => e.type).toList()}');
    }
  } catch (e) {
    fail('发送消息失败: $e');
  }

  step('5. B 发「正在输入」，A 应实时收到 typing');
  try {
    rtB.sendTyping(convId);
    final hit = await _waitFor(
      eventsA,
      (e) => e.type == 'typing' && e.convId == convId && e.fromId != null,
    );
    if (hit != null) {
      ok('A 收到 typing（from=${hit.fromId!.substring(0, 8)}…）');
    } else {
      fail('A 未收到 typing，收到: ${eventsA.map((e) => e.type).toList()}');
    }

    rtB.sendTyping(convId, typing: false);
    final stop = await _waitFor(
      eventsA,
      (e) => e.type == 'stop_typing' && e.convId == convId,
    );
    if (stop != null) {
      ok('A 收到 stop_typing');
    } else {
      fail('A 未收到 stop_typing');
    }
  } catch (e) {
    fail('typing 验证失败: $e');
  }

  step('6. B 标记已读，A 应实时收到 message_read');
  try {
    api.token = tokenB;
    await api.postChatConversationsIdRead(id: convId);
    final hit = await _waitFor(
      eventsA,
      (e) => e.type == 'message_read' && e.convId == convId,
    );
    if (hit != null) {
      ok('A 收到 message_read');
    } else {
      fail('A 未收到 message_read，收到: ${eventsA.map((e) => e.type).toList()}');
    }
  } catch (e) {
    fail('已读验证失败: $e');
  }

  step('7. 关闭连接');
  for (final sub in subs) {
    await sub.cancel();
  }
  await rtA.dispose();
  await rtB.dispose();
  ok('已断开');

  print('');
  if (_failed == 0) {
    print('✅ 实时 E2E 全部通过');
  } else {
    print('❌ 实时 E2E 有 $_failed 个步骤失败');
    exit(1);
  }
}
