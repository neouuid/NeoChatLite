# NeoChat Flutter 项目初始化指南

## 前置条件

在开始之前，请确保已安装以下软件：

1. **Flutter SDK (3.0+)**
   - 下载地址: https://flutter.dev/docs/get-started/install
   - 安装后运行 `flutter doctor` 检查环境

2. **对于 Windows 开发**
   - Visual Studio 2022 (Community 版本即可)
   - 安装 "使用 C++ 的桌面开发" 工作负载

3. **对于 Android 开发**
   - Android Studio
   - 或 VS Code + Android SDK

4. **对于 iOS/macOS 开发** (仅 macOS)
   - Xcode
   - CocoaPods

## 初始化步骤

### 步骤 1: 验证 Flutter 安装

在项目根目录下打开终端，运行：

```bash
cd d:\GitDemos\NeoChat\client_flutter
flutter doctor
```

确保所有检查项都通过 (❌ 的项需要解决)。

### 步骤 2: 初始化 Flutter 项目

在 `client_flutter` 目录下运行：

```bash
# 先备份我们的文件
mkdir -p backup
cp pubspec.yaml backup/pubspec.yaml.backup
cp -r lib backup/lib.backup

# 运行 flutter create (在空目录下运行更安全)
cd ..
mkdir -p client_flutter_temp
cd client_flutter_temp
flutter create --org com.neochat --platforms=android,ios,windows,macos,linux neochat

# 复制生成的平台目录到我们的项目
cp -r android ../client_flutter/
cp -r ios ../client_flutter/
cp -r windows ../client_flutter/
cp -r macos ../client_flutter/
cp -r linux ../client_flutter/
cp -r test ../client_flutter/

# 清理
cd ..
rm -rf client_flutter_temp

# 或者更简单的方法 - 如果你已经在 client_flutter 目录有我们的文件
# 可以尝试直接运行 (但可能会覆盖 pubspec.yaml)
cd client_flutter
flutter create --platforms=android,ios,windows,macos,linux --no-pub .
```

### 步骤 3: 恢复/确认 pubspec.yaml

如果 `flutter create` 覆盖了我们的 `pubspec.yaml`，请恢复我们的版本：

```bash
# 检查 pubspec.yaml 是否是我们的版本
# 如果不是，请从 backup 恢复或重新复制
```

### 步骤 4: 安装依赖

在 `client_flutter` 目录下：

```bash
flutter pub get
```

### 步骤 5: 生成代码

运行 build_runner 生成序列化代码：

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

如果出现冲突，可以先清理：

```bash
flutter pub run build_runner clean
```

### 步骤 6: 验证项目

运行以下命令验证项目：

```bash
# 检查项目配置
flutter analyze

# 运行测试
flutter test

# 尝试在 Windows 上运行 (如果在 Windows 上)
flutter run -d windows
```

## 常见问题

### Q: flutter create 提示目录不为空

```
A: 可以使用 --force 参数，但会覆盖部分文件。先备份我们的 lib/ 和 pubspec.yaml！
```

### Q: pub get 失败

```
A: 检查网络连接，可以尝试使用国内镜像：
export PUB_HOSTED_URL=https://mirrors.tuna.tsinghua.edu.cn/dart-pub
export FLUTTER_STORAGE_BASE_URL=https://mirrors.tuna.tsinghua.edu.cn/flutter
# Windows 上使用 set 而不是 export
```

### Q: build_runner 报错关于 .g.dart 文件

```
A: 我们已经手动创建的 .g.dart 文件需要删除。让 build_runner 自己生成它们。
删除以下文件：
- lib/data/models/user.g.dart
- lib/data/models/chat.g.dart
- lib/data/models/group.g.dart
- lib/data/models/auth.g.dart
- lib/data/models/common.g.dart
- lib/data/models/call.g.dart
- lib/data/models/favorite.g.dart
然后重新运行 build_runner。
```

## 快速参考命令

```bash
# 获取依赖
flutter pub get

# 代码生成
flutter pub run build_runner build --delete-conflicting-outputs

# 代码生成 (监听模式)
flutter pub run build_runner watch

# 运行在 Windows
flutter run -d windows

# 运行在 Android
flutter run -d android

# 构建 Windows release
flutter build windows --release

# 构建 Android release
flutter build apk --release
```

## 下一步

项目初始化成功后，继续：

1. 实现 Phase 2 - 核心基础设施
2. 实现 Phase 3 - 认证模块 (登录/注册)
3. 按照 Flutter重写计划.md 逐步实现所有功能

详细的实现计划请参考: `docs/Flutter重写计划.md`
