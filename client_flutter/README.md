# NeoChat Flutter App

这是 NeoChat 即时通讯应用的 Flutter 版本，支持 Android、iOS、Windows、macOS 和 Linux 平台。

## 项目结构

```
lib/
├── main.dart                 # 应用入口
├── app.dart                  # 应用根组件
├── core/
│   ├── constants/            # 常量定义
│   ├── router/               # 路由配置
│   ├── theme/                # 主题配置
│   └── utils/                # 工具函数
├── data/
│   ├── models/               # 数据模型
│   ├── repositories/         # 数据仓库
│   └── services/             # API 服务
├── providers/                # Riverpod 状态管理
├── screens/                  # 屏幕页面
├── widgets/                  # 通用组件
└── features/                 # 功能模块
```

## 功能模块

### 1. 账号体系 (Authentication)
- 用户登录
- 用户注册
- 忘记密码
- 个人资料
- 账户安全

### 2. 聊天功能 (Chat)
- 主聊天列表
- 单聊会话
- 群聊会话
- 聊天设置
- 图片查看
- 文件查看

### 3. 好友管理 (Friends)
- 好友列表
- 添加好友
- 查看他人资料
- 黑名单
- 黑名单空状态

### 4. 群组管理 (Groups)
- 群聊
- 群组信息
- 创建群组
- 群组成员管理

### 5. 多媒体 (Media)
- 图片查看器
- 文件查看器
- 文件上传

### 6. 通话 (Calls)
- 视频通话 (WebRTC)
- 语音通话 (WebRTC)

### 7. 消息操作 (Message Operations)
- 转发消息
- 收藏消息

### 8. 设置 (Settings)
- 系统设置
- 通知设置
- 主题设置
- 聊天背景
- 聊天备份
- 数据清除
- 关于页面

## 技术栈

- **框架**: Flutter 3.x
- **状态管理**: Flutter Riverpod 2.x
- **路由**: Go Router 13.x
- **网络**: Dio 5.x
- **本地存储**: SharedPreferences + Hive
- **WebSocket**: web_socket_channel
- **图片加载**: cached_network_image
- **WebRTC**: flutter_webrtc
- **JSON序列化**: json_serializable + json_annotation

## 开发环境搭建

### 前置要求
- Flutter SDK 3.10+
- Dart SDK 3.0+
- Android Studio / VS Code
- 对于Windows开发: Visual Studio 2022

### 安装依赖

```bash
cd client_flutter
flutter pub get
```

### 代码生成

```bash
# 一次性生成
flutter pub run build_runner build --delete-conflicting-outputs

# 监听文件变化并生成
flutter pub run build_runner watch
```

### 运行应用

```bash
# Android/iOS
flutter run

# Windows
flutter run -d windows

# macOS
flutter run -d macos
```

## 构建发布版本

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Windows
```bash
flutter build windows --release
```

### macOS
```bash
flutter build macos --release
```

### Linux
```bash
flutter build linux --release
```

## 开发规范

### 状态管理
- 使用 Riverpod 进行状态管理
- 全局状态放在 `providers/` 目录
- 页面级别状态使用 `provider` 或 `flutter_hooks`

### API 调用
- 所有 API 调用通过 `services/` 目录中的服务类
- 使用 Dio 进行 HTTP 请求
- 统一处理错误和加载状态

### 路由
- 使用 Go Router 进行导航
- 所有路由定义在 `core/router/app_router.dart`

### UI 组件
- 通用组件放在 `widgets/` 目录
- 遵循 Material Design 3 设计规范
- 支持深色/浅色主题切换

## 开发计划

### Phase 1: 项目基础架构 ✅
- [x] 项目初始化
- [x] 基础目录结构
- [x] 路由配置
- [x] 主题配置
- [x] 状态管理基础

### Phase 2: 核心基础设施 ⏳
- [ ] API 服务封装
- [ ] WebSocket 服务
- [ ] 本地存储封装
- [ ] 通用组件库

### Phase 3: 账号体系
- [ ] 登录页面
- [ ] 注册页面
- [ ] 忘记密码页面
- [ ] 个人资料页面
- [ ] 账户安全页面

### Phase 4: 聊天功能
- [ ] 主聊天列表
- [ ] 聊天会话页面
- [ ] 消息列表组件
- [ ] 消息输入组件
- [ ] 图片/文件查看

### Phase 5: 好友管理
- [ ] 好友列表
- [ ] 添加好友
- [ ] 用户资料页面
- [ ] 黑名单管理

### Phase 6: 群组管理
- [ ] 创建群组
- [ ] 群组信息
- [ ] 群组成员管理
- [ ] 群组设置

### Phase 7: 多媒体
- [ ] 图片查看器
- [ ] 文件查看器
- [ ] 文件上传

### Phase 8: 通话
- [ ] 视频通话
- [ ] 语音通话
- [ ] WebRTC 信令

### Phase 9: 消息操作
- [ ] 转发消息
- [ ] 收藏消息

### Phase 10: 设置
- [ ] 系统设置
- [ ] 通知设置
- [ ] 主题设置
- [ ] 聊天背景
- [ ] 聊天备份
- [ ] 数据清除
- [ ] 关于页面

## 后端 API

后端服务运行在 `http://localhost:8080`，API 文档见 `docs/API设计.md`。

主要 API 端点:
- `/api/v1/auth/*` - 认证相关
- `/api/v1/users/*` - 用户相关
- `/api/v1/friends/*` - 好友相关
- `/api/v1/chat/*` - 聊天相关
- `/api/v1/groups/*` - 群组相关
- `/api/v1/favorites/*` - 收藏相关
- `/ws` - WebSocket 端点

## 测试

```bash
# 运行所有测试
flutter test

# 运行特定测试
flutter test path/to/test.dart
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
