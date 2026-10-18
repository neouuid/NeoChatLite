// 附件上传：在 Transport.uploadFile 之上包一层，统一错误类型与返回结构。
//
// 服务端接口：POST /api/v1/upload（multipart，字段 file，可选 type=image|file）
// 返回 data: {url, file_name, file_size, mime_type}
import 'transport.dart';

/// 上传失败时抛出
class UploadException implements Exception {
  UploadException({required this.statusCode, required this.message, this.payload});

  final int statusCode;
  final String message;
  final dynamic payload;

  @override
  String toString() => 'UploadException($statusCode): $message';
}

/// 上传抽象（便于测试注入）
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

/// 基于当前平台 Transport 的默认实现（移动端/桌面端/Web 通用）
class TransportUploader implements Uploader {
  TransportUploader([Transport? transport])
      : _transport = transport ?? createDefaultTransport();

  final Transport _transport;

  @override
  Future<Map<String, dynamic>> upload({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  }) async {
    dynamic res;
    try {
      res = await _transport.uploadFile(
        url: url,
        bytes: bytes,
        filename: filename,
        headers: headers,
        field: field,
        fields: fields,
      );
    } on ApiException catch (e) {
      throw UploadException(
        statusCode: e.statusCode,
        message: e.message,
        payload: e.payload,
      );
    }

    if (res is Map && res['data'] is Map) {
      return Map<String, dynamic>.from(res['data'] as Map);
    }
    return <String, dynamic>{};
  }
}

/// 按当前平台创建默认上传实现
Uploader createDefaultUploader() => TransportUploader();

/// 上传附件到指定服务端，返回 `{url, file_name, file_size, mime_type}`
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
