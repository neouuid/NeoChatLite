import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/settings_provider.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class ChatBackupScreen extends ConsumerStatefulWidget {
  const ChatBackupScreen({super.key});

  @override
  ConsumerState<ChatBackupScreen> createState() => _ChatBackupScreenState();
}

class _ChatBackupScreenState extends ConsumerState<ChatBackupScreen> {
  bool _isBackingUp = false;
  bool _isRestoring = false;
  bool _includeImages = true;
  bool _includeFiles = true;
  bool _includeVideos = true;

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  int _calculateBackupSize() {
    final conversations = ref.read(conversationListProvider).conversations;
    int totalSize = 0;
    for (final conv in conversations) {
      final messages = ref.read(messagesProvider(conv.id)).messages;
      for (final msg in messages) {
        // Estimate size: text is small, media files are larger
        totalSize += msg.content.length * 2; // UTF-16
        if (msg.mediaUrl != null && _includeImages) {
          totalSize += 500 * 1024; // Estimate 500KB per image
        }
        if (msg.fileSize != null && _includeFiles) {
          totalSize += msg.fileSize!;
        }
      }
    }
    final friends = ref.read(friendListProvider).friends;
    totalSize += friends.length * 1024; // Estimate 1KB per friend
    return totalSize;
  }

  Future<void> _handleBackup() async {
    setState(() {
      _isBackingUp = true;
    });

    try {
      // Simulate backup process
      await Future.delayed(const Duration(seconds: 2));

      await ref.read(settingsProvider.notifier).setLastBackupTime(DateTime.now());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('备份成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('备份失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isBackingUp = false;
        });
      }
    }
  }

  Future<void> _handleRestore() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认恢复'),
        content: const Text('恢复将覆盖当前聊天记录，是否继续？'),
        actions: [
          TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(onPressed: () => context.pop(true), child: const Text('确定', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isRestoring = true;
    });

    try {
      // Simulate restore process
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('恢复成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('恢复失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isRestoring = false;
        });
      }
    }
  }

  void _showBackupOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '备份包含',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('图片'),
                value: _includeImages,
                onChanged: (value) {
                  setModalState(() {
                    _includeImages = value;
                  });
                  setState(() {
                    _includeImages = value;
                  });
                },
              ),
              SwitchListTile(
                title: const Text('文件'),
                value: _includeFiles,
                onChanged: (value) {
                  setModalState(() {
                    _includeFiles = value;
                  });
                  setState(() {
                    _includeFiles = value;
                  });
                },
              ),
              SwitchListTile(
                title: const Text('视频'),
                value: _includeVideos,
                onChanged: (value) {
                  setModalState(() {
                    _includeVideos = value;
                  });
                  setState(() {
                    _includeVideos = value;
                  });
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  text: '确定',
                  onPressed: () => context.pop(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backupSettings = ref.watch(backupSettingsProvider);
    final backupSize = _calculateBackupSize();

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('聊天记录备份'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      title: const Text('上次备份'),
                      subtitle: Text(
                        backupSettings.lastBackupTime != null
                            ? DateFormat.yMMMd().add_Hm().format(backupSettings.lastBackupTime!)
                            : '从未备份',
                      ),
                    ),
                    Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                    ListTile(
                      title: const Text('备份大小'),
                      subtitle: Text(_formatSize(backupSize)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              AppButton(
                text: '立即备份',
                onPressed: _isBackingUp ? null : _handleBackup,
                loading: _isBackingUp,
                type: AppButtonType.primary,
              ),
              const SizedBox(height: 12),
              AppButton(
                text: '恢复聊天记录',
                onPressed: (_isRestoring || backupSettings.lastBackupTime == null) ? null : _handleRestore,
                loading: _isRestoring,
                type: AppButtonType.secondary,
              ),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    SwitchListTile(
                      title: const Text('自动备份'),
                      subtitle: const Text('每天凌晨自动备份'),
                      value: backupSettings.autoBackup,
                      onChanged: (value) async {
                        await ref.read(settingsProvider.notifier).setAutoBackup(value);
                      },
                    ),
                    Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                    ListTile(
                      title: const Text('备份包含'),
                      subtitle: Text([
                        if (_includeImages) '图片',
                        if (_includeFiles) '文件',
                        if (_includeVideos) '视频',
                      ].isEmpty ? '仅文字' : [if (_includeImages || _includeFiles || _includeVideos) '文字', if (_includeImages) '图片', if (_includeFiles) '文件', if (_includeVideos) '视频'].join('、')),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: _showBackupOptions,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (_isBackingUp || _isRestoring)
            Container(
              color: Colors.black54,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      _isBackingUp ? '正在备份...' : '正在恢复...',
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
