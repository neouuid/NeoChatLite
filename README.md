# NeoChat - 跨平台聊天软件

一款现代化的跨平台即时通讯应用，支持 iOS、Android、Windows、macOS。

## 技术栈

### 客户端
- **React Native** - iOS/Android
- **React Native for Windows + macOS** - 桌面端
- **TypeScript** - 类型安全
- **Zustand** - 状态管理
- **React Navigation** - 导航
- **react-native-webrtc** - 音视频通话

### 后端
- **Go** - 高性能服务端
- **gRPC** - RPC 框架
- **PostgreSQL** - 主数据库
- **Redis** - 缓存
- **NATS JetStream** - 消息队列
- **WebSocket** - 实时通信

## 项目结构

```
neochat/
├── docs/                    # 文档
├── design/                  # 设计文件
├── backend/                 # 后端 (Go)
│   ├── cmd/                 # 服务入口
│   ├── internal/            # 内部服务
│   ├── api/                 # API定义
│   └── deployments/         # 部署配置
└── client/                  # 客户端 (React Native)
    ├── shared/              # 共享代码 (85-90%)
    ├── mobile/              # 移动端
    ├── desktop/             # 桌面端
    └── web/                 # Web端 (可选)
```

## 开发指南

### 环境要求
- Node.js 18+
- Go 1.21+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- Visual Studio (for Windows)

### 快速开始

```bash
# 安装依赖
cd client/mobile
npm install

# 启动 Metro
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android
```

## 功能模块

- [x] 账号体系 (登录/注册/个人资料)
- [x] 聊天功能 (单聊/群聊)
- [x] 好友管理
- [x] 群组管理
- [x] 多媒体 (图片/文件)
- [x] 音视频通话
- [x] 消息操作 (转发/收藏)
- [x] 系统设置

## License

MIT
