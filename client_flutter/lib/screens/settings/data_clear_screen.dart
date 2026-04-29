import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';

class DataClearScreen extends StatelessWidget {
  const DataClearScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('数据清理'),
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
                ListTile(
                  title: const Text('缓存大小'),
                  subtitle: const Text('0 B'),
                  trailing: TextButton(
                    onPressed: () {},
                    child: const Text('清理'),
                  ),
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                ListTile(
                  title: const Text('聊天文件'),
                  subtitle: const Text('0 B'),
                  trailing: TextButton(
                    onPressed: () {},
                    child: const Text('清理'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                ListTile(
                  title: const Text('清空所有聊天记录'),
                  textColor: AppColors.error,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('确认清空'),
                        content: const Text('此操作将删除所有聊天记录，无法恢复，确定继续吗？'),
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
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
