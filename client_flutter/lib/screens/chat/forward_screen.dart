import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class ForwardScreen extends ConsumerStatefulWidget {
  const ForwardScreen({super.key, required this.messageId});

  final String messageId;

  @override
  ConsumerState<ForwardScreen> createState() => _ForwardScreenState();
}

class _ForwardScreenState extends ConsumerState<ForwardScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  final List<String> _selectedConversations = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);

    final filteredFriends = friendState.friends.where((f) {
      if (_query.isEmpty) return true;
      final friend = f.friend;
      if (friend == null) return false;
      return friend.nickname.toLowerCase().contains(_query.toLowerCase()) ||
          friend.username.toLowerCase().contains(_query.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('转发'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: _selectedConversations.isEmpty
                ? null
                : () {
                    context.pop();
                  },
            child: Text(
              '发送${_selectedConversations.isEmpty ? '' : '(${_selectedConversations.length})'}',
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: AppInput(
              controller: _searchController,
              hint: '搜索',
              onChanged: (value) {
                setState(() {
                  _query = value;
                });
              },
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                final friend = filteredFriends[index];
                final user = friend.friend;
                final isSelected = _selectedConversations.contains(friend.friendId);

                return Container(
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    leading: Stack(
                      children: [
                        AppAvatar(
                          name: user?.nickname ?? '用户',
                          size: AvatarSize.medium,
                          avatarUrl: user?.avatar,
                        ),
                        if (isSelected)
                          Positioned(
                            right: -4,
                            bottom: -4,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(Icons.check, size: 14, color: Colors.white),
                            ),
                          ),
                      ],
                    ),
                    title: Text(
                      friend.alias ?? user?.nickname ?? '用户',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedConversations.remove(friend.friendId);
                        } else {
                          _selectedConversations.add(friend.friendId);
                        }
                      });
                    },
                  ),
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemCount: filteredFriends.length,
            ),
          ),
        ],
      ),
    );
  }
}
