// 由 scripts/gen_dart_client.py 生成，请勿手工修改。

import 'dart:convert';
import 'dart:io';

/// 统一的传输层：默认实现用 dart:io，
/// Flutter Web 等平台可自行实现（例如基于 package:http）。
abstract class Transport {
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  });
}

/// 基于 dart:io 的实现（移动端 / 桌面端可用）
class IoTransport implements Transport {
  IoTransport({HttpClient? client}) : _client = client ?? HttpClient();

  final HttpClient _client;

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    final request = await _client.openUrl(method, url);
    headers?.forEach((key, value) {
      // Content-Type 统一在下面设置（需要带 charset=utf-8，否则中文会报错）
      if (key.toLowerCase() != 'content-type') {
        request.headers.set(key, value);
      }
    });
    if (body != null) {
      request.headers.contentType =
          ContentType('application', 'json', charset: 'utf-8');
      // 必须按 UTF-8 写字节，直接 write 字符串会按 latin1 编码导致中文报错
      request.add(utf8.encode(jsonEncode(body)));
    }

    final response = await request.close();
    final text = await response.transform(utf8.decoder).join();
    final decoded = text.isEmpty ? null : jsonDecode(text);

    if (response.statusCode >= 400) {
      throw ApiException(
        statusCode: response.statusCode,
        message: decoded is Map && decoded['message'] is String
            ? decoded['message'] as String
            : text,
        payload: decoded,
      );
    }
    return decoded;
  }
}

/// API 调用失败时抛出
class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message, this.payload});

  final int statusCode;
  final String message;
  final dynamic payload;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
