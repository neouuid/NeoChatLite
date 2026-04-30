import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class ViewProfileScreen extends ConsumerStatefulWidget {
  const ViewProfileScreen({super.key, required this.userId});

  final String userId;

  @override
  ConsumerState<ViewProfileScreen> createState() => _ViewProfileScreenState();
}

class _ViewProfileScreenState extends ConsumerState<ViewProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);
    final authState = ref.watch(authStateProvider);

    final isSelf = authState.user?.id == widget.userId;
    final friend = friendState.friends.firstWhere(
      (f) => f.friendId == widget.userId || (f.friend?.id == widget.userId),
      orElse: () => Friend(
        id: '',
        userId: '',
        friendId: widget.userId,
        status: FriendStatus.accepted,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
    final isFriend = friend.status == FriendStatus.accepted;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (isFriend) ...[
            PopupMenuButton<String>(
              onSelected: (value) => _handleMenuAction(value),
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'alias',
                  child: ListTile(
                    leading: Icon(Icons.edit),
                    title: Text('修改备注'),
                  ),
                ),
                const PopupMenuItem(
                  value: 'block',
                  child: ListTile(
                    leading: Icon(Icons.block, color: AppColors.error),
                    title: Text('拉黑', style: TextStyle(color: AppColors.error)),
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: ListTile(
                    leading: Icon(Icons.delete_outline, color: AppColors.error),
                    title:
                        Text('删除好友', style: TextStyle(color: AppColors.error)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildHeader(isDark, friend, isSelf, isFriend),
          const SizedBox(height: 24),
          if (!isSelf && !isFriend) ...[
            AppButton(
              text: '添加好友',
              onPressed: () => _sendFriendRequest(),
              type: AppButtonType.primary,
            ),
          ] else if (isFriend) ...[
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: '发消息',
                    onPressed: () => _startChat(),
                    type: AppButtonType.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    text: '语音通话',
                    onPressed: () =>
                        context.push(Uri(path: '/voice-call', queryParameters: {
                      'userId': widget.userId,
                    }).toString()),
                    type: AppButtonType.secondary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDark, Friend friend, bool isSelf, bool isFriend) {
    final user = friend.friend;
    return Column(
      children: [
        Hero(
          tag: 'avatar-${widget.userId}',
          child: AppAvatar(
            name: user?.nickname ?? '用户',
            size: AvatarSize.large,
            avatarUrl: user?.avatar,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          friend.alias ?? user?.nickname ?? '用户',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color:
                isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        if (user?.username != null) ...[
          const SizedBox(height: 4),
          Text(
            '@${user!.username}',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryDark,
            ),
          ),
        ],
        if (user?.bio != null) ...[
          const SizedBox(height: 8),
          Text(
            user!.bio!,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryDark,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 16),
        if (isFriend)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              '好友',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
      ],
    );
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'alias':
        _showEditAliasDialog();
        break;
      case 'block':
        _showBlockDialog();
        break;
      case 'delete':
        _showDeleteFriendDialog();
        break;
    }
  }

  void _showEditAliasDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('修改备注'),
        content: AppInput(
          controller: controller,
          hint: '输入备注名',
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              context.pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('备注已修改')),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showBlockDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确定拉黑？'),
        content: const Text('拉黑后将无法收到对方消息'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              context.pop();
              final notifier = ref.read(friendListProvider.notifier);
              final success = await notifier.blockUser(widget.userId);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('已拉黑')),
                );
                context.pop();
              }
            },
            child: const Text('确定', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _showDeleteFriendDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确定删除好友？'),
        content: const Text('删除后将无法恢复聊天记录'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              context.pop();
              final notifier = ref.read(friendListProvider.notifier);
              final success = await notifier.removeFriend(widget.userId);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('已删除好友')),
                );
                context.pop();
              }
            },
            child: const Text('确定', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _sendFriendRequest() async {
    final notifier = ref.read(friendListProvider.notifier);
    final success = await notifier.sendFriendRequest(widget.userId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('好友请求已发送')),
      );
    }
  }

  void _startChat() {
    context.pop();
  }
}
