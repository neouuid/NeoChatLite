import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/core/theme/app_theme.dart';

class FriendManageScreen extends StatelessWidget {
  const FriendManageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isMobile = MediaQuery.of(context).size.width < 768;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: isMobile
          ? AppBar(
              title: const Text('好友管理'),
              centerTitle: true,
            )
          : null,
      body: SafeArea(
        child: isMobile
            ? _buildMobileLayout(isDark)
            : _buildDesktopLayout(isDark),
      ),
    );
  }

  Widget _buildMobileLayout(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchAndAdd(isDark),
          const SizedBox(height: 16),
          _buildFriendRequests(isDark),
          const SizedBox(height: 16),
          _buildFriendsList(isDark),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout(bool isDark) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 880),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '好友管理',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _buildSearchAndAdd(isDark),
              const SizedBox(height: 16),
              _buildFriendRequests(isDark),
              const SizedBox(height: 16),
              _buildFriendsList(isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchAndAdd(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(Icons.search, color: AppColors.textSecondaryDark, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '搜索用户名或手机号添加好友...',
                      style: TextStyle(
                        color: AppColors.textSecondaryDark,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            height: 44,
            child: AppButton(
              text: '添加',
              onPressed: () {},
              width: 100,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFriendRequests(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '好友请求',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '2',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildRequestItem(isDark, '赵小云', '我是产品部的小赵，想加你好友', AppColors.primaryLight),
        ],
      ),
    );
  }

  Widget _buildRequestItem(bool isDark, String name, String message, Color avatarColor) {
    return Row(
      children: [
        AppAvatar(
          name: name,
          size: AvatarSize.large,
          backgroundColor: avatarColor,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                message,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondaryDark,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Row(
          children: [
            SizedBox(
              height: 36,
              child: AppButton(
                text: '拒绝',
                onPressed: () {},
                type: AppButtonType.secondary,
                width: 80,
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 36,
              child: AppButton(
                text: '接受',
                onPressed: () {},
                width: 80,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFriendsList(bool isDark) {
    final friends = [
      {
        'name': '张伟',
        'status': '在线 · 正在聊天',
        'avatarColor': AppColors.success,
        'isOnline': true,
      },
      {
        'name': '李明',
        'status': '3小时前在线',
        'avatarColor': AppColors.primary,
        'isOnline': false,
      },
      {
        'name': '王芳',
        'status': '在线',
        'avatarColor': AppColors.secondary,
        'isOnline': true,
      },
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '我的好友',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
              Text(
                '${friends.length} 位',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondaryDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 筛选器
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('全部', true, isDark),
                const SizedBox(width: 8),
                _buildFilterChip('在线', false, isDark),
                const SizedBox(width: 8),
                _buildFilterChip('群组', false, isDark),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // 好友列表
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              final friend = friends[index];
              return _buildFriendItem(
                context,
                isDark,
                friend['name'] as String,
                friend['status'] as String,
                friend['avatarColor'] as Color,
                friend['isOnline'] as bool,
              );
            },
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemCount: friends.length,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool selected, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: selected ? AppColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: selected ? Colors.white : AppColors.textSecondaryDark,
        ),
      ),
    );
  }

  Widget _buildFriendItem(
    BuildContext context,
    bool isDark,
    String name,
    String status,
    Color avatarColor,
    bool isOnline,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          AppAvatar(
            name: name,
            size: AvatarSize.medium,
            backgroundColor: avatarColor,
            showStatus: true,
            statusColor: isOnline ? AppColors.statusOnline : AppColors.statusOffline,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  status,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: IconButton(
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  color: AppColors.textSecondaryDark,
                  onPressed: () => context.go('/'),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  color: AppColors.textSecondaryDark,
                  onPressed: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
