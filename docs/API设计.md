# NeoChat API 设计文档

> NeoChat 跨平台聊天软件 API 设计

---

## 目录

- [API 概述](#api-概述)
- [认证方式](#认证方式)
- [通用响应格式](#通用响应格式)
- [错误码定义](#错误码定义)
- [REST API 接口](#rest-api-接口)
- [WebSocket 消息格式](#websocket-消息格式)

---

## API 概述

| 项目 | 说明 |
|------|------|
| **基础 URL** | `http://localhost:8080/api/v1` |
| **协议** | HTTPS / HTTP |
| **数据格式** | JSON |
| **字符编码** | UTF-8 |
| **认证方式** | JWT Bearer Token |

---

## 认证方式

### JWT Bearer Token

除登录、注册等公开接口外，所有 API 请求都需要在 Header 中携带认证 Token：

```http
Authorization: Bearer <access_token>
```

### Token 获取

通过登录接口获取 Access Token 和 Refresh Token：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400,
  "user": { ... }
}
```

### Token 刷新

Access Token 过期后，使用 Refresh Token 获取新的 Token：

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "has_more": true
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "errors": {
    "field1": ["错误信息1", "错误信息2"],
    "field2": ["错误信息"]
  }
}
```

---

## 错误码定义

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | 参数验证错误 |
| `INVALID_CREDENTIALS` | 用户名或密码错误 |
| `USER_NOT_FOUND` | 用户不存在 |
| `USER_ALREADY_EXISTS` | 用户已存在 |
| `TOKEN_EXPIRED` | Token 已过期 |
| `TOKEN_INVALID` | Token 无效 |
| `CONVERSATION_NOT_FOUND` | 会话不存在 |
| `MESSAGE_NOT_FOUND` | 消息不存在 |
| `NOT_CONVERSATION_MEMBER` | 不是会话成员 |
| `FRIEND_REQUEST_EXISTS` | 好友请求已发送 |
| `ALREADY_FRIENDS` | 已经是好友 |
| `NOT_FRIENDS` | 不是好友关系 |
| `USER_BLOCKED` | 用户已被拉黑 |
| `GROUP_FULL` | 群组已满 |
| `NOT_GROUP_ADMIN` | 不是群组管理员 |
| `FILE_UPLOAD_FAILED` | 文件上传失败 |
| `FILE_TOO_LARGE` | 文件过大 |
| `UNSUPPORTED_FILE_TYPE` | 不支持的文件类型 |

---

## REST API 接口

### 1. 认证模块 (Auth)

#### 1.1 用户登录

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string",
      "status": "online",
      "created_at": "timestamp"
    }
  }
}
```

#### 1.2 用户注册

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "string",
  "nickname": "string",
  "phone": "string",
  "email": "string",
  "password": "string",
  "confirm_password": "string"
}
```

#### 1.3 刷新 Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}
```

#### 1.4 获取当前用户信息

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### 1.5 更新用户资料

```http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "string",
  "avatar": "string",
  "bio": "string"
}
```

#### 1.6 修改密码

```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "string",
  "new_password": "string"
}
```

#### 1.7 忘记密码 - 发送验证码

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "string"
}
```

#### 1.8 重置密码

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "string",
  "new_password": "string"
}
```

#### 1.9 用户登出

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

---

#### 1.y 账号安全

| 接口 | 说明 |
|---|---|
| `POST /auth/change-password` | 需 `old_password`；成功后**吊销全部 refresh token** |
| `POST /auth/forgot-password` | 按邮箱发重置令牌；**不暴露邮箱是否注册**，响应恒为成功 |
| `POST /auth/reset-password` | 用重置令牌设置新密码，令牌一次性、1 小时过期 |
| `POST /auth/delete-account` | 需密码确认；软删除账号并吊销令牌 |

`forgot-password` 默认**不在响应里返回令牌**。只有同时满足
「`server.expose_reset_token: true`」且非生产环境时才会回传，
用于本地没有 SMTP 时联调；生产环境即使误开也会被强制关闭。

### 2. 用户模块 (Users)

#### 2.1 搜索用户

```http
GET /api/v1/users/search?q=关键词&page=1&page_size=20
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "username": "string",
        "nickname": "string",
        "avatar": "string",
        "status": "online"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "has_more": true
  }
}
```

#### 2.2 获取用户详情

```http
GET /api/v1/users/{user_id}
Authorization: Bearer <token>
```

---

### 3. 好友模块 (Friends)

#### 3.1 获取好友列表

```http
GET /api/v1/friends
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "friend_id": "uuid",
      "alias": "string",
      "status": "accepted",
      "created_at": "timestamp",
      "friend": {
        "id": "uuid",
        "username": "string",
        "nickname": "string",
        "avatar": "string",
        "status": "online"
      }
    }
  ]
}
```

#### 3.2 获取好友请求列表

```http
GET /api/v1/friends/requests
Authorization: Bearer <token>
```

#### 3.3 发送好友请求

```http
POST /api/v1/friends/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid"
}
```

#### 3.4 接受好友请求

```http
POST /api/v1/friends/requests/{request_id}/accept
Authorization: Bearer <token>
```

#### 3.5 拒绝好友请求

```http
POST /api/v1/friends/requests/{request_id}/reject
Authorization: Bearer <token>
```

#### 3.6 删除好友

```http
DELETE /api/v1/friends/{friend_id}
Authorization: Bearer <token>
```

#### 3.7 更新好友备注

```http
PUT /api/v1/friends/{friend_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "alias": "string"
}
```

---

### 4. 黑名单模块 (Blocklist)

#### 4.1 获取黑名单列表

```http
GET /api/v1/blocklist
Authorization: Bearer <token>
```

#### 4.2 拉黑用户

```http
POST /api/v1/blocklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid",
  "reason": "string"
}
```

#### 4.3 取消拉黑

```http
DELETE /api/v1/blocklist/{user_id}
Authorization: Bearer <token>
```

---

### 5. 会话模块 (Conversations)

#### 5.1 获取会话列表

```http
GET /api/v1/chat/conversations
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "single",
      "name": "string",
      "avatar": "string",
      "last_message": "string",
      "last_msg_at": "timestamp",
      "unread_count": 5,
      "updated_at": "timestamp",
      "members": [...]
    }
  ]
}
```

#### 5.2 创建会话

```http
POST /api/v1/chat/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "single",
  "user_ids": ["uuid"]
}
```

或创建群聊：

```json
{
  "type": "group",
  "name": "群聊名称",
  "description": "群聊描述",
  "avatar": "string",
  "user_ids": ["uuid1", "uuid2"]
}
```

#### 5.3 获取会话详情

```http
GET /api/v1/chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

#### 5.4 更新会话

```http
PUT /api/v1/chat/conversations/{conversation_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "avatar": "string"
}
```

#### 5.5 删除会话

```http
DELETE /api/v1/chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

#### 5.6 标记会话已读

```http
POST /api/v1/chat/conversations/{conversation_id}/read
Authorization: Bearer <token>
```

---

#### 5.x 置顶与免打扰

```http
PUT /api/v1/chat/conversations/{id}/pin
PUT /api/v1/chat/conversations/{id}/mute
Authorization: Bearer <token>
Content-Type: application/json

{ "pinned": true }   # 或 { "muted": true }
```

两者都是**按用户**生效（状态存在 `conversation.members[]` 上），
写操作会失效该用户的会话列表缓存。置顶会话在列表中最前：
排序为 `pinned DESC, updated_at DESC`。

#### 5.y 输入上限

| 项 | 限制 |
|---|---|
| 请求体 | 8 MB（上传接口 256 MB） |
| 文本正文 | 10000 字符 |
| 媒体 content / 文件名 | 255 字符 |
| `type` | `text / image / file / audio / video / system` |
| 消息分页 `limit` | ≤ 200（超出自动钳制） |
| 同步 `limit` | ≤ 500 |

#### 5.z 限流

发送消息与上传文件按**用户**限流（令牌桶）：

| 接口 | 默认限额 | 超限响应 |
|---|---|---|
| `POST /chat/messages` | 20 条 / 10 秒 | `429` + `Retry-After` |
| `POST /upload` | 10 次 / 分钟 | `429` + `Retry-After` |

阈值可通过 `server.message_rate_limit_per_10s` / `server.upload_rate_limit_per_minute` 调整。

### 6. 消息模块 (Messages)

#### 6.1 获取消息列表

```http
GET /api/v1/chat/conversations/{conversation_id}/messages?page=1&page_size=50
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "sender_id": "uuid",
        "type": "text",
        "content": "string",
        "media_url": "string",
        "file_name": "string",
        "file_size": 1024,
        "reply_to_id": "uuid",
        "is_edited": false,
        "created_at": "timestamp",
        "sender": { ... },
        "reply_to": { ... }
      }
    ],
    "total": 1000,
    "page": 1,
    "page_size": 50,
    "has_more": true
  }
}
```

#### 6.2 发送消息

```http
POST /api/v1/chat/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "text",
  "content": "string",
  "media_url": "string",
  "reply_to_id": "uuid"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "type": "text",
    "content": "string",
    "created_at": "timestamp",
    "sender": { ... }
  }
}
```

#### 6.3 编辑消息

```http
PUT /api/v1/chat/conversations/{conversation_id}/messages/{message_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

#### 6.4 删除消息

```http
DELETE /api/v1/chat/conversations/{conversation_id}/messages/{message_id}
Authorization: Bearer <token>
```

#### 6.5 转发消息

```http
POST /api/v1/chat/messages/forward
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_id": "uuid",
  "conversation_ids": ["uuid1", "uuid2"]
}
```

---

### 7. 群组模块 (Groups)

#### 7.1 创建群组

```http
POST /api/v1/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "avatar": "string",
  "user_ids": ["uuid1", "uuid2"]
}
```

#### 7.2 获取群组详情

```http
GET /api/v1/groups/{group_id}
Authorization: Bearer <token>
```

#### 7.3 更新群组

```http
PUT /api/v1/groups/{group_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "avatar": "string"
}
```

#### 7.4 邀请成员

```http
POST /api/v1/groups/{group_id}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_ids": ["uuid1", "uuid2"]
}
```

#### 7.5 移除成员

```http
DELETE /api/v1/groups/{group_id}/members/{user_id}
Authorization: Bearer <token>
```

#### 7.6 更新成员角色

```http
PUT /api/v1/groups/{group_id}/members/{user_id}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### 7.7 退出群组

```http
POST /api/v1/groups/{group_id}/leave
Authorization: Bearer <token>
```

---

### 8. 收藏模块 (Favorites)

#### 8.1 获取收藏列表

```http
GET /api/v1/favorites?page=1&page_size=20
Authorization: Bearer <token>
```

#### 8.2 添加收藏

```http
POST /api/v1/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_id": "uuid",
  "note": "string"
}
```

#### 8.3 删除收藏

```http
DELETE /api/v1/favorites/{favorite_id}
Authorization: Bearer <token>
```

---

### 9. 文件上传模块

#### 9.1 上传文件

```http
POST /api/v1/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
type: image | file | audio | video
```

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "/api/v1/files/image/2026/10/20/uuid.jpg",
    "file_name": "original.jpg",
    "file_size": 1048576,
    "mime_type": "image/jpeg"
  }
}
```

#### 9.2 文件限制

| 类型 | 最大大小 | 支持格式 |
|------|---------|---------|
| 图片 | 10 MB | jpg, jpeg, png, gif, webp |
| 音频 | 20 MB | mpeg, mp4, aac, wav, ogg, webm |
| 视频 | 200 MB | mp4, quicktime, webm, x-matroska |
| 文件 | 100 MB | 白名单内常见格式 |

#### 9.3 下载/查看文件（需要鉴权）

```http
GET /api/v1/files/{path}
Authorization: Bearer <token>
# 或（<img>/<video>/<audio> 无法设置请求头时）
GET /api/v1/files/{path}?token=<access_token>
```

- 文件被某条消息引用时，要求调用者是该会话成员，否则 403
- 路径穿越（`..`、绝对路径、盘符）一律拒绝
- **上传目录不再作为静态目录公开**（旧版 `/uploads/...` 直链已废弃）

---

## WebSocket 消息格式

### WebSocket 连接

```
ws://localhost:8080/api/v1/chat/ws?token=<access_token>
```

服务端限制：单帧 4 KB、服务端每 25s 发 ping、60s 未回 pong 断开、
单用户最多 5 条连接、全局 20000 条。

### 消息格式

所有 WebSocket 消息都遵循以下格式：

```json
{
  "type": "message_type",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 消息类型

#### 1. 新消息 (message)

**服务器推送**:
```json
{
  "type": "message",
  "data": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "type": "text",
    "content": "string",
    "created_at": "timestamp",
    "sender": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**客户端发送**:
```json
{
  "type": "message",
  "data": {
    "conversation_id": "uuid",
    "type": "text",
    "content": "string",
    "reply_to_id": "uuid"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 2. 输入状态 (typing)

```json
{
  "type": "typing",
  "data": {
    "conversation_id": "uuid",
    "user_id": "uuid",
    "is_typing": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 3. 消息已读 (message_read)

```json
{
  "type": "message_read",
  "data": {
    "conversation_id": "uuid",
    "message_id": "uuid",
    "user_id": "uuid",
    "read_at": "timestamp"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 4. 会话更新 (conversation_updated)

```json
{
  "type": "conversation_updated",
  "data": {
    "id": "uuid",
    "name": "string",
    "avatar": "string",
    "last_message": "string",
    "last_msg_at": "timestamp"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 5. 用户在线状态 (user_online / user_offline)

```json
{
  "type": "user_online",
  "data": {
    "user_id": "uuid"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 6. 好友请求 (friend_request)

```json
{
  "type": "friend_request",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "user": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 7. 心跳 (ping / pong)

```json
{
  "type": "ping",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

服务器响应:
```json
{
  "type": "pong",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

**最后更新**: 2026-04-11
