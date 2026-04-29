# NeoChat Flutter 项目初始化脚本
# 适用于 Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NeoChat Flutter 项目初始化" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$expectedPath = "d:\GitDemos\NeoChat\client_flutter"
$currentPath = Get-Location

Write-Host "当前目录: $currentPath" -ForegroundColor Yellow

# 备份我们的文件
Write-Host ""
Write-Host "[1/6] 备份现有文件..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "backup" | Out-Null
Copy-Item -Path "pubspec.yaml" -Destination "backup\pubspec.yaml.backup"
Copy-Item -Path "lib" -Destination "backup\lib.backup" -Recurse -Force
Write-Host "   ✓ 已备份到 backup/ 目录" -ForegroundColor Gray

# 检查 Flutter 是否可用
Write-Host ""
Write-Host "[2/6] 检查 Flutter..." -ForegroundColor Green
try {
    $flutterVersion = flutter --version --machine | ConvertFrom-Json
    Write-Host "   ✓ Flutter 版本: $($flutterVersion.flutterVersion)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ 错误: 找不到 Flutter，请先安装 Flutter SDK" -ForegroundColor Red
    Write-Host "     下载地址: https://flutter.dev/docs/get-started/install" -ForegroundColor Red
    exit 1
}

# 询问用户是否要运行 flutter create
Write-Host ""
$createProject = Read-Host "是否运行 flutter create 来生成平台文件? (y/n)"
if ($createProject -eq 'y' -or $createProject -eq 'Y') {
    Write-Host ""
    Write-Host "[3/6] 正在运行 flutter create..." -ForegroundColor Green
    Write-Host "   (这将创建 android/, ios/, windows/, macos/, linux/ 等目录" -ForegroundColor Gray
    Write-Host "   注意: 这可能会覆盖 pubspec.yaml，我们有备份" -ForegroundColor Yellow

    # 使用 --no-pub 防止自动获取依赖
    flutter create --platforms=android,ios,windows,macos,linux --no-pub .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ 完成" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ flutter create 报告了一些问题，但我们继续..." -ForegroundColor Yellow
    }

    # 恢复 pubspec.yaml
    Write-Host ""
    Write-Host "[4/6] 恢复 pubspec.yaml..." -ForegroundColor Green
    if (Test-Path "backup\pubspec.yaml.backup") {
        Copy-Item -Path "backup\pubspec.yaml.backup" -Destination "pubspec.yaml" -Force
        Write-Host "   ✓ 已恢复" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ 警告: 无法找到备份的 pubspec.yaml" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[3/6] 跳过 flutter create" -ForegroundColor Gray
    Write-Host "[4/6] 跳过恢复 pubspec.yaml" -ForegroundColor Gray
}

# 获取依赖
Write-Host ""
Write-Host "[5/6] 获取依赖..." -ForegroundColor Green
flutter pub get

# 代码生成
Write-Host ""
Write-Host "[6/6] 代码生成..." -ForegroundColor Green
Write-Host "   (这将生成 .g.dart 文件" -ForegroundColor Gray
Write-Host "   (我们先删除手动创建的 .g.dart 文件..." -ForegroundColor Gray

# 清理手动创建的 .g.dart 文件
$gFiles = Get-ChildItem -Path "lib" -Recurse -Filter "*.g.dart" -ErrorAction SilentlyContinue
if ($gFiles) {
    $gFiles | Remove-Item -Force
    Write-Host "   ✓ 已删除手动创建的 .g.dart 文件" -ForegroundColor Gray
}

# 运行 build_runner
Write-Host "   正在运行 build_runner..." -ForegroundColor Gray
flutter pub run build_runner build --delete-conflicting-outputs

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "初始化完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下来可以:" -ForegroundColor Yellow
Write-Host "  1. 验证: flutter doctor" -ForegroundColor White
Write-Host "  2. 运行: flutter run -d windows" -ForegroundColor White
Write-Host "  3. 查看: docs\Flutter重写计划.md" -ForegroundColor White
Write-Host ""
