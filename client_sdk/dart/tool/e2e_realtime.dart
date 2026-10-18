// 实时消息端到端验证：
//   dart run tool/e2e_realtime.dart [baseUrl]
//
// 流程：注册/登录两个用户 → 建会话 → B 建立 WebSocket 连接 →
// A 发送消息 → 断言 B 在 5 秒内收到 new_message 事件。
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

  step('3. B 建立 WebSocket 连接');
  final realtime = RealtimeClient(baseUrl: baseUrl);
  final received = <RealtimeEvent>[];
  final connected = Completer<bool>();
  final statusSub = realtime.statusStream.listen((status) {
    if (status == RealtimeStatus.connected && !connected.isCompleted) {
      connected.complete(true);
    }
  });
  final eventSub = realtime.events.listen(received.add);

  try {
    await realtime.connect(tokenB);
    final okConnected = await connected.future
        .timeout(const Duration(seconds: 5), onTimeout: () => false);
    if (!okConnected) {
      fail('WebSocket 未在 5 秒内连上');
      exit(1);
    }
    ok('已连接，状态=${realtime.status}');
  } catch (e) {
    fail('连接失败: $e');
    exit(1);
  }

  step('4. A 发送消息，B 应实时收到');
  const content = '实时消息验证 hello-realtime';
  try {
    api.token = tokenA;
    await api.postChatMessages(
      body: {'conversation_id': convId, 'type': 'text', 'content': content},
    );

    // 等待 new_message 事件
    final deadline = DateTime.now().add(const Duration(seconds: 5));
    while (DateTime.now().isBefore(deadline)) {
      final hit = received.any((event) =>
          event.type == 'new_message' &&
          event.convId == convId &&
          event.data is Map &&
          (event.data as Map)['content'] == content);
      if (hit) break;
      await Future<void>.delayed(const Duration(milliseconds: 120));
    }

    final hit = received.any((event) =>
        event.type == 'new_message' &&
        event.convId == convId &&
        event.data is Map &&
        (event.data as Map)['content'] == content);

    if (hit) {
      ok('收到 new_message 事件，共 ${received.length} 条实时事件');
    } else {
      fail('5 秒内没有收到预期事件，收到: ${received.map((e) => e.type).toList()}');
    }
  } catch (e) {
    fail('发送消息失败: $e');
  }

  step('5. 关闭连接');
  await eventSub.cancel();
  await statusSub.cancel();
  await realtime.dispose();
  ok('已断开');

  print('');
  if (_failed == 0) {
    print('✅ 实时 E2E 全部通过');
  } else {
    print('❌ 实时 E2E 有 $_failed 个步骤失败');
    exit(1);
  }
}
