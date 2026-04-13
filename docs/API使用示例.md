# NeoChat API 使用示例

> 最后更新: 2026-04-13

## 目录

- [概述](#概述)
- [认证流程](#认证流程)
- [用户管理](#用户管理)
- [好友关系](#好友关系)
- [聊天功能](#聊天功能)
- [群组功能](#群组功能)
- [收藏功能](#收藏功能)
- [WebSocket 实时通信](#websocket-实时通信)

---

## 概述

本文档提供 NeoChat API 的详细使用示例，包括请求示例、响应格式和常见用例。

**Base URL**: `http://localhost:8080/api/v1`

**认证方式**: Bearer Token (JWT)

---

## 认证流程

### 1. 用户注册

**端点**: `POST /api/v1/auth/register`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "password": "password123",
    "nickname": "张三"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "nickname": "张三",
      "avatar": null,
      "status": "online"
    }
  },
  "message": "注册成功"
}
```

### 2. 用户登录

**端点**: `POST /api/v1/auth/login`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "zhangsan@example.com",
    "password": "password123"
  }'
```

**说明**: `identifier` 可以是用户名、邮箱或手机号。

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "nickname": "张三",
      "avatar": null,
      "status": "online"
    }
  },
  "message": "登录成功"
}
```

### 3. 刷新 Token

**端点**: `POST /api/v1/auth/refresh`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token 刷新成功"
}
```

### 4. 获取当前用户资料

**端点**: `GET /api/v1/auth/profile`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "nickname": "张三",
    "avatar": null,
    "bio": "",
    "status": "online",
    "created_at": "2026-04-13T10:00:00Z"
  },
  "message": ""
}
```

### 5. 忘记密码

**端点**: `POST /api/v1/auth/forgot-password`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "reset_token": "a1b2c3d4e5f6..."
  },
  "message": "重置密码邮件已发送"
}
```

### 6. 重置密码

**端点**: `POST /api/v1/auth/reset-password`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "new_password": "newpassword123"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

---

## 用户管理

### 1. 更新用户资料

**端点**: `PUT /api/v1/user/profile`

**请求示例**:

```bash
curl -X PUT http://localhost:8080/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "张三新昵称",
    "bio": "这是我的个人简介",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "zhangsan",
    "nickname": "张三新昵称",
    "bio": "这是我的个人简介",
    "avatar": "https://example.com/avatar.jpg"
  },
  "message": "资料更新成功"
}
```

### 2. 搜索用户

**端点**: `GET /api/v1/user/search`

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/v1/user/search?keyword=zhang" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": null,
      "status": "online"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "zhangwei",
      "nickname": "张伟",
      "avatar": null,
      "status": "offline"
    }
  ],
  "message": ""
}
```

### 3. 获取用户详情

**端点**: `GET /api/v1/user/:id`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/user/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "lisi",
    "nickname": "李四",
    "avatar": null,
    "bio": "这是李四的简介",
    "status": "online"
  },
  "message": ""
}
```

---

## 好友关系

### 1. 获取好友列表

**端点**: `GET /api/v1/friend/list`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/friend/list \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "friend_id": "550e8400-e29b-41d4-a716-446655440001",
      "alias": null,
      "status": "accepted",
      "friend": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "lisi",
        "nickname": "李四",
        "avatar": null,
        "status": "online"
      }
    }
  ],
  "message": ""
}
```

### 2. 发送好友请求

**端点**: `POST /api/v1/friend/request`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/friend/request \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "message": "你好，我是张三"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "friend_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "pending"
  },
  "message": "好友请求已发送"
}
```

### 3. 获取好友请求列表

**端点**: `GET /api/v1/friend/requests`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/friend/requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "friend_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "lisi",
        "nickname": "李四",
        "avatar": null
      }
    }
  ],
  "message": ""
}
```

### 4. 接受好友请求

**端点**: `POST /api/v1/friend/request/:id/accept`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/friend/request/550e8400-e29b-41d4-a716-446655440004/accept \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "已接受好友请求"
}
```

### 5. 拒绝好友请求

**端点**: `POST /api/v1/friend/request/:id/reject`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/friend/request/550e8400-e29b-41d4-a716-446655440004/reject \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "已拒绝好友请求"
}
```

### 6. 删除好友

**端点**: `DELETE /api/v1/friend/:id`

**请求示例**:

```bash
curl -X DELETE http://localhost:8080/api/v1/friend/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "已删除好友"
}
```

---

## 聊天功能

### 1. 获取会话列表

**端点**: `GET /api/v1/chat/conversations`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "type": "single",
      "name": null,
      "avatar": null,
      "last_message": "你好！",
      "last_msg_at": "2026-04-13T12:00:00Z",
      "unread_count": 2,
      "members": [
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440000",
          "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "username": "zhangsan",
            "nickname": "张三"
          }
        },
        {
          "user_id": "550e8400-e29b-41d4-a716-446655440001",
          "user": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "username": "lisi",
            "nickname": "李四"
          }
        }
      ]
    }
  ],
  "message": ""
}
```

### 2. 创建单聊会话

**端点**: `POST /api/v1/chat/conversation/single`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/chat/conversation/single \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "type": "single",
    "created_at": "2026-04-13T12:00:00Z",
    "members": [...]
  },
  "message": "会话创建成功"
}
```

### 3. 获取会话详情

**端点**: `GET /api/v1/chat/conversation/:id`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/chat/conversation/550e8400-e29b-41d4-a716-446655440010 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 获取会话消息

**端点**: `GET /api/v1/chat/conversation/:id/messages`

**请求示例**:

```bash
curl -X GET "http://localhost:8080/api/v1/chat/conversation/550e8400-e29b-41d4-a716-446655440010/messages?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
        "sender_id": "550e8400-e29b-41d4-a716-446655440001",
        "type": "text",
        "content": "你好！",
        "created_at": "2026-04-13T12:00:00Z",
        "sender": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "lisi",
          "nickname": "李四",
          "avatar": null
        },
        "read_count": 1
      }
    ],
    "total": 10,
    "has_more": true
  },
  "message": ""
}
```

### 5. 发送消息

**端点**: `POST /api/v1/chat/message`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/chat/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "type": "text",
    "content": "你好，李四！"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "text",
    "content": "你好，李四！",
    "created_at": "2026-04-13T12:01:00Z"
  },
  "message": "消息发送成功"
}
```

### 6. 标记会话为已读

**端点**: `POST /api/v1/chat/conversation/:id/read`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/chat/conversation/550e8400-e29b-41d4-a716-446655440010/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "已标记为已读"
}
```

### 7. 编辑消息

**端点**: `PUT /api/v1/chat/message/:id`

**请求示例**:

```bash
curl -X PUT http://localhost:8080/api/v1/chat/message/550e8400-e29b-41d4-a716-446655440021 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你好，李四！（已编辑）"
  }'
```

### 8. 删除消息

**端点**: `DELETE /api/v1/chat/message/:id`

**请求示例**:

```bash
curl -X DELETE http://localhost:8080/api/v1/chat/message/550e8400-e29b-41d4-a716-446655440021 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 群组功能

### 1. 创建群组

**端点**: `POST /api/v1/group/`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/group/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "技术讨论群",
    "description": "技术交流群",
    "avatar": null,
    "member_ids": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002"
    ]
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "name": "技术讨论群",
    "description": "技术交流群",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-04-13T12:00:00Z"
  },
  "message": "群组创建成功"
}
```

### 2. 获取群组详情

**端点**: `GET /api/v1/group/:id`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 获取群组成员

**端点**: `GET /api/v1/group/:id/members`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "owner",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "zhangsan",
        "nickname": "张三"
      }
    },
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "role": "member",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "lisi",
        "nickname": "李四"
      }
    }
  ],
  "message": ""
}
```

### 4. 添加群组成员

**端点**: `POST /api/v1/group/:id/members`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030/members \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [
      "550e8400-e29b-41d4-a716-446655440003"
    ]
  }'
```

### 5. 移除群组成员

**端点**: `DELETE /api/v1/group/:id/members/:user_id`

**请求示例**:

```bash
curl -X DELETE http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030/members/550e8400-e29b-41d4-a716-446655440003 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. 退出群组

**端点**: `POST /api/v1/group/:id/leave`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030/leave \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. 解散群组

**端点**: `DELETE /api/v1/group/:id`

**请求示例**:

```bash
curl -X DELETE http://localhost:8080/api/v1/group/550e8400-e29b-41d4-a716-446655440030 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 收藏功能

### 1. 获取收藏列表

**端点**: `GET /api/v1/chat/favorites`

**请求示例**:

```bash
curl -X GET http://localhost:8080/api/v1/chat/favorites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "message_id": "550e8400-e29b-41d4-a716-446655440021",
      "note": "重要消息",
      "created_at": "2026-04-13T12:00:00Z",
      "message": {
        "id": "550e8400-e29b-41d4-a716-446655440021",
        "content": "你好，李四！",
        "sender": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "nickname": "张三"
        }
      }
    }
  ],
  "message": ""
}
```

### 2. 添加收藏

**端点**: `POST /api/v1/chat/favorite`

**请求示例**:

```bash
curl -X POST http://localhost:8080/api/v1/chat/favorite \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "550e8400-e29b-41d4-a716-446655440021",
    "note": "重要消息"
  }'
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "message_id": "550e8400-e29b-41d4-a716-446655440021",
    "note": "重要消息"
  },
  "message": "收藏成功"
}
```

### 3. 取消收藏

**端点**: `DELETE /api/v1/chat/favorite/:id`

**请求示例**:

```bash
curl -X DELETE http://localhost:8080/api/v1/chat/favorite/550e8400-e29b-41d4-a716-446655440040 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例 (200 OK)**:

```json
{
  "success": true,
  "message": "已取消收藏"
}
```

---

## WebSocket 实时通信

### 连接 WebSocket

**端点**: `GET /api/v1/chat/ws`

**连接示例 (JavaScript)**:

```javascript
const token = 'YOUR_ACCESS_TOKEN';
const ws = new WebSocket(`ws://localhost:8080/api/v1/chat/ws?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket 连接已建立');
  
  // 发送 ping
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
  
  switch (message.type) {
    case 'pong':
      console.log('收到 pong');
      break;
    case 'new_message':
      console.log('收到新消息:', message.data);
      break;
    case 'message_read':
      console.log('消息已读:', message.data);
      break;
    case 'typing':
      console.log('对方正在输入:', message.data);
      break;
    case 'friend_request':
      console.log('收到好友请求:', message.data);
      break;
  }
};

ws.onclose = () => {
  console.log('WebSocket 连接已关闭');
};

ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};
```

### 消息类型

#### 1. Ping/Pong

**发送 Ping**:

```json
{
  "type": "ping",
  "timestamp": 1713000000000
}
```

**接收 Pong**:

```json
{
  "type": "pong",
  "timestamp": 1713000000000
}
```

#### 2. 新消息

**接收新消息**:

```json
{
  "type": "new_message",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "sender_id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "text",
    "content": "你好！",
    "created_at": "2026-04-13T12:00:00Z",
    "sender": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "nickname": "李四"
    }
  }
}
```

#### 3. 发送输入状态

**发送正在输入**:

```json
{
  "type": "typing",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
  "is_typing": true
}
```

**接收对方输入状态**:

```json
{
  "type": "typing",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "is_typing": true
  }
}
```

#### 4. 消息已读

**接收消息已读通知**:

```json
{
  "type": "message_read",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "read_at": "2026-04-13T12:00:00Z"
  }
}
```

#### 5. 好友请求

**接收好友请求通知**:

```json
{
  "type": "friend_request",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "nickname": "李四",
      "avatar": null
    }
  }
}
```

---

## 错误响应格式

**400 Bad Request**:

```json
{
  "success": false,
  "error": "invalid_request",
  "message": "请求参数错误"
}
```

**401 Unauthorized**:

```json
{
  "success": false,
  "error": "unauthorized",
  "message": "未授权访问"
}
```

**403 Forbidden**:

```json
{
  "success": false,
  "error": "forbidden",
  "message": "没有权限执行此操作"
}
```

**404 Not Found**:

```json
{
  "success": false,
  "error": "not_found",
  "message": "资源不存在"
}
```

**500 Internal Server Error**:

```json
{
  "success": false,
  "error": "internal_error",
  "message": "服务器内部错误"
}
```

---

## 更多信息

- Swagger API 文档: 启动后端后访问 `http://localhost:8080/swagger/index.html`
- API 设计文档: [docs/API设计.md](API设计.md)
- 测试指南: [docs/测试指南.md](测试指南.md)
