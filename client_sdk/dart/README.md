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
    api.getChatSync(since: lastServerTime); // 重连后补拉离线消息
  }
});
rt.events.listen((event) {
  if (event.type == 'new_message') print(event.data['content']);
});
await rt.connect(token);
```

- 地址 `ws(s)://host/api/v1/chat/ws?token=<JWT>`；浏览器 WS 无法自定义请求头，
  服务端为此提供 `WebSocketAuthMiddleware`（仅 `/chat/ws` 接受 `?token=`）
- 内置心跳（25s ping，pong 不进事件流）与指数退避重连（1/2/5/10/20s）
- 传输层可用 `RealtimeConnector` 替换（Web 端注入自己的实现即可）

### 事件表

| 事件 | 方向 | 说明 |
|---|---|---|
| `new_message` | 服务端 → 客户端 | 新消息（`conv_id` + `data` 为消息体） |
| `typing` / `stop_typing` | 双向 | `sendTyping(convId)`，服务端转发给同会话成员 |
| `message_read` | 服务端 → 客户端 | 有人标记已读时广播（`data.user_id` 是读者） |
| `online_status` | 服务端 → 客户端 | 上下线（`data.user_id` / `data.online`） |
| `signal_offer` / `signal_answer` | 双向 | WebRTC 信令，按 `data.to_user_id` 定向转发 |

## 附件上传

```dart
final data = await uploadWithUploader(
  uploader: IoUploader(),
  baseUrl: 'http://localhost:8080',
  bytes: fileBytes,
  filename: 'photo.png',
  type: 'image',        // image | file
  token: token,
);
// data: {url, file_name, file_size, mime_type}

await api.postChatMessages(body: {
  'conversation_id': convId,
  'type': 'image',      // image | file
  'content': '',
  'media_url': data['url'],
  'file_name': data['file_name'],
  'file_size': data['file_size'],
});
```

- 服务端按 **multipart part 的 Content-Type** 校验图片类型，SDK 会按扩展名推断
  （png/jpeg/gif/webp/pdf/txt/zip），否则会报 `unsupported image type`
- 上传后的相对 URL（`/uploads/...`）需要拼上服务端地址才能访问

## 响应结构约定

- 所有接口统一信封 `{success, data, errors?, message?}`
- 登录返回 **`access_token`**（另有 `refresh_token`），不是 `token`
- `unread_count` 挂在 `conversation.members[]`，**按用户区分**，不是会话顶层
- `GET /chat/sync` 的 `data` 为 `{messages, since, server_time, has_more}`
- 建群响应 `data: {conversation, group}`，会话 ID 在 `data.conversation.id`
- @提及语法必须是 `@[显示名](用户UUID)`，服务端用正则解析
- 注册时 `email` / `phone` 唯一，批量建测试账号需各自唯一

## 跨平台（Web / 移动端 / 桌面端）

传输层按平台自动选择实现，业务代码无需分支：

| 平台 | Transport | WebSocket | 依赖 |
|---|---|---|---|
| 移动端 / 桌面端 | `IoTransport`（dart:io） | `ioRealtimeConnector`（dart:io） | 无额外依赖 |
| Web（JS / Wasm） | `HttpTransport`（package:http） | `webRealtimeConnector`（web_socket_channel） | http / http_parser / web_socket_channel |
| 其它 | 明确抛 `UnsupportedError` | 同左 | — |

选择逻辑用条件导入（`dart.library.io` / `dart.library.js_interop`），
默认工厂：`createDefaultTransport()`、`createDefaultUploader()`、
`createDefaultRealtimeConnector()`。

验证方式：

```bash
cd client_sdk/dart && dart test        # 含 HttpTransport 行为测试（MockClient，无需浏览器）
cd client_app && flutter build web     # Web 产物可编译
```

> 注意：Web 端浏览器无法自定义 WebSocket 请求头，token 通过 `?token=` 传递；
> 服务端仅对 `/chat/ws` 接受该方式。

## 好友相关接口的实际结构（E2E 确认）

| 接口 | 约定 |
|---|---|
| `GET /users/search?keyword=` | 返回分页信封 `data: {items, total, page, page_size, has_more}`，用户数组在 `data.items` |
| `POST /friends/requests` | body 是 `{friend_id}`，**不是** `user_id` |
| `GET /friends/requests` | `data: {pending, sent}`；pending 项是 Friend 记录（`user_id` 为请求者，`user` 字段是请求者的用户信息） |
| `GET /friends` | `data` 直接是用户数组（不是 Friend 记录） |
| `POST /friends/requests/:id/accept` | 路径参数是**请求记录 id**，不是用户 id |

## 音视频消息（不支持音视频通话，只支持消息）

| 环节 | 约定 |
|---|---|
| 上传 | `POST /upload` 的 `type` 支持 `image` / `file` / `audio` / `video` |
| 校验 | 服务端按 part 的 Content-Type 校验白名单；audio 默认 20MB、video 默认 200MB 上限 |
| 消息 | 发送时 `type` 用 `audio` / `video`，正文留空，`media_url` 填上传返回的 url |
| 渲染 | 客户端用 `just_audio` 播放语音、`video_player` 内嵌播放视频 |

服务端默认白名单：audio = mpeg/mp4/aac/wav/ogg/webm；video = mp4/quicktime/webm/x-matroska。

## 引用回复与免打扰

- 引用回复：发送时带上 `reply_to_id`，读取消息时服务端会回填 `reply_to`（原消息对象）
- 免打扰：`PUT /chat/conversations/:id/mute`，body `{"muted": true|false}`；
  状态存在 `conversation.members[].muted`，**按用户区分**，只影响本人
- 注意：免打扰/改名/增删成员这类写操作都会让 `convs:{userID}` 缓存失效，
  否则客户端会读到旧状态（已用回归测试锁住）

## 鉴权流程

| 环节 | 约定 |
|---|---|
| 注册 | `POST /auth/register` **直接返回 `access_token` + `refresh_token` + `user`**，注册即可登录 |
| 登录 | `POST /auth/login`，返回同上；`identifier` 支持用户名 / 邮箱 / 手机号 |
| 刷新 | `POST /auth/refresh`，body `{refresh_token}`，返回新的 `access_token`（+ 可能的新 refresh_token） |
| 登出 | `POST /auth/logout`（尽力而为），随后清除本地登录态 |

客户端会把 token / refresh_token / 用户信息存到本地（`shared_preferences`），
启动时 `restore()` 自动恢复登录态；任一请求返回 401 时，
`AuthRefreshingTransport` 会自动用 refresh_token 换新 token 并重放一次请求，
刷新失败则清空登录态回到登录页。

> JWT 的 `exp` 是秒级：同一秒内连续刷新会得到完全相同的 token 串，属正常现象。
> 生产环境建议把 token 存储换成 `flutter_secure_storage`（Keychain / Keystore / libsecret / DPAPI）。
