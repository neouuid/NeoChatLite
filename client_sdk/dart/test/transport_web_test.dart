// Web 传输实现的行为测试：不启动浏览器，用 MockClient 拦截请求。
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:neochat_api/neochat_api.dart' show ApiException;
import 'package:neochat_api/src/transport_web.dart';
import 'package:test/test.dart';

void main() {
  test('HttpTransport 解析成功响应', () async {
    late http.Request captured;
    final transport = HttpTransport(
      client: MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {'access_token': 'token-1'},
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    final res = await transport.send(
      method: 'POST',
      url: Uri.parse('http://localhost:8080/api/v1/auth/login'),
      headers: {'Authorization': 'Bearer x'},
      body: {'identifier': 'alice', 'password': 'p'},
    );

    expect(captured.method, 'POST');
    expect(captured.url.path, '/api/v1/auth/login');
    expect(captured.headers['Authorization'], 'Bearer x');
    expect(captured.headers['Content-Type'], contains('utf-8'));
    expect(res['data']['access_token'], 'token-1');
  });

  test('4xx 响应抛 ApiException 并带服务端 message', () async {
    final transport = HttpTransport(
      client: MockClient((_) async => http.Response(
            jsonEncode({'success': false, 'message': '用户名或密码错误'}),
            401,
            headers: {'content-type': 'application/json'},
          )),
    );

    expect(
      () => transport.send(
        method: 'POST',
        url: Uri.parse('http://localhost:8080/api/v1/auth/login'),
        body: const {},
      ),
      throwsA(isA<ApiException>()
          .having((e) => e.statusCode, 'statusCode', 401)
          .having((e) => e.message, 'message', contains('用户名或密码错误'))),
    );
  });

  test('uploadFile 发送 multipart 并带正确的图片 MIME', () async {
    late http.Request captured;
    final transport = HttpTransport(
      client: MockClient((request) async {
        // MockClient 会把 MultipartRequest finalize 成普通 Request
        captured = request;
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {'url': '/uploads/image/x.png'},
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    final res = await transport.uploadFile(
      url: Uri.parse('http://localhost:8080/api/v1/upload'),
      bytes: [1, 2, 3],
      filename: 'tiny.png',
      fields: {'type': 'image'},
    );

    expect(captured.method, 'POST');
    expect(captured.headers['content-type'], contains('multipart/form-data'));

    // 头名大小写由 http 包决定，统一转小写后断言
    final body = latin1.decode(captured.bodyBytes).toLowerCase();
    expect(body, contains('filename="tiny.png"'));
    // 服务端按 part 的 Content-Type 校验图片类型，必须是 image/png
    expect(body, contains('content-type: image/png'));
    expect(body, contains('name="type"'));
    // transport 返回原始信封，data 由 Uploader 层解析
    expect(res['data']['url'], '/uploads/image/x.png');
  });
}
