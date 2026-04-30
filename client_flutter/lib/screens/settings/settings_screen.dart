import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/providers/theme_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/settings_provider.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/core/theme/app_theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isMobile = MediaQuery.of(context).size.width < 768;
    final authState = ref.watch(authStateProvider);
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: isMobile
          ? AppBar(
              title: const Text('系统设置'),
              centerTitle: true,
            )
          : null,
      body: SafeArea(
        child: isMobile
            ? _buildMobileLayout(context, isDark, authState, ref)
            : _buildDesktopLayout(context, isDark, authState, ref),
      ),
    );
  }

  Widget _buildMobileLayout(BuildContext context, bool isDark, AuthState authState, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildHeader(isDark),
        const SizedBox(height: 20),
        _buildAccountSection(context, isDark),
        const SizedBox(height: 16),
        _buildNotificationSection(context, isDark, ref),
        const SizedBox(height: 16),
        _buildPrivacySection(context, isDark),
        const SizedBox(height: 16),
        _buildMoreSection(context, isDark),
        const SizedBox(height: 24),
        _buildLogoutButton(context, isDark, ref),
      ],
    );
  }

  Widget _buildDesktopLayout(BuildContext context, bool isDark, AuthState authState, WidgetRef ref) {
    return Row(
      children: [
        _buildIconSidebar(context, isDark),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(32),
            children: [
              _buildHeader(isDark),
              const SizedBox(height: 20),
              _buildAccountSection(context, isDark),
              const SizedBox(height: 16),
              _buildNotificationSection(context, isDark, ref),
              const SizedBox(height: 16),
              _buildPrivacySection(context, isDark),
              const SizedBox(height: 16),
              _buildMoreSection(context, isDark),
              const SizedBox(height: 24),
              _buildLogoutButton(context, isDark, ref),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIconSidebar(BuildContext context, bool isDark) {
    return Container(
      width: 72,
      color: AppColors.backgroundDark,
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Expanded(
            child: Column(
              children: [
                // 用户头像
                AppAvatar(
                  name: '我',
                  size: AvatarSize.medium,
                  backgroundColor: AppColors.warning,
                ),
                const SizedBox(height: 16),
                // 聊天图标
                _buildNavIcon(Icons.message, () => context.go('/'), isDark, false),
                const SizedBox(height: 16),
                // 群组图标
                _buildNavIcon(Icons.group, () {}, isDark, false),
                const SizedBox(height: 16),
                // 好友图标
                _buildNavIcon(Icons.person_add, () => context.go('/friends'), isDark, false),
              ],
            ),
          ),
          // 设置图标（选中）
          _buildNavIcon(Icons.settings, () {}, isDark, true),
        ],
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, VoidCallback onTap, bool isDark, bool selected) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.inputBackgroundDark,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          icon,
          color: selected ? Colors.white : AppColors.textSecondaryDark,
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '系统设置',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '管理您的账户和应用偏好设置',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondaryDark,
          ),
        ),
      ],
    );
  }

  Widget _buildAccountSection(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(isDark, Icons.person, '账户设置'),
          const SizedBox(height: 16),
          _buildMenuItem(
            isDark,
            Icons.person_outline,
            '个人资料',
            onTap: () => context.go('/profile'),
          ),
          _buildMenuItem(
            isDark,
            Icons.lock_outline,
            '账户安全',
            onTap: () => context.go('/account-security'),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationSection(BuildContext context, bool isDark, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(isDark, Icons.notifications_outlined, '通知设置'),
          const SizedBox(height: 16),
          _buildMenuItem(
            isDark,
            Icons.notifications_outlined,
            '通知设置',
            onTap: () => context.go('/notification-settings'),
          ),
          _buildSwitchItem(
            isDark,
            Icons.notifications_active_outlined,
            '消息通知',
            settings.enabled,
            (value) => ref.read(settingsProvider.notifier).setEnabled(value),
          ),
          _buildSwitchItem(
            isDark,
            Icons.volume_up_outlined,
            '声音',
            settings.sound,
            (value) => ref.read(settingsProvider.notifier).setSound(value),
          ),
          _buildSwitchItem(
            isDark,
            Icons.vibration_outlined,
            '震动',
            settings.vibration,
            (value) => ref.read(settingsProvider.notifier).setVibration(value),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacySection(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(isDark, Icons.shield_outlined, '隐私设置'),
          const SizedBox(height: 16),
          _buildSwitchItem(isDark, Icons.visibility_outlined, '在线状态', true, (value) {}),
          _buildMenuItem(
            isDark,
            Icons.block_outlined,
            '黑名单',
            onTap: () => context.go('/blocklist'),
          ),
        ],
      ),
    );
  }

  Widget _buildMoreSection(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(isDark, Icons.layers_outlined, '更多设置'),
          const SizedBox(height: 16),
          _buildMenuItem(
            isDark,
            Icons.palette_outlined,
            '主题设置',
            onTap: () => context.go('/theme'),
          ),
          _buildMenuItem(
            isDark,
            Icons.chat_bubble_outline,
            '聊天背景',
            onTap: () => context.go('/chat-background'),
          ),
          _buildMenuItem(
            isDark,
            Icons.backup_outlined,
            '聊天备份',
            onTap: () => context.go('/chat-backup'),
          ),
          _buildMenuItem(
            isDark,
            Icons.cleaning_services_outlined,
            '数据清理',
            onTap: () => context.go('/data-clear'),
          ),
          _buildMenuItem(
            isDark,
            Icons.info_outline,
            '关于',
            onTap: () => context.go('/about'),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, bool isDark, WidgetRef ref) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('退出登录'),
                content: const Text('确定要退出登录吗？'),
                actions: [
                  TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
                  TextButton(
                    onPressed: () => context.pop(true),
                    child: const Text('确定', style: TextStyle(color: AppColors.error)),
                  ),
                ],
              ),
            );

            if (confirmed == true && context.mounted) {
              await ref.read(authStateProvider.notifier).logout();
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.logout, color: AppColors.error, size: 24),
                const SizedBox(width: 12),
                Text(
                  '退出登录',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(bool isDark, IconData icon, String title) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: AppColors.primary,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem(bool isDark, IconData icon, String title, {VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(
                icon,
                color: AppColors.textSecondaryDark,
                size: 22,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppColors.textSecondaryDark,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchItem(bool isDark, IconData icon, String title, bool value, ValueChanged<bool> onChanged) {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Icon(
            icon,
            color: AppColors.textSecondaryDark,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 15,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
          ),
          Transform.scale(
            scale: 0.9,
            child: Switch(
              value: value,
              onChanged: onChanged,
              thumbColor: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return Colors.white;
                }
                return null;
              }),
              trackColor: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return AppColors.primary;
                }
                return null;
              }),
            ),
          ),
        ],
      ),
    );
  }
}
