// dart:io 实现（移动端 / 桌面端 / 服务端）
import 'dart:convert';
import 'dart:io';

import 'mime.dart';
import 'transport.dart';

Transport createTransport() => IoTransport();

String transportName() => 'io';

/// 基于 dart:io 的传输实现
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

  @override
  Future<dynamic> uploadFile({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  }) async {
    final boundary =
        '----neochat${DateTime.now().microsecondsSinceEpoch}${bytes.length}';
    final crlf = String.fromCharCodes([13, 10]);

    final request = await _client.openUrl('POST', url);
    headers?.forEach((key, value) {
      if (key.toLowerCase() != 'content-type') {
        request.headers.set(key, value);
      }
    });
    request.headers.set(
      'Content-Type',
      'multipart/form-data; boundary=$boundary',
    );

    void writeText(String text) => request.add(utf8.encode(text));

    fields.forEach((key, value) {
      writeText('--$boundary$crlf');
      writeText('Content-Disposition: form-data; name="$key"$crlf$crlf');
      writeText('$value$crlf');
    });

    writeText('--$boundary$crlf');
    writeText(
      'Content-Disposition: form-data; name="$field"; filename="$filename"$crlf',
    );
    writeText('Content-Type: ${mimeTypeOf(filename)}$crlf$crlf');
    request.add(bytes);
    writeText('$crlf--$boundary--$crlf');

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
