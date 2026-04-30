import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/providers/services_provider.dart';

class DataClearScreen extends ConsumerStatefulWidget {
  const DataClearScreen({super.key});

  @override
  ConsumerState<DataClearScreen> createState() => _DataClearScreenState();
}

class _DataClearScreenState extends ConsumerState<DataClearScreen> {
  int _cacheSize = 0;
  int _chatFilesSize = 0;
  bool _isCalculating = true;
  bool _isClearingCache = false;
  bool _isClearingChatFiles = false;
  bool _isClearingAll = false;

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024)
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  Future<int> _calculateDirectorySize(Directory dir) async {
    int totalSize = 0;
    try {
      if (await dir.exists()) {
        await for (final entity in dir.list(recursive: true)) {
          if (entity is File) {
            totalSize += await entity.length();
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return totalSize;
  }

  Future<void> _calculateSizes() async {
    setState(() {
      _isCalculating = true;
    });

    try {
      final tempDir = await getTemporaryDirectory();
      final appDocDir = await getApplicationDocumentsDirectory();
      final appSupportDir = await getApplicationSupportDirectory();

      int cacheSize = 0;
      cacheSize += await _calculateDirectorySize(tempDir);
      // Add other cache directories as needed

      int chatFilesSize = 0;
      chatFilesSize += await _calculateDirectorySize(
          Directory('${appDocDir.path}/chat_files'));
      chatFilesSize += await _calculateDirectorySize(
          Directory('${appSupportDir.path}/chat_files'));

      // Also calculate from messages with media
      final conversations = ref.read(conversationListProvider).conversations;
      for (final conv in conversations) {
        final messages = ref.read(messagesProvider(conv.id)).messages;
        for (final msg in messages) {
          if (msg.fileSize != null) {
            chatFilesSize += msg.fileSize!;
          }
        }
      }

      if (mounted) {
        setState(() {
          _cacheSize = cacheSize;
          _chatFilesSize = chatFilesSize;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCalculating = false;
        });
      }
    }
  }

  Future<void> _clearCache() async {
    setState(() {
      _isClearingCache = true;
    });

    try {
      final tempDir = await getTemporaryDirectory();
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
        await tempDir.create();
      }

      if (mounted) {
        setState(() {
          _cacheSize = 0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('缓存清理成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('清理失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isClearingCache = false;
        });
      }
    }
  }

  Future<void> _clearChatFiles() async {
    setState(() {
      _isClearingChatFiles = true;
    });

    try {
      final appDocDir = await getApplicationDocumentsDirectory();
      final appSupportDir = await getApplicationSupportDirectory();

      final chatFilesDir1 = Directory('${appDocDir.path}/chat_files');
      final chatFilesDir2 = Directory('${appSupportDir.path}/chat_files');

      if (await chatFilesDir1.exists()) {
        await chatFilesDir1.delete(recursive: true);
      }
      if (await chatFilesDir2.exists()) {
        await chatFilesDir2.delete(recursive: true);
      }

      if (mounted) {
        setState(() {
          _chatFilesSize = 0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('聊天文件清理成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('清理失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isClearingChatFiles = false;
        });
      }
    }
  }

  Future<void> _clearAllChatHistory() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认清空'),
        content: const Text('此操作将删除所有聊天记录，无法恢复，确定继续吗？'),
        actions: [
          TextButton(
              onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(
              onPressed: () => context.pop(true),
              child:
                  const Text('确定', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isClearingAll = true;
    });

    try {
      final storage = ref.read(storageServiceProvider);
      await storage.clearAll();

      // Refresh providers
      ref.invalidate(conversationListProvider);
      ref.invalidate(friendListProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('聊天记录已清空')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('清空失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isClearingAll = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _calculateSizes();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('数据清理'),
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
                  color:
                      isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      title: const Text('缓存大小'),
                      subtitle: Text(
                          _isCalculating ? '计算中...' : _formatSize(_cacheSize)),
                      trailing: _isCalculating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : TextButton(
                              onPressed: _cacheSize == 0 || _isClearingCache
                                  ? null
                                  : _clearCache,
                              child: _isClearingCache
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2))
                                  : const Text('清理'),
                            ),
                    ),
                    Divider(
                        height: 1,
                        color: isDark
                            ? AppColors.inputBackgroundDark
                            : AppColors.backgroundLight),
                    ListTile(
                      title: const Text('聊天文件'),
                      subtitle: Text(_isCalculating
                          ? '计算中...'
                          : _formatSize(_chatFilesSize)),
                      trailing: _isCalculating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : TextButton(
                              onPressed:
                                  _chatFilesSize == 0 || _isClearingChatFiles
                                      ? null
                                      : _clearChatFiles,
                              child: _isClearingChatFiles
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2))
                                  : const Text('清理'),
                            ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(
                  color:
                      isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      title: const Text('清空所有聊天记录'),
                      textColor: AppColors.error,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: _isClearingAll ? null : _clearAllChatHistory,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (_isClearingAll)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text(
                      '正在清空...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
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
