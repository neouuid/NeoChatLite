# NeoChat Flutter 项目状态

> 日期: 2026-04-29
> 状态: Phase 1 完成, Phase 2 进行中

---

## 已完成的工作

### 1. 项目结构搭建 (Phase 1) ✅

#### 创建的文件

**核心配置**
- `client_flutter/pubspec.yaml` - 依赖配置
- `client_flutter/analysis_options.yaml` - 代码分析配置
- `client_flutter/README.md` - 项目说明文档

**核心应用**
- `client_flutter/lib/main.dart` - 应用入口
- `client_flutter/lib/app.dart` - 应用根组件

**常量和工具**
- `client_flutter/lib/core/constants/app_constants.dart` - 应用常量
- `client_flutter/lib/core/utils/logger.dart` - 日志工具
- `client_flutter/lib/core/utils/validators.dart` - 表单验证工具

**主题和路由**
- `client_flutter/lib/core/theme/app_theme.dart` - 主题配置
- `client_flutter/lib/core/router/app_router.dart` - 路由配置 (含占位页面)

**数据模型**
- `client_flutter/lib/data/models/user.dart` - 用户、好友模型
- `client_flutter/lib/data/models/chat.dart` - 会话、消息模型
- `client_flutter/lib/data/models/group.dart` - 群组模型
- `client_flutter/lib/data/models/auth.dart` - 认证相关模型
- `client_flutter/lib/data/models/common.dart` - 通用响应模型
- `client_flutter/lib/data/models/call.dart` - 通话记录模型
- `client_flutter/lib/data/models/favorite.dart` - 收藏模型

**服务层**
- `client_flutter/lib/data/services/api_service.dart` - API 服务基类
- `client_flutter/lib/data/services/auth_service.dart` - 认证服务
- `client_flutter/lib/data/services/chat_service.dart` - 聊天服务
- `client_flutter/lib/data/services/user_service.dart` - 用户服务

**状态管理 (Providers)**
- `client_flutter/lib/providers/services_provider.dart` - 服务提供者
- `client_flutter/lib/providers/theme_provider.dart` - 主题状态
- `client_flutter/lib/providers/auth_provider.dart` - 认证状态

**文档**
- `docs/Flutter重写计划.md` - Flutter 重写详细计划
- `docs/FLUTTER_PROJECT_STATUS.md` - 本文件

---

## 技术栈确认

### 核心依赖
- **Flutter SDK**: 3.x (需要安装)
- **状态管理**: flutter_riverpod: 2.4+
- **路由**: go_router: 13.x
- **HTTP**: dio: 5.x
- **JSON 序列化**: json_annotation, json_serializable
- **本地存储**: shared_preferences, hive
- **WebSocket**: web_socket_channel
- **WebRTC**: flutter_webrtc

### UI 组件
- **图片缓存**: cached_network_image
- **图片查看**: photo_view
- **加载动画**: shimmer
- **图片选择**: wechat_assets_picker

---

## 接下来的步骤

### 立即执行 (下一步)

1. **初始化 Flutter 项目**
   ```bash
   cd client_flutter
   flutter create .
   ```

2. **安装依赖**
   ```bash
   flutter pub get
   ```

3. **运行代码生成器**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **配置平台项目**
   - Android 配置
   - iOS 配置 (如果需要)
   - Windows 配置
   - macOS 配置

### Phase 2: 核心基础设施 (进行中)

**待完成:**
- [ ] WebSocket 服务实现
- [ ] 本地存储服务 (Hive 封装)
- [ ] 通用 UI 组件库 (Button, Input, Avatar 等)
- [ ] 聊天状态 Provider
- [ ] 用户状态 Provider

### Phase 3-12: 功能模块实现 (待开始)

按照 Flutter 重写计划中的顺序依次实现所有 30 个页面。

---

## 文件清单

### 已创建的文件 (18 个)

```
client_flutter/
├── pubspec.yaml
├── analysis_options.yaml
├── README.md
└── lib/
    ├── main.dart
    ├── app.dart
    ├── core/
    │   ├── constants/
    │   │   └── app_constants.dart
    │   ├── router/
    │   │   └── app_router.dart
    │   ├── theme/
    │   │   └── app_theme.dart
    │   └── utils/
    │       ├── logger.dart
    │       └── validators.dart
    ├── data/
    │   ├── models/
    │   │   ├── user.dart
    │   │   ├── chat.dart
    │   │   ├── group.dart
    │   │   ├── auth.dart
    │   │   ├── common.dart
    │   │   ├── call.dart
    │   │   └── favorite.dart
    │   └── services/
    │       ├── api_service.dart
    │       ├── auth_service.dart
    │       ├── chat_service.dart
    │       └── user_service.dart
    └── providers/
        ├── services_provider.dart
        ├── theme_provider.dart
        └── auth_provider.dart
```

### 还需要创建的文件

**UI 组件**
- `lib/widgets/common/app_button.dart`
- `lib/widgets/common/app_input.dart`
- `lib/widgets/common/app_avatar.dart`
- `lib/widgets/chat/message_bubble.dart`
- `lib/widgets/chat/message_list.dart`
- 等等...

**页面**
- 30 个页面，分布在 `lib/screens/` 下的各个子目录

**其他 Providers**
- `lib/providers/chat_provider.dart`
- `lib/providers/user_provider.dart`
- `lib/providers/websocket_provider.dart`
- 等等...

---

## 设计资源

设计文件位于:
- `design/NeoChat_V1.pen` - V1 版本
- `design/NeoChat_V2.pen` - V2 版本
- `design/NeoChat_V3.pen` - V3 版本 (当前激活)

包含桌面端和移动端设计，共 30 个页面。

---

## 后端 API

后端 API 保持不变，文档在:
- `docs/API设计.md`
- `docs/架构设计.md`

后端服务运行在: `http://localhost:8080`

---

## 注意事项

1. **IDE 错误是预期的**: 由于依赖还未安装，代码还未生成，会有很多错误显示。这是正常的。

2. **不要手动创建 .g.dart 文件**: 这些文件应该由 `build_runner` 自动生成。

3. **先初始化 Flutter 项目**: 在继续之前，需要先在 `client_flutter/` 目录下运行 `flutter create .` 来初始化平台项目文件。

4. **遵循设计**: 实现页面时，严格按照 Pencil 设计文件中的布局、颜色、间距来实现。

---

## 快速开始

### 1. 环境准备

确保已安装:
- Flutter SDK 3.x
- Dart SDK 3.x
- 对于 Windows: Visual Studio 2022 (带有 "使用 C++ 的桌面开发" 工作负载)
- 对于 Android: Android Studio / VS Code + Android SDK
- 对于 iOS/macOS: Xcode

### 2. 项目初始化

```bash
cd client_flutter
flutter create .
# 在运行前，可能需要调整 pubspec.yaml 的内容，因为 flutter create 会覆盖它
```

### 3. 安装依赖并生成代码

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 4. 运行项目

```bash
# Windows (推荐首先测试)
flutter run -d windows

# Android
flutter run -d android

# iOS/macOS (需要 Mac)
flutter run -d ios
flutter run -d macos
```

---

## 下一步建议

建议继续按以下顺序进行:

1. **初始化 Flutter 项目** - 运行 `flutter create .` 并恢复我们的 pubspec.yaml
2. **安装依赖** - 运行 `flutter pub get`
3. **生成代码** - 运行 build_runner
4. **完善核心基础设施** - 继续 Phase 2 的工作
5. **开始实现 Phase 3** - 认证模块 (登录/注册页面)

---

## 参考文档

- `docs/Flutter重写计划.md` - 详细的重写计划
- `docs/开发计划.md` - 原项目的开发计划 (有很多参考价值)
- `docs/API设计.md` - API 文档
- `docs/架构设计.md` - 架构设计文档
- `client/shared/` - 原 RN 项目的共享代码 (可以参考业务逻辑)
