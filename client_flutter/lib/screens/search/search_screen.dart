import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

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
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: AppInput(
          controller: _searchController,
          hint: '搜索好友或群聊',
          autofocus: true,
          onChanged: (value) {
            setState(() {
              _query = value;
            });
          },
        ),
      ),
      body: _query.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.search_outlined,
                    size: 64,
                    color: AppColors.textSecondaryDark,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '搜索联系人',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondaryDark,
                    ),
                  ),
                ],
              ),
            )
          : filteredFriends.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.person_search_outlined,
                        size: 64,
                        color: AppColors.textSecondaryDark,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '未找到相关结果',
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
                    final friend = filteredFriends[index];
                    final user = friend.friend;
                    return Container(
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
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
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          ),
                        ),
                        subtitle: user?.username != null
                            ? Text(
                                '@${user!.username}',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondaryDark,
                                ),
                              )
                            : null,
                        onTap: () => context.push('/profile/${friend.friendId}'),
                      ),
                    );
                  },
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemCount: filteredFriends.length,
                ),
    );
  }
}
