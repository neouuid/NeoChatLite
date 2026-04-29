import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/widgets/common/common.dart';

class GroupInfoScreen extends ConsumerStatefulWidget {
  const GroupInfoScreen({super.key, required this.groupId, this.conversationId});

  final String groupId;
  final String? conversationId;

  @override
  ConsumerState<GroupInfoScreen> createState() => _GroupInfoScreenState();
}

class _GroupInfoScreenState extends ConsumerState<GroupInfoScreen> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('群组信息'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildGroupHeader(isDark),
          const SizedBox(height: 24),
          _buildMembersSection(isDark),
          const SizedBox(height: 24),
          _buildSettingsSection(isDark),
          const SizedBox(height: 24),
          _buildDangerZone(isDark),
        ],
      ),
    );
  }

  Widget _buildGroupHeader(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const AppAvatar(
            name: '群组',
            size: AvatarSize.large,
          ),
          const SizedBox(height: 16),
          Text(
            '群组名称',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '群描述',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembersSection(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.people),
            title: const Text('群成员'),
            subtitle: const Text('5 人'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
          ListTile(
            leading: const Icon(Icons.person_add),
            title: const Text('添加成员'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('消息通知'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
          ListTile(
            leading: const Icon(Icons.edit),
            title: const Text('修改群名称'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
          ListTile(
            leading: const Icon(Icons.image),
            title: const Text('群头像'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildDangerZone(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.exit_to_app, color: AppColors.error),
            title: const Text('退出群组', style: TextStyle(color: AppColors.error)),
            onTap: () => _showLeaveDialog(),
          ),
        ],
      ),
    );
  }

  void _showLeaveDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确定退出群组？'),
        content: const Text('退出后将无法查看聊天记录'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('确定', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
