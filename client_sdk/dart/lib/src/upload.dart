// 附件上传（multipart/form-data），服务端接口：POST /api/v1/upload
//
// 服务端返回 data: {url, file_name, file_size, mime_type}。
// 这里单独抽象 Uploader，而不是塞进 Transport：传输层只负责 JSON 请求，
// 上传在 Web 端往往需要不同的实现（例如基于 package:http 的 MultipartRequest）。
import 'dart:convert';
import 'dart:io';

/// 上传失败时抛出
class UploadException implements Exception {
  UploadException({required this.statusCode, required this.message, this.payload});

  final int statusCode;
  final String message;
  final dynamic payload;

  @override
  String toString() => 'UploadException($statusCode): $message';
}

/// 根据扩展名推断 MIME（服务端按 MIME 做图片/文件类型校验）
String mimeTypeOf(String filename) {
  final lower = filename.toLowerCase();
  final dot = lower.lastIndexOf('.');
  final ext = dot >= 0 ? lower.substring(dot + 1) : '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

/// 上传抽象
abstract class Uploader {
  Future<Map<String, dynamic>> upload({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  });
}

/// 基于 dart:io 的默认实现（移动端 / 桌面端）
class IoUploader implements Uploader {
  IoUploader({HttpClient? client}) : _client = client ?? HttpClient();

  final HttpClient _client;

  @override
  Future<Map<String, dynamic>> upload({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  }) async {
    final boundary =
        '----neochat${DateTime.now().microsecondsSinceEpoch}${bytes.length}';
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

    // 用字符码构造 CRLF，避免转义在代码生成/复制过程中被吞掉
    final crlf = String.fromCharCodes([13, 10]);
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
      throw UploadException(
        statusCode: response.statusCode,
        message: decoded is Map && decoded['message'] is String
            ? decoded['message'] as String
            : text,
        payload: decoded,
      );
    }

    if (decoded is Map && decoded['data'] is Map) {
      return Map<String, dynamic>.from(decoded['data'] as Map);
    }
    return <String, dynamic>{};
  }
}

/// 上传附件到当前服务端，返回 `{url, file_name, file_size, mime_type}`
Future<Map<String, dynamic>> uploadWithUploader({
  required Uploader uploader,
  required String baseUrl,
  required List<int> bytes,
  required String filename,
  String type = 'file',
  String? token,
}) {
  final headers = <String, String>{};
  if (token != null && token.isNotEmpty) {
    headers['Authorization'] = 'Bearer $token';
  }
  return uploader.upload(
    url: Uri.parse('$baseUrl/api/v1/upload'),
    bytes: bytes,
    filename: filename,
    headers: headers,
    fields: {'type': type},
  );
}
