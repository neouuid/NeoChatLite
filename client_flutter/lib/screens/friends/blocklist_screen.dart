import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class BlocklistScreen extends ConsumerStatefulWidget {
  const BlocklistScreen({super.key});

  @override
  ConsumerState<BlocklistScreen> createState() => _BlocklistScreenState();
}

class _BlocklistScreenState extends ConsumerState<BlocklistScreen> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);

    final blockedUsers = friendState.friends
        .where((f) => f.status == FriendStatus.blocked)
        .toList();

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('黑名单'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: friendState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : blockedUsers.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.block_outlined,
                        size: 64,
                        color: AppColors.textSecondaryDark,
                      ),
                      SizedBox(height: 16),
                      Text(
                        '黑名单为空',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.textSecondaryDark,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final friend = blockedUsers[index];
                    final user = friend.friend;
                    return Container(
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.surfaceDark
                            : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ListTile(
                        leading: AppAvatar(
                          name: user?.nickname ?? '用户',
                          size: AvatarSize.medium,
                          avatarUrl: user?.avatar,
                        ),
                        title: Text(
                          friend.alias ?? user?.nickname ?? '用户',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                          ),
                        ),
                        subtitle: const Text(
                          '已拉黑',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondaryDark,
                          ),
                        ),
                        trailing: TextButton(
                          onPressed: () => _showUnblockDialog(friend),
                          child: const Text('移除',
                              style: TextStyle(color: AppColors.primary)),
                        ),
                        onTap: () {},
                      ),
                    );
                  },
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemCount: blockedUsers.length,
                ),
    );
  }

  void _showUnblockDialog(dynamic friend) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('确定移除黑名单？'),
        content: const Text('移除后将可以收到对方消息'),
        actions: [
          TextButton(
            onPressed: () => dialogContext.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              dialogContext.pop();
              final scaffoldMessenger = ScaffoldMessenger.of(context);
              final notifier = ref.read(friendListProvider.notifier);
              final success = await notifier.unblockUser(friend.friendId);
              if (success && mounted) {
                scaffoldMessenger.showSnackBar(
                  const SnackBar(content: Text('已移除黑名单')),
                );
              }
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
