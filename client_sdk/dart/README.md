# neochat_api (Dart)

NeoChat 服务端 API 的 Dart 客户端契约层，由 `backend/docs/swagger.json` 生成。

```bash
# 重新生成
python3 scripts/gen_dart_client.py
```

## 用法

```dart
import 'package:neochat_api/neochat_api.dart';

final api = NeoChatApi(baseUrl: 'http://localhost:8080');
final res = await api.login(body: {'identifier': 'alice', 'password': '***'});
final token = res['data']['token'];
api.token = token;

final convs = await api.get_chat_conversations();
```

## 设计说明

- 不依赖任何第三方包；传输层用 `dart:io`，Flutter Web 可自行实现 `Transport`
- 方法名由 `operationId` 或「请求方法 + 路径」推导
- 返回值是解码后的 JSON（`Map` / `List`），模型类见 `lib/src/models.dart`

## 实时消息

```dart
final rt = RealtimeClient(baseUrl: 'http://localhost:8080');
rt.statusStream.listen((status) {
  if (status == RealtimeStatus.connected) {
    // 重连成功：补拉离线消息
    api.getChatSync(since: lastServerTime);
  }
});
rt.events.listen((event) {
  if (event.type == 'new_message') {
    print('${event.convId}: ${event.data['content']}');
  }
});
await rt.connect(token);
```

- 连接地址 `ws(s)://host/api/v1/chat/ws?token=<JWT>`；浏览器 WS 无法自定义请求头，
  服务端为此提供了 `WebSocketAuthMiddleware`（仅 `/chat/ws` 接受 `?token=`）
- 内置心跳（25s 发 `ping`，`pong` 不进事件流）与指数退避重连（1/2/5/10/20s）
- 传输层可通过 `RealtimeConnector` 替换（Flutter Web 用 `package:web_socket_channel` 实现即可）
- 端到端验证：`dart run tool/e2e_realtime.dart http://127.0.0.1:18080`
