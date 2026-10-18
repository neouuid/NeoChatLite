// Web 实现（基于 package:http，可在浏览器与 wasm 环境运行）
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;

import 'mime.dart';
import 'transport.dart';

Transport createTransport() => HttpTransport();

String transportName() => 'http(web)';

class HttpTransport implements Transport {
  HttpTransport({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    final request = http.Request(method, url);
    headers?.forEach((key, value) => request.headers[key] = value);
    if (body != null) {
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.bodyBytes = utf8.encode(jsonEncode(body));
    }

    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
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
    final request = http.MultipartRequest('POST', url);
    headers?.forEach((key, value) => request.headers[key] = value);
    request.fields.addAll(fields);
    request.files.add(http.MultipartFile.fromBytes(
      field,
      bytes,
      filename: filename,
      contentType: MediaType.parse(mimeTypeOf(filename)),
    ));

    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  dynamic _decode(http.Response response) {
    final text = response.body.isEmpty ? null : response.body;
    final decoded = text == null ? null : jsonDecode(text);
    if (response.statusCode >= 400) {
      throw ApiException(
        statusCode: response.statusCode,
        message: decoded is Map && decoded['message'] is String
            ? decoded['message'] as String
            : (text ?? ''),
        payload: decoded,
      );
    }
    return decoded;
  }
}
