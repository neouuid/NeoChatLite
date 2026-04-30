import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final TextEditingController _nameController = TextEditingController();
  final List<String> _selectedUsers = [];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);
    final friends = friendState.friends.where((f) => f.status == FriendStatus.accepted).toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('创建群组'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: _selectedUsers.isEmpty ? null : _createGroup,
            child: const Text('创建'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppInput(
            controller: _nameController,
            hint: '群名称',
            label: '群名称',
          ),
          const SizedBox(height: 24),
          Text(
            '选择成员 (${_selectedUsers.length})',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          if (friendState.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (friends.isEmpty)
            Center(
              child: Column(
                children: [
                  Icon(Icons.people_outline, size: 64, color: AppColors.textSecondaryDark),
                  const SizedBox(height: 16),
                  Text(
                    '还没有好友',
                    style: TextStyle(color: AppColors.textSecondaryDark),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final friend = friends[index];
                final user = friend.friend;
                final isSelected = _selectedUsers.contains(friend.friendId);
                return Container(
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: CheckboxListTile(
                    value: isSelected,
                    onChanged: (value) {
                      setState(() {
                        if (value == true) {
                          _selectedUsers.add(friend.friendId);
                        } else {
                          _selectedUsers.remove(friend.friendId);
                        }
                      });
                    },
                    secondary: AppAvatar(
                      name: user?.nickname ?? '用户',
                      size: AvatarSize.medium,
                      avatarUrl: user?.avatar,
                    ),
                    title: Text(
                      friend.alias ?? user?.nickname ?? '用户',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemCount: friends.length,
            ),
        ],
      ),
    );
  }

  void _createGroup() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入群名称')),
      );
      return;
    }

    context.pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('群组创建成功')),
    );
  }
}
