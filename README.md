# NeoChat - 跨平台聊天软件

一款现代化的跨平台即时通讯应用，支持 iOS、Android、Windows、macOS、Linux、Web。

## 🎉 项目状态

### React Native 版本 (原始版本)
**所有核心功能已完成！** 100% 完成度

- ✅ 所有平台完整支持（iOS/Android/Windows/macOS）
- ✅ 所有核心功能已实现并集成真实 API
- ✅ 音视频通话（WebRTC）完整实现
- ✅ @提及功能完整实现
- ✅ 消息搜索功能完整实现
- ✅ 账号安全功能完整实现

### Flutter 版本 (新版本 ⭐)
- ✅ 29个页面完整实现
- ✅ 完整的路由系统
- ✅ Riverpod状态管理
- ✅ Dio API服务
- ✅ WebSocket实时通信
- ✅ Hive本地存储
- ✅ 完整的组件库
- ✅ 多平台支持（Android/iOS/Windows/macOS/Linux/Web）

## 技术栈

### 客户端 (Flutter - 新版 ⭐)
- **Flutter** - 跨平台UI框架
- **Dart** - 编程语言
- **Flutter Riverpod** - 状态管理
- **GoRouter** - 导航路由
- **Dio** - HTTP客户端
- **Hive** - NoSQL本地存储
- **WebSocket** - 实时通信
- **json_serializable** - JSON序列化
- **cached_network_image** - 图片缓存
- **photo_view** - 图片查看

### 客户端 (React Native - 旧版)
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
├── client/                  # 客户端 (React Native)
│   ├── shared/              # 共享代码 (85-90%)
│   │   ├── components/      # 共享组件
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── services/        # API 服务
│   │   ├── hooks/           # React Hooks
│   │   ├── utils/           # 工具函数
│   │   ├── constants/       # 常量
│   │   └── types/           # TypeScript 类型
│   ├── mobile/              # 移动端
│   │   ├── src/
│   │   │   ├── screens/     # 页面
│   │   │   └── navigation/  # 导航
│   │   └── App.tsx
│   └── desktop/             # 桌面端
│       ├── src/
│       │   ├── screens/     # 窗口
│       │   └── components/  # 桌面组件
│       └── App.tsx
└── client_flutter/          # 客户端 (Flutter)
    ├── lib/
    │   ├── core/            # 核心模块
    │   │   ├── constants/   # 常量
    │   │   ├── theme/       # 主题
    │   │   └── router/      # 路由
    │   ├── data/            # 数据层
    │   │   ├── models/      # 数据模型
    │   │   └── services/    # API服务
    │   ├── providers/       # 状态管理
    │   ├── screens/         # 页面
    │   ├── widgets/         # 组件
    │   └── main.dart
    ├── android/             # Android原生
    ├── ios/                 # iOS原生
    ├── windows/             # Windows原生
    ├── macos/               # macOS原生
    ├── linux/               # Linux原生
    └── pubspec.yaml
```

## 开发指南

### 环境要求

- Node.js 18+ (React Native版本)
- Go 1.21+ (后端)
- Flutter 3.10+ (Flutter版本)
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

#### 3. 前端 (React Native 移动端)

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

#### 4. 前端 (React Native 桌面端)

```bash
cd client/desktop

# 安装依赖
npm install

# 启动 Windows
npm run windows

# 启动 macOS
npm run macos
```

#### 5. 前端 (Flutter 版本)

```bash
cd client_flutter

# 安装依赖
flutter pub get

# 运行代码生成
flutter pub run build_runner build --delete-conflicting-outputs

# 运行 (Windows桌面)
flutter run -d windows

# 运行 (Android)
flutter run -d android

# 运行 (iOS/macOS)
flutter run -d ios
flutter run -d macos

# 运行 (Web)
flutter run -d chrome

# 构建
flutter build apk    # Android
flutter build windows # Windows
flutter build appbundle # AAB
```

## Flutter 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录页 | /login | 用户登录 |
| 注册页 | /register | 用户注册 |
| 忘记密码 | /forgot-password | 重置密码 |
| 主聊天页 | / | 会话列表 |
| 聊天页 | /chat/:conversationId | 私聊窗口 |
| 群聊页 | /group-chat/:conversationId | 群聊窗口 |
| 个人资料 | /profile | 用户个人资料 |
| 查看用户 | /profile/:userId | 查看其他用户资料 |
| 好友管理 | /friends | 好友列表管理 |
| 添加好友 | /add-friend | 搜索添加好友 |
| 黑名单 | /blocklist | 黑名单管理 |
| 群组信息 | /group-info/:groupId | 查看群组详情 |
| 创建群组 | /create-group | 创建新群组 |
| 图片查看 | /image-viewer | 查看图片 |
| 文件查看 | /file-viewer | 查看文件 |
| 搜索 | /search | 搜索好友/群组 |
| 聊天设置 | /chat-settings/:conversationId | 聊天详情设置 |
| 设置 | /settings | 系统设置 |
| 通知设置 | /notification-settings | 通知管理 |
| 主题设置 | /theme | 主题切换 |
| 聊天背景 | /chat-background | 背景设置 |
| 聊天备份 | /chat-backup | 备份管理 |
| 数据清理 | /data-clear | 缓存清理 |
| 关于 | /about | 应用关于页 |
| 收藏 | /favorites | 收藏列表 |
| 账号安全 | /account-security | 安全设置 |
| 转发 | /forward/:messageId | 转发消息 |
| 视频通话 | /video-call | 视频通话 |
| 语音通话 | /voice-call | 语音通话 |

### API 文档

启动后端后，健康检查端点：

- `GET /health` - 总健康检查
- `GET /health/db` - 数据库健康检查
- `GET /health/redis` - Redis健康检查

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
| 账号体系 (后端) | ✅ | 注册、登录、JWT、用户资料、账号安全、登录历史、设备管理 |
| 好友关系 (后端) | ✅ | 好友请求、好友列表、黑名单 |
| 单聊功能 (后端) | ✅ | 会话、消息、已读状态、撤回/删除、分页加载 |
| 群聊功能 (后端) | ✅ | 群组创建、成员管理、角色权限、@提及功能 |
| WebSocket 实时消息 | ✅ | 新消息推送、在线状态、信令转发 |
| React Native 移动端界面 | ✅ | 40+ 页面完整实现 |
| React Native 桌面端界面 | ✅ | 完整窗口和组件实现 |
| React Native 共享组件库 | ✅ | Avatar、Button、Input、MessageList、ChatInput、VideoView、MentionPicker 等 |
| Flutter 版本开发 | ✅ | 29个页面完整实现，架构完整 |
| 多媒体 (图片/文件) | ✅ | 文件上传/下载、消息转发、收藏 |
| 音视频通话 | ✅ | WebRTC信令、视频/语音通话UI、通话邀请弹窗 |
| 消息转发/收藏 | ✅ | 已完成 |
| 系统设置 | ✅ | 已完成所有设置页面 |
| @提及功能 | ✅ | 完整的提及功能实现 |
| 消息搜索 | ✅ | 消息内容搜索和群组搜索 |

## 当前进度概览

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 阶段 0: 项目初始化 & 架构设计 | ✅ 已完成 | 100% |
| 阶段 1: 基础设施 | ✅ 已完成 | 100% |
| 阶段 2: 账号体系 | ✅ 已完成 | 100% |
| 阶段 3: 好友关系 | ✅ 已完成 | 100% |
| 阶段 4: 单聊功能 | ✅ 已完成 | 100% |
| 阶段 5: 群聊功能 | ✅ 已完成 | 100% |
| 阶段 6: 多媒体 | ✅ 已完成 | 100% |
| 阶段 7: 音视频通话 | ✅ 已完成 | 100% |
| 阶段 8: 完善与优化 | ✅ 已完成 | 100% |

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

Flutter版本状态请查看 [docs/FLUTTER_PROJECT_STATUS.md](docs/FLUTTER_PROJECT_STATUS.md)。

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
