import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/settings_provider.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('通知设置'),
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
                  title: const Text('接收新消息通知'),
                  value: settings.enabled,
                  onChanged: (value) => ref.read(settingsProvider.notifier).setEnabled(value),
                  activeThumbColor: AppColors.primary,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                SwitchListTile(
                  title: const Text('通知显示详情'),
                  subtitle: const Text('在通知栏显示消息内容'),
                  value: settings.showDetail,
                  onChanged: (value) => ref.read(settingsProvider.notifier).setShowDetail(value),
                  activeThumbColor: AppColors.primary,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                SwitchListTile(
                  title: const Text('通知声音'),
                  value: settings.sound,
                  onChanged: (value) => ref.read(settingsProvider.notifier).setSound(value),
                  activeThumbColor: AppColors.primary,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                SwitchListTile(
                  title: const Text('通知震动'),
                  value: settings.vibration,
                  onChanged: (value) => ref.read(settingsProvider.notifier).setVibration(value),
                  activeThumbColor: AppColors.primary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
