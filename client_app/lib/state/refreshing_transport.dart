import 'package:neochat_api/neochat_api.dart';

/// 包装 Transport：遇到 401 时尝试刷新 token，然后重放一次请求。
///
/// 刷新逻辑放在传输层而不是每个调用点，避免到处写重试分支。
class AuthRefreshingTransport implements Transport {
  AuthRefreshingTransport({
    required this.inner,
    required this.onUnauthorized,
  });

  final Transport inner;

  /// 返回新的 access token；返回 null 表示无法刷新（调用方应跳登录页）
  final Future<String?> Function() onUnauthorized;

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      return await inner.send(method: method, url: url, headers: headers, body: body);
    } on ApiException catch (e) {
      if (e.statusCode != 401) rethrow;
      final token = await onUnauthorized();
      if (token == null) rethrow;
      return inner.send(
        method: method,
        url: url,
        headers: {...?headers, 'Authorization': 'Bearer $token'},
        body: body,
      );
    }
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
    try {
      return await inner.uploadFile(
        url: url,
        bytes: bytes,
        filename: filename,
        headers: headers,
        field: field,
        fields: fields,
      );
    } on ApiException catch (e) {
      if (e.statusCode != 401) rethrow;
      final token = await onUnauthorized();
      if (token == null) rethrow;
      return inner.uploadFile(
        url: url,
        bytes: bytes,
        filename: filename,
        headers: {...?headers, 'Authorization': 'Bearer $token'},
        field: field,
        fields: fields,
      );
    }
  }
}
