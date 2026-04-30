import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class ChatSettingsScreen extends ConsumerStatefulWidget {
  const ChatSettingsScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<ChatSettingsScreen> createState() => _ChatSettingsScreenState();
}

class _ChatSettingsScreenState extends ConsumerState<ChatSettingsScreen> {
  bool _muteNotifications = false;
  bool _isPinned = false;
  bool _isStrongNotification = false;

  Future<void> _clearChatHistory() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确定清空聊天记录？'),
        content: const Text('清空后将无法恢复'),
        actions: [
          TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(
            onPressed: () => context.pop(true),
            child: const Text('确定', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      // TODO: 调用清空聊天记录API
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('聊天记录已清空')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('聊天设置'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('消息免打扰'),
                  value: _muteNotifications,
                  onChanged: (value) {
                    setState(() {
                      _muteNotifications = value;
                    });
                  },
                  activeColor: AppColors.primary,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                SwitchListTile(
                  title: const Text('置顶聊天'),
                  value: _isPinned,
                  onChanged: (value) {
                    setState(() {
                      _isPinned = value;
                    });
                  },
                  activeColor: AppColors.primary,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                SwitchListTile(
                  title: const Text('强提醒'),
                  value: _isStrongNotification,
                  onChanged: (value) {
                    setState(() {
                      _isStrongNotification = value;
                    });
                  },
                  activeColor: AppColors.primary,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                ListTile(
                  title: const Text('查找聊天记录'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: 打开搜索聊天记录
                  },
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                ListTile(
                  title: const Text('清空聊天记录'),
                  trailing: const Icon(Icons.chevron_right),
                  textColor: AppColors.error,
                  onTap: _clearChatHistory,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
