import 'package:flutter_test/flutter_test.dart';
import 'package:neochat_app/state/message_cache.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Map<String, dynamic> msg(int i) => {'id': 'm$i', 'content': 'msg $i'};

  test('只保留最近 N 条消息', () async {
    final cache = PrefsMessageCache(maxMessages: 3);

    await cache.save('conv-1', [msg(1), msg(2), msg(3), msg(4), msg(5)]);

    final loaded = await cache.load('conv-1');
    expect(loaded, hasLength(3));
    expect(loaded.first['id'], 'm3');
    expect(loaded.last['id'], 'm5');
  });

  test('按会话隔离', () async {
    final cache = PrefsMessageCache();

    await cache.save('conv-1', [msg(1)]);
    await cache.save('conv-2', [msg(2)]);

    expect((await cache.load('conv-1')).single['id'], 'm1');
    expect((await cache.load('conv-2')).single['id'], 'm2');
  });

  test('清除后为空', () async {
    final cache = PrefsMessageCache();
    await cache.save('conv-1', [msg(1)]);
    await cache.clear('conv-1');
    expect(await cache.load('conv-1'), isEmpty);
  });

  test('缓存损坏时返回空而不是抛异常', () async {
    SharedPreferences.setMockInitialValues({'neochat.msgs.conv-1': 'not-json'});
    final cache = PrefsMessageCache();
    expect(await cache.load('conv-1'), isEmpty);
  });
}
