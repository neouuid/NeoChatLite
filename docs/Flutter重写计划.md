# NeoChat Flutter 重写计划

> 将现有的 React Native 实现迁移到 Flutter 框架，保持所有功能完整

---

## 背景

原项目使用 React Native 开发，但遇到以下问题：
- Windows 桌面端构建问题
- 希望更好的性能和更一致的跨平台体验
- 更成熟的 Flutter 生态系统

---

## 项目信息

| 项目 | 说明 |
|------|------|
| 原技术栈 | React Native 0.73+ + Go |
| 新技术栈 | Flutter 3.x + Go |
| 后端 | 保持不变，Go + Gin + PostgreSQL + Redis |
| 支持平台 | Android / iOS / Windows / macOS / Linux |
| 设计文件 | Pencil 设计已完成，桌面/移动端各一份 |
| 开始日期 | 2026-04-29 |
| 预计完成 | 2026-05-20 (约3周) |

---

## 重写策略

### 渐进式迁移
1. 首先在 `client_flutter/` 目录建立 Flutter 项目
2. 从核心模块开始，逐个实现
3. 利用现有后端 API 不变的优势
4. 保持设计与原有一致

### 代码结构参考
- 后端 API 完全复用（`docs/API设计.md`）
- 设计文件完全复用（`design/`）
- 可以参考 `client/shared/` 中的业务逻辑

---

## Flutter 技术栈

### 核心依赖
| 依赖 | 版本 | 用途 |
|------|------|------|
| flutter | 3.19+ | 框架 |
| flutter_riverpod | 2.4+ | 状态管理 |
| go_router | 13.0+ | 路由导航 |
| dio | 5.4+ | HTTP 客户端 |
| web_socket_channel | 2.4+ | WebSocket |
| shared_preferences | 2.2+ | 简单键值存储 |
| hive | 2.2+ | 本地数据库 |
| json_annotation | 4.8+ | JSON 序列化 |

### UI 组件
| 依赖 | 版本 | 用途 |
|------|------|------|
| cached_network_image | 3.3+ | 图片缓存 |
| photo_view | 0.14+ | 图片查看器 |
| wechat_assets_picker | 9.0+ | 媒体选择 |
| shimmer | 3.0+ | 骨架屏加载 |
| flutter_svg | 2.0+ | SVG 支持 |

### WebRTC
| 依赖 | 版本 | 用途 |
|------|------|------|
| flutter_webrtc | 0.10+ | WebRTC 音视频通话 |

---

## Flutter 项目结构

```
client_flutter/
├── lib/
│   ├── main.dart                    # 应用入口
│   ├── app.dart                     # 应用根组件
│   ├── core/                        # 核心基础设施
│   │   ├── constants/
│   │   │   └── app_constants.dart  # 常量定义
│   │   ├── router/
│   │   │   └── app_router.dart     # Go Router 配置
│   │   ├── theme/
│   │   │   └── app_theme.dart      # 主题配置
│   │   └── utils/
│   │       ├── logger.dart         # 日志工具
│   │       └── validators.dart     # 表单验证
│   ├── data/                        # 数据层
│   │   ├── models/                 # 数据模型
│   │   │   ├── user.dart
│   │   │   ├── chat.dart
│   │   │   ├── auth.dart
│   │   │   ├── group.dart
│   │   │   ├── call.dart
│   │   │   ├── favorite.dart
│   │   │   └── common.dart
│   │   ├── services/               # API 服务
│   │   │   ├── api_service.dart    # Dio 封装
│   │   │   ├── auth_service.dart   # 认证服务
│   │   │   ├── chat_service.dart   # 聊天服务
│   │   │   ├── user_service.dart   # 用户服务
│   │   │   └── websocket_service.dart
│   │   └── repositories/           # 数据仓库 (可选)
│   ├── providers/                   # Riverpod Providers
│   │   ├── services_provider.dart  # 服务 Provider
│   │   ├── auth_provider.dart      # 认证状态
│   │   ├── chat_provider.dart      # 聊天状态
│   │   ├── user_provider.dart      # 用户状态
│   │   ├── theme_provider.dart     # 主题状态
│   │   └── webrtc_provider.dart    # WebRTC 状态
│   ├── screens/                     # 页面
│   │   ├── auth/                   # 认证模块
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   └── forgot_password_screen.dart
│   │   ├── chat/                   # 聊天模块
│   │   │   ├── main_chat_screen.dart
│   │   │   ├── chat_screen.dart
│   │   │   └── group_chat_screen.dart
│   │   ├── friends/                # 好友模块
│   │   │   ├── friend_manage_screen.dart
│   │   │   ├── add_friend_screen.dart
│   │   │   └── blocklist_screen.dart
│   │   ├── groups/                 # 群组模块
│   │   │   ├── create_group_screen.dart
│   │   │   └── group_info_screen.dart
│   │   ├── calls/                  # 通话模块
│   │   │   ├── video_call_screen.dart
│   │   │   └── voice_call_screen.dart
│   │   ├── media/                  # 多媒体模块
│   │   │   ├── image_viewer_screen.dart
│   │   │   └── file_viewer_screen.dart
│   │   ├── message_ops/            # 消息操作
│   │   │   ├── forward_screen.dart
│   │   │   └── favorites_screen.dart
│   │   ├── settings/               # 设置模块
│   │   │   ├── settings_screen.dart
│   │   │   ├── notification_settings_screen.dart
│   │   │   ├── theme_screen.dart
│   │   │   ├── chat_background_screen.dart
│   │   │   ├── chat_backup_screen.dart
│   │   │   ├── data_clear_screen.dart
│   │   │   ├── about_screen.dart
│   │   │   └── account_security_screen.dart
│   │   ├── profile/                # 资料模块
│   │   │   ├── profile_screen.dart
│   │   │   └── view_profile_screen.dart
│   │   ├── search/                 # 搜索
│   │   │   └── search_screen.dart
│   │   └── chat_settings/
│   │       └── chat_settings_screen.dart
│   ├── widgets/                     # 通用组件
│   │   ├── common/
│   │   │   ├── app_button.dart
│   │   │   ├── app_input.dart
│   │   │   ├── app_avatar.dart
│   │   │   └── loading_indicator.dart
│   │   ├── chat/
│   │   │   ├── message_bubble.dart
│   │   │   ├── message_list.dart
│   │   │   ├── chat_input.dart
│   │   │   └── conversation_item.dart
│   │   └── users/
│   │       └── user_list_item.dart
│   └── features/                    # 复杂功能
│       ├── webrtc/                 # WebRTC 通话
│       └── websocket/              # WebSocket 处理
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── android/
├── ios/
├── windows/
├── macos/
├── linux/
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## 实施阶段（3周计划）

### Phase 1: 项目初始化 (Day 1-3)
**目标**: 建立完整的 Flutter 项目基础设施

- [x] 创建 `client_flutter/` 目录结构
- [x] 配置 `pubspec.yaml` 依赖
- [x] 设置主题系统 (Light/Dark)
- [x] 配置路由 (Go Router)
- [x] 配置状态管理 (Riverpod)
- [x] 实现 API 服务基础 (Dio)
- [x] 实现日志工具
- [x] 实现常量定义

### Phase 2: 账号体系 (Day 4-6)
**目标**: 实现完整的用户认证流程

**页面清单**:
- [ ] 登录页面 (Login Page)
- [ ] 注册页面 (Register Page)
- [ ] 忘记密码页面 (Forgot Password Page)
- [ ] 个人资料页面 (Profile Page)
- [ ] 账户安全页面 (Account Security Page)

**功能**:
- [ ] 用户登录 API 对接
- [ ] 用户注册 API 对接
- [ ] Token 刷新机制
- [ ] 本地持久化存储
- [ ] 认证状态管理

### Phase 3: 聊天功能核心 (Day 7-10)
**目标**: 实现主要的聊天功能

**页面清单**:
- [ ] 主聊天页面 (Main Chat Page)
- [ ] 聊天会话页面 (Chat Screen)
- [ ] 群聊页面 (Group Chat Page)
- [ ] 图片查看器页面 (Image Viewer Page)
- [ ] 文件查看器页面 (File Viewer Page)

**功能**:
- [ ] WebSocket 连接管理
- [ ] 会话列表加载
- [ ] 消息发送/接收
- [ ] 消息历史分页加载
- [ ] 输入状态同步
- [ ] 消息已读状态

### Phase 4: 好友管理 (Day 11-12)
**目标**: 实现完整的好友关系管理

**页面清单**:
- [ ] 好友管理页面 (Friend Manage Page)
- [ ] 添加好友页面 (Add Friend Page)
- [ ] 查看他人资料页面 (View Profile Page)
- [ ] 黑名单页面 (Blocklist Page)
- [ ] 黑名单空页面 (Blacklist Empty Page)

**功能**:
- [ ] 搜索用户
- [ ] 发送/接受/拒绝好友请求
- [ ] 好友列表
- [ ] 拉黑/取消拉黑

### Phase 5: 群组管理 (Day 13-14)
**目标**: 实现群组聊天功能

**页面清单**:
- [ ] 群组信息页面 (Group Info Page)
- [ ] 创建群组页面 (Create Group Page)

**功能**:
- [ ] 创建群组
- [ ] 群组成员管理
- [ ] 群组信息编辑
- [ ] 群组聊天

### Phase 6: 消息操作与多媒体 (Day 15-17)
**目标**: 实现消息转发、收藏和文件处理

**页面清单**:
- [ ] 转发页面 (Forward Page)
- [ ] 收藏页面 (Favorites Page)
- [ ] 搜索页面 (Search Page)

**功能**:
- [ ] 消息转发
- [ ] 收藏消息
- [ ] 搜索消息
- [ ] 图片上传/查看
- [ ] 文件上传/查看

### Phase 7: 音视频通话 (Day 18-20)
**目标**: 实现 WebRTC 音视频通话

**页面清单**:
- [ ] 视频通话页面 (Video Call Page)
- [ ] 语音通话页面 (Voice Call Page)

**功能**:
- [ ] WebRTC 集成 (flutter_webrtc)
- [ ] 信令服务对接
- [ ] 通话邀请/接听/拒绝
- [ ] 通话中控制
- [ ] 通话记录

### Phase 8: 设置模块 (Day 21-22)
**目标**: 实现完整的设置功能

**页面清单**:
- [ ] 系统设置页面 (Settings Page)
- [ ] 通知设置页面 (Notification Settings Page)
- [ ] 主题页面 (Theme Page)
- [ ] 聊天背景页面 (Chat Background Page)
- [ ] 聊天备份页面 (Chat Backup Page)
- [ ] 数据清除页面 (Data Clear Page)
- [ ] 关于页面 (About Page)
- [ ] 聊天设置页面 (Chat Settings Page)

---

## 所有页面清单（共30个）

### 账号体系 (6个)
1. [ ] Login Page (desktop + mobile)
2. [ ] Register Page
3. [ ] Forgot Password Page
4. [ ] Profile Page
5. [ ] View Profile Page
6. [ ] Account Security Page

### 聊天功能 (5个)
7. [ ] Main Chat Page
8. [ ] Group Chat Page
9. [ ] Chat Settings Page
10. [ ] Image Viewer Page
11. [ ] File Viewer Page

### 好友管理 (5个)
12. [ ] Friend Manage Page
13. [ ] Add Friend Page
14. [ ] View Profile Page (复用)
15. [ ] Blocklist Page
16. [ ] Blacklist Empty Page

### 群组管理 (3个)
17. [ ] Group Info Page
18. [ ] Create Group Page
19. [ ] Group Chat Page (复用)

### 通话 (2个)
20. [ ] Video Call Page
21. [ ] Voice Call Page

### 消息操作 (2个)
22. [ ] Forward Page
23. [ ] Favorites Page

### 设置 (7个)
24. [ ] Settings Page
25. [ ] Notification Settings Page
26. [ ] Theme Page
27. [ ] Chat Background Page
28. [ ] Chat Backup Page
29. [ ] Data Clear Page
30. [ ] About Page

---

## 关键实现要点

### 1. 响应式设计
- 同时支持桌面端和移动端
- 针对大屏优化布局（桌面端三栏布局）
- 针对小屏优化（移动端单栏）

### 2. 主题系统
- 深色/浅色主题切换
- 主题持久化
- 支持自定义主题色

### 3. WebSocket 管理
- 自动重连机制
- 心跳保持
- 消息队列处理

### 4. WebRTC 集成
- 复用后端信令服务
- 支持 P2P 连接
- 视频/语音切换

### 5. 本地存储
- 使用 Hive 存储消息历史
- SharedPreferences 存储简单配置
- 图片缓存使用 cached_network_image

---

## 迁移检查清单

### API 对接
- [ ] 认证接口 (Auth API)
- [ ] 用户接口 (User API)
- [ ] 好友接口 (Friend API)
- [ ] 聊天接口 (Chat API)
- [ ] 群组接口 (Group API)
- [ ] 收藏接口 (Favorite API)
- [ ] 文件上传接口 (File Upload API)

### WebSocket 事件
- [ ] 新消息事件
- [ ] 消息已读事件
- [ ] 输入状态事件
- [ ] 好友请求事件
- [ ] 用户在线状态事件
- [ ] WebRTC 信令事件

### 测试
- [ ] 单元测试 (Models, Services)
- [ ] Widget 测试 (UI 组件)
- [ ] 集成测试 (完整流程)

---

## 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Flutter WebRTC 支持不完善 | 中 | 高 | 提前验证 flutter_webrtc，预留 fallback 方案 |
| 设计还原度不够 | 低 | 中 | 仔细分析 Pencil 设计文件，严格按照设计实现 |
| 时间不足 | 中 | 中 | 优先实现核心功能，次要功能可以后续迭代 |
| 跨平台兼容性问题 | 低 | 中 | 早期就在各平台测试 |

---

## 成功标准

- [ ] 所有 30 个页面实现完成
- [ ] 所有功能正常工作（登录、聊天、好友、群组、通话等）
- [ ] 在 Android/iOS/Windows/macOS 上正常运行
- [ ] 通过后端 API 完整对接测试
- [ ] 性能与原 React Native 版本相当或更好
- [ ] 代码质量符合 Flutter 最佳实践

---

**开始日期**: 2026-04-29
**预计完成**: 2026-05-20
**当前状态**: 🟢 进行中 (Phase 1)
**最后更新**: 2026-04-29
