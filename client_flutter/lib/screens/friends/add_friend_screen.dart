import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class AddFriendScreen extends ConsumerStatefulWidget {
  const AddFriendScreen({super.key});

  @override
  ConsumerState<AddFriendScreen> createState() => _AddFriendScreenState();
}

class _AddFriendScreenState extends ConsumerState<AddFriendScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('添加好友'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: AppInput(
              controller: _searchController,
              hint: '搜索用户名/手机号',
              prefixIcon: Icon(Icons.search, color: AppColors.textSecondaryDark),
              onSubmitted: (_) => _search(),
            ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildSectionTitle('添加方式', isDark),
                  const SizedBox(height: 12),
                  _buildAddMethod(
                    Icons.person_add,
                    '扫码添加',
                    '扫描二维码添加好友',
                    () {},
                    isDark,
                  ),
                  const SizedBox(height: 8),
                  _buildAddMethod(
                    Icons.qr_code,
                    '我的二维码',
                    '让朋友扫描添加我',
                    () {},
                    isDark,
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('好友请求', isDark),
                  const SizedBox(height: 12),
                  if (friendState.isLoading)
                    const Center(child: CircularProgressIndicator())
                  else if (friendState.friends.isEmpty)
                    Center(
                      child: Text(
                        '暂无好友请求',
                        style: TextStyle(
                          color: AppColors.textSecondaryDark,
                        ),
                      ),
                    )
                  else ...[
                    for (final friend in friendState.friends.where((f) => f.status == FriendStatus.pending))
                      _buildFriendRequestItem(friend, isDark),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
      ),
    );
  }

  Widget _buildAddMethod(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
    bool isDark,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: AppColors.textSecondaryDark,
          ),
        ),
        trailing: Icon(Icons.chevron_right, color: AppColors.textSecondaryDark),
        onTap: onTap,
      ),
    );
  }

  Widget _buildFriendRequestItem(Friend friend, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: AppAvatar(
          name: friend.friend?.nickname ?? '用户',
          avatarUrl: friend.friend?.avatar,
          size: AvatarSize.medium,
        ),
        title: Text(
          friend.friend?.nickname ?? '用户',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        subtitle: Text(
          '请求添加你为好友',
          style: TextStyle(
            fontSize: 13,
            color: AppColors.textSecondaryDark,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 36,
              child: AppButton(
                text: '接受',
                onPressed: () => _acceptRequest(friend.id),
                type: AppButtonType.primary,
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 36,
              child: AppButton(
                text: '拒绝',
                onPressed: () => _rejectRequest(friend.id),
                type: AppButtonType.secondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _search() {
  }

  void _acceptRequest(String requestId) async {
    final notifier = ref.read(friendListProvider.notifier);
    final success = await notifier.acceptFriendRequest(requestId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已添加好友')),
      );
    }
  }

  void _rejectRequest(String requestId) async {
    final notifier = ref.read(friendListProvider.notifier);
    final success = await notifier.rejectFriendRequest(requestId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已拒绝')),
      );
    }
  }
}
