// 跨实例广播验证：
//   dart run tool/e2e_multi_instance.dart <instanceA> <instanceB>
//
// 两个后端实例共享同一个数据库与同一个 Redis。
// A 连实例 1、B 连实例 2；在实例 2 上发消息，A 必须在实例 1 的 WebSocket 上收到——
// 这一步验证的是 Redis Pub/Sub 跨实例转发，而不是同进程内的本地投递。
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

Future<RealtimeEvent?> _waitFor(
  List<RealtimeEvent> events,
  bool Function(RealtimeEvent) predicate, {
  Duration timeout = const Duration(seconds: 8),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    for (final event in events) {
      if (predicate(event)) return event;
    }
    await Future<void>.delayed(const Duration(milliseconds: 100));
  }
  return null;
}

Future<void> main(List<String> args) async {
  if (args.length < 2) {
    stderr.writeln('用法: dart run tool/e2e_multi_instance.dart <A> <B>');
    exit(2);
  }
  final baseA = args[0];
  final baseB = args[1];
  final suffix = DateTime.now().millisecondsSinceEpoch % 100000000;

  print('实例 A: $baseA');
  print('实例 B: $baseB');

  final apiA = NeoChatApi(baseUrl: baseA);
  final apiB = NeoChatApi(baseUrl: baseB);

  step('1. 通过实例 A 注册并登录两个用户');
  final ua = 'mia$suffix';
  final ub = 'mib$suffix';
  final ra = _data(await apiA.postAuthRegister(body: {
    'username': ua,
    'password': 'Passw0rd!',
    'email': '$ua@multi.local',
    'phone': '137${suffix.toString().padLeft(8, '0')}',
  }));
  final rb = _data(await apiA.postAuthRegister(body: {
    'username': ub,
    'password': 'Passw0rd!',
    'email': '$ub@multi.local',
    'phone': '136${suffix.toString().padLeft(8, '0')}',
  }));
  final tokenA = (ra['access_token'] ?? '') as String;
  final tokenB = (rb['access_token'] ?? '') as String;
  final idB = ((rb['user'] as Map?)?['id'] ?? '') as String;
  if (tokenA.isEmpty || tokenB.isEmpty) {
    fail('注册未返回 token');
    exit(1);
  }
  apiA.token = tokenA;
  apiB.token = tokenB;
  ok('两个用户已就绪');

  step('2. A 连实例 1，B 连实例 2');
  final eventsA = <RealtimeEvent>[];
  final rtA = RealtimeClient(baseUrl: baseA);
  rtA.events.listen(eventsA.add);
  final rtB = RealtimeClient(baseUrl: baseB);
  rtB.events.listen((_) {});

  await rtA.connect(tokenA);
  await rtB.connect(tokenB);
  await Future<void>.delayed(const Duration(seconds: 1));
  if (rtA.status == RealtimeStatus.connected && rtB.status == RealtimeStatus.connected) {
    ok('两侧 WebSocket 均已连接');
  } else {
    fail('WebSocket 连接状态异常: A=${rtA.status} B=${rtB.status}');
  }

  step('3. 在实例 B 上发消息，实例 A 上的 A 应收到');
  // 会话必须由 A 建立（A ↔ B），消息则由实例 B 发出
  apiA.token = tokenA;
  final conv = _data(await apiA.postChatConversations(body: {'user_id': idB}));
  final convId = (conv['id'] ?? '') as String;
  if (convId.isEmpty) {
    fail('建立会话失败');
    exit(1);
  }
  apiB.token = tokenB;
  await apiB.postChatMessages(body: {
    'conversation_id': convId,
    'type': 'text',
    'content': '跨实例消息 $suffix',
  });

  final gotByA = await _waitFor(
    eventsA,
    (e) => e.type == 'new_message' && (e.convId ?? '') == convId,
  );
  if (gotByA != null) {
    ok('实例 1 的 A 收到了实例 2 发出的消息（Redis 广播生效）');
  } else {
    fail('A 没有收到跨实例消息');
  }

  step('4. 反向：在实例 A 上发消息，B 应收到');
  final eventsB = <RealtimeEvent>[];
  rtB.events.listen(eventsB.add);
  apiA.token = tokenA;
  await apiA.postChatMessages(body: {
    'conversation_id': convId,
    'type': 'text',
    'content': '反向跨实例消息 $suffix',
  });
  final gotByB = await _waitFor(
    eventsB,
    (e) => e.type == 'new_message' && (e.convId ?? '') == convId,
  );
  if (gotByB != null) {
    ok('实例 2 的 B 收到了实例 1 发出的消息');
  } else {
    fail('B 没有收到反向跨实例消息');
  }

  step('5. 关闭连接');
  await rtA.disconnect();
  await rtB.disconnect();
  ok('连接已关闭');

  print('');
  if (_failed == 0) {
    print('✅ 跨实例广播验证全部通过');
    exit(0);
  } else {
    print('❌ 跨实例广播验证有 $_failed 个步骤失败');
    exit(1);
  }
}
