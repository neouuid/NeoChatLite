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

## 响应结构约定（E2E 验证后补充）

- 所有接口统一返回信封 `{success, data, errors?, message?}`
  - 列表/对象都在 `data` 里，例如会话列表：`data: [...]`
  - 离线同步 `GET /chat/sync`：`data: {messages, since, server_time, has_more}`
- 登录返回的是 **`access_token`**（另有 `refresh_token`），不是 `token`
- `unread_count` 挂在 `conversation.members[]` 上，**按用户区分**，不是会话顶层字段
- 注册时 `email` / `phone` 是唯一索引，批量建测试账号需要各自唯一

本地端到端验证：

```bash
bash scripts/e2e_local.sh    # SQLite 起后端 + 跑 tool/e2e.dart，无需 Postgres/Redis
```
