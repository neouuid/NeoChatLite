# NeoChat - 跨平台聊天软件

一款现代化的跨平台即时通讯应用，支持 iOS、Android、Windows、macOS。

## 技术栈

### 客户端
- **React Native** - iOS/Android
- **React Native for Windows + macOS** - 桌面端
- **TypeScript** - 类型安全
- **Zustand** - 状态管理
- **React Navigation** - 导航

### 后端
- **Go 1.21+** - 高性能服务端
- **Gin** - Web 框架
- **GORM** - ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存
- **WebSocket** - 实时通信
- **JWT** - 认证

## 项目结构

```
neochat/
├── docs/                    # 文档
├── design/                  # 设计文件 (Pencil)
├── backend/                 # 后端 (Go)
│   ├── cmd/                 # 服务入口
│   │   └── api-gateway/     # API 网关
│   ├── internal/            # 内部服务
│   │   ├── auth/            # 认证模块
│   │   ├── user/            # 用户/好友模块
│   │   └── chat/            # 聊天/群组模块
│   ├── pkg/                 # 公共包
│   │   ├── config/          # 配置
│   │   ├── database/        # 数据库
│   │   ├── redis/           # Redis
│   │   ├── response/        # API 响应
│   │   └── utils/           # 工具函数
│   └── configs/             # 配置文件
└── client/                  # 客户端 (React Native)
    ├── shared/              # 共享代码 (85-90%)
    │   ├── components/      # 共享组件
    │   ├── stores/          # Zustand 状态管理
    │   ├── services/        # API 服务
    │   ├── hooks/           # React Hooks
    │   ├── utils/           # 工具函数
    │   ├── constants/       # 常量
    │   └── types/           # TypeScript 类型
    ├── mobile/              # 移动端
    │   ├── src/
    │   │   ├── screens/     # 页面
    │   │   └── navigation/  # 导航
    │   └── App.tsx
    └── desktop/             # 桌面端
        ├── src/
        │   ├── screens/     # 窗口
        │   └── components/  # 桌面组件
        └── App.tsx
```

## 开发指南

### 环境要求

- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- Redis 7+
- React Native CLI (for mobile)
- Xcode (for iOS)
- Android Studio (for Android)
- Visual Studio (for Windows)

### 快速开始

#### 1. 启动数据库 (Docker)

```bash
# 使用 Docker Compose 启动 PostgreSQL 和 Redis
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 2. 后端配置

```bash
cd backend

# 复制配置文件
cp configs/config.yaml config.yaml

# 编辑配置 (如果需要)
# vim config.yaml

# 构建并运行
go build -o api-gateway.exe ./cmd/api-gateway
./api-gateway.exe
```

或者直接运行：

```bash
go run ./cmd/api-gateway
```

后端服务将在 `http://localhost:8080` 启动。

#### 3. 前端 (移动端)

```bash
cd client/mobile

# 安装依赖
npm install

# 启动 Metro
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android
```

#### 4. 前端 (桌面端)

```bash
cd client/desktop

# 安装依赖
npm install

# 启动 Windows
npm run windows

# 启动 macOS
npm run macos
```

### API 文档

启动后端后，健康检查端点：

- `GET /health` - 总健康检查
- `GET /health/db` - 数据库健康检查
- `GET /health/redis` - Redis 健康检查

主要 API 端点：

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /api/v1/user/profile` - 获取用户资料
- `GET /api/v1/user/search` - 搜索用户
- `GET /api/v1/friend/list` - 获取好友列表
- `POST /api/v1/friend/request` - 发送好友请求
- `GET /api/v1/chat/conversations` - 获取会话列表
- `POST /api/v1/chat/message` - 发送消息
- `GET /api/v1/chat/ws` - WebSocket 连接
- `POST /api/v1/group/` - 创建群组
- `POST /api/v1/call/initiate` - 发起音视频通话
- `POST /api/v1/call/:id/accept` - 接受通话
- `POST /api/v1/call/:id/reject` - 拒绝通话
- `POST /api/v1/call/:id/end` - 结束通话

## 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化 & 架构设计 | ✅ | 项目结构、技术选型 |
| 账号体系 (后端) | ✅ | 注册、登录、JWT、用户资料 |
| 好友关系 (后端) | ✅ | 好友请求、好友列表、黑名单 |
| 单聊功能 (后端) | ✅ | 会话、消息、已读状态 |
| 群聊功能 (后端) | ✅ | 群组创建、成员管理、角色权限 |
| WebSocket 实时消息 | ✅ | 新消息推送、在线状态 |
| 移动端界面 | ✅ | 登录、注册、主聊天、聊天详情、联系人、个人资料、查看他人资料、忘记密码、设置、主题、通知、关于、聊天设置、创建群组、群组信息、收藏、搜索、转发、账户安全、聊天背景、聊天备份、数据清除、图片查看、文件查看 |
| 桌面端界面 | ✅ | 登录、注册、主窗口、联系人面板、个人资料面板 |
| 共享组件库 | ✅ | Avatar、Button、Input、MessageList、ChatInput |
| 多媒体 (图片/文件) | ✅ | 文件上传/下载、消息转发、收藏 |
| 音视频通话 | ✅ | WebRTC信令、视频/语音通话UI、通话邀请弹窗 |
| 消息转发/收藏 | ✅ | 已完成 |
| 系统设置 | ✅ | 已完成所有设置页面 |

## 设计文件

设计文件位于 `design/` 目录，使用 [Pencil](https://pencil.evolus.vn/) 工具打开。

包含的设计：
- Login Page (登录页面)
- Register Page (注册页面)
- MainChat Page (主聊天页面)
- Chat Settings (聊天设置)
- Profile Page (个人资料)
- Friend Management (好友管理)
- Group Chat (群聊页面)
- Group Info (群组信息)
- Create Group (创建群组)
- Add Friend (添加好友)
- Settings (系统设置)
- Video Call (视频通话)
- Voice Call (语音通话)
- 等等...

每个页面都有 `_desktop` 和 `_mobile` 两个版本。

## 开发计划

详细的开发计划请查看 [docs/开发计划.md](docs/开发计划.md)。

## 架构设计

详细的架构设计请查看 [docs/架构设计.md](docs/架构设计.md)。

## 数据库设计

详细的数据库设计请查看 [docs/数据库设计.md](docs/数据库设计.md)。

## API 设计

详细的 API 设计请查看 [docs/API设计.md](docs/API设计.md)。

## 设计规范

详细的设计规范请查看 [docs/设计规范.md](docs/设计规范.md)。

## 开发环境搭建

详细的开发环境搭建请查看 [docs/开发环境搭建.md](docs/开发环境搭建.md)。

## License

BSD 3-Clause License
