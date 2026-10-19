import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// 本地消息缓存：弱网/离线时先展示上次的内容。
///
/// 用 shared_preferences 存 JSON（六端可用），每会话只保留最近 [maxMessages] 条。
/// 生产环境可换成 sqlite/hive 以获得更好的容量与查询能力。
abstract class MessageCache {
  Future<List<Map<String, dynamic>>> load(String conversationId);
  Future<void> save(String conversationId, List<Map<String, dynamic>> messages);
  Future<void> clear(String conversationId);
}

class PrefsMessageCache implements MessageCache {
  PrefsMessageCache({this.maxMessages = 200});

  final int maxMessages;
  static const _prefix = 'neochat.msgs.';

  String _key(String conversationId) => '$_prefix$conversationId';

  @override
  Future<List<Map<String, dynamic>>> load(String conversationId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(conversationId));
    if (raw == null || raw.isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded
            .whereType<Map>()
            .map((m) => Map<String, dynamic>.from(m))
            .toList();
      }
    } catch (_) {
      // 缓存损坏就当没有
    }
    return const [];
  }

  @override
  Future<void> save(
    String conversationId,
    List<Map<String, dynamic>> messages,
  ) async {
    if (messages.isEmpty) return;
    final trimmed = messages.length > maxMessages
        ? messages.sublist(messages.length - maxMessages)
        : messages;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key(conversationId), jsonEncode(trimmed));
  }

  @override
  Future<void> clear(String conversationId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(conversationId));
  }
}
