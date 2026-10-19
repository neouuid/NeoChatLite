import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// 登录态持久化。抽成接口，测试可注入内存实现。
abstract class TokenStore {
  Future<Map<String, dynamic>?> load();
  Future<void> save(Map<String, dynamic> data);
  Future<void> clear();
}

/// 基于 shared_preferences 的实现（六端可用）
///
/// 注意：这是明文存储。生产环境建议换成 flutter_secure_storage
/// （Keychain / Keystore / libsecret / DPAPI），此处优先保证跨平台可用。
class PrefsTokenStore implements TokenStore {
  static const _key = 'neochat.auth';

  @override
  Future<Map<String, dynamic>?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {
      // 数据损坏就当没登录
    }
    return null;
  }

  @override
  Future<void> save(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(data));
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
