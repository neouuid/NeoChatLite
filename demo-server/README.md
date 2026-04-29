# NeoChat 演示服务器

这是一个独立的演示服务器，使用内存存储，不依赖任何外部中间件或数据库。

## 功能

- 用户认证（模拟）
- 获取会话列表
- 获取和发送消息
- 好友列表
- 搜索用户
- 创建群组

## 运行服务器

```bash
cd demo-server
go run main.go
```

服务器将在 `http://localhost:8080` 启动。

## API 端点

### 认证
- `POST /api/v1/auth/login` - 登录（任意用户名密码都可以）

### 用户
- `GET /api/v1/user/profile` - 获取当前用户信息
- `GET /api/v1/user/search?keyword=xxx` - 搜索用户

### 聊天
- `GET /api/v1/chat/conversations` - 获取会话列表
- `GET /api/v1/chat/conversation/{id}/messages` - 获取会话消息
- `POST /api/v1/chat/message` - 发送消息

### 好友
- `GET /api/v1/friend/list` - 获取好友列表

### 群组
- `POST /api/v1/group/` - 创建群组

## 模拟数据

服务器启动时会自动创建以下模拟数据：

- 1 个当前用户（demo）
- 3 个好友（艾丽斯、鲍勃、查理）
- 3 个单聊会话
- 1 个群聊会话
- 一些示例消息

## 使用方法

1. 启动演示服务器
2. 在客户端应用中登录（任意用户名密码都可以）
3. 开始聊天！
