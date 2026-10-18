// 不依赖网络的冒烟检查：用假的 Transport 验证「方法 + 路径 + 查询参数」拼装正确。
//
//   dart run tool/smoke.dart
import 'package:neochat_api/neochat_api.dart';

class _RecordingTransport implements Transport {
  final calls = <String>[];

  @override
  Future<dynamic> send({
    required String method,
    required Uri url,
    Map<String, String>? headers,
    Object? body,
  }) async {
    final q = url.queryParameters;
    final query = q.isEmpty
        ? ''
        : '?${q.entries.map((e) => '${e.key}=${e.value}').join('&')}';
    calls.add('$method ${url.path}$query');
    return {'success': true, 'data': null};
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
    calls.add('UPLOAD ${url.path} $filename');
    return {
      'success': true,
      'data': {'url': '/uploads/fake.png', 'file_name': filename},
    };
  }
}

void _expect(String actual, String expected) {
  if (actual != expected) {
    throw StateError('期望 $expected，实际 $actual');
  }
}

void main() {
  final transport = _RecordingTransport();
  final api = NeoChatApi(baseUrl: 'http://localhost:8080', transport: transport);

  // 1) 登录：POST /api/v1/auth/login，带 body
  api.postAuthLogin(body: {'identifier': 'alice', 'password': 'secret'});
  // 2) 会话列表
  api.getChatConversations();
  // 3) 路径参数 + 查询参数
  api.getChatConversationsIdMessages(id: 'conv-1', limit: 50);
  // 4) 离线消息同步
  api.getChatSync(since: '2026-10-18T00:00:00Z');
  // 5) 发送消息
  api.postChatMessages(body: {'conversation_id': 'c1', 'content': 'hi'});

  final actual = transport.calls.join(' | ');
  final expected = [
    'POST /api/v1/auth/login',
    'GET /api/v1/chat/conversations',
    'GET /api/v1/chat/conversations/conv-1/messages?limit=50',
    'GET /api/v1/chat/sync?since=2026-10-18T00:00:00Z',
    'POST /api/v1/chat/messages',
  ].join(' | ');

  _expect(actual, expected);
  print('✅ smoke ok: $actual');
}
