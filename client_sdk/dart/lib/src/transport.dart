// 传输层抽象：跨平台通过条件导入选择实现。
//
//   dart:io 可用（移动端 / 桌面端 / 服务端）→ transport_io.dart
//   Web（dart.library.js_interop）           → transport_web.dart
//   其它                                      → transport_stub.dart（明确抛错）
import 'transport_stub.dart'
    if (dart.library.io) 'transport_io.dart'
    if (dart.library.js_interop) 'transport_web.dart' as platform;

/// API 调用失败时抛出
class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message, this.payload});

  final int statusCode;
  final String message;
  final dynamic payload;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// 统一的传输层（JSON 请求 + multipart 上传）
abstract class Transport {
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  });

  Future<dynamic> uploadFile({
    required Uri url,
    required List<int> bytes,
    required String filename,
    Map<String, String>? headers,
    String field = 'file',
    Map<String, String> fields = const {},
  });
}

/// 按当前平台创建默认传输实现
Transport createDefaultTransport() => platform.createTransport();

/// 当前平台默认实现的名字（日志/排查用）
String defaultTransportName() => platform.transportName();
