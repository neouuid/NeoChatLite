import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  List<User> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _hasSearched = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _hasSearched = true;
    });

    try {
      final userService = ref.read(userServiceProvider);
      final response = await userService.searchUsers(query);
      if (mounted) {
        setState(() {
          _searchResults = response.data?.items ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('搜索失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }

  Future<void> _addFriend(User user) async {
    try {
      final userService = ref.read(userServiceProvider);
      await userService.sendFriendRequest(user.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('好友请求已发送')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('发送失败: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);
    final friendIds = friendState.friends.map((f) => f.friendId).toSet();

    final filteredFriends = friendState.friends.where((f) {
      if (_query.isEmpty) return true;
      final friend = f.friend;
      if (friend == null) return false;
      return friend.nickname.toLowerCase().contains(_query.toLowerCase()) ||
          friend.username.toLowerCase().contains(_query.toLowerCase());
    }).toList();

    final showFriends = _query.isEmpty;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: AppInput(
          controller: _searchController,
          hint: '搜索用户、群聊',
          autofocus: true,
          onChanged: (value) {
            setState(() {
              _query = value;
            });
          },
          onSubmitted: (_) => _search(),
        ),
      ),
      body: showFriends
          ? _buildFriendsList(isDark, filteredFriends)
          : _hasSearched
              ? _buildSearchResults(isDark, friendIds)
              : _buildEmptyState(isDark),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_outlined,
            size: 64,
            color: AppColors.textSecondaryDark,
          ),
          SizedBox(height: 16),
          Text(
            '搜索用户或群聊',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondaryDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFriendsList(bool isDark, List<Friend> friends) {
    if (friends.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outlined,
              size: 64,
              color: AppColors.textSecondaryDark,
            ),
            SizedBox(height: 16),
            Text(
              '还没有好友',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondaryDark,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final friend = friends[index];
        final user = friend.friend;
        return _buildUserItem(
          isDark,
          user,
          true,
          () => context.push('/profile/${friend.friendId}'),
        );
      },
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemCount: friends.length,
    );
  }

  Widget _buildSearchResults(bool isDark, Set<String> friendIds) {
    if (_isSearching) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_searchResults.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_search_outlined,
              size: 64,
              color: AppColors.textSecondaryDark,
            ),
            SizedBox(height: 16),
            Text(
              '未找到相关用户',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondaryDark,
              ),
            ),
          ],
        ),
      );
    }

    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.user?.id;

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        final isFriend = friendIds.contains(user.id);
        final isMe = user.id == currentUserId;

        return _buildUserItem(
          isDark,
          user,
          isMe || isFriend,
          isMe
              ? null
              : isFriend
                  ? () => context.push('/profile/${user.id}')
                  : () => _addFriend(user),
          buttonText: isMe ? null : (isFriend ? '查看资料' : '添加好友'),
        );
      },
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemCount: _searchResults.length,
    );
  }

  Widget _buildUserItem(
    bool isDark,
    User? user,
    bool hasArrow,
    VoidCallback? onTap, {
    String? buttonText,
  }) {
    if (user == null) return const SizedBox.shrink();

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                AppAvatar(
                  name: user.nickname,
                  size: AvatarSize.medium,
                  avatarUrl: user.avatar,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.nickname,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '@${user.username}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondaryDark,
                        ),
                      ),
                    ],
                  ),
                ),
                if (buttonText != null)
                  SizedBox(
                    height: 36,
                    child: AppButton(
                      text: buttonText,
                      onPressed: onTap,
                    ),
                  )
                else if (hasArrow)
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.textSecondaryDark,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
