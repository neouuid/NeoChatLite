import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class AddFriendScreen extends ConsumerStatefulWidget {
  const AddFriendScreen({super.key});

  @override
  ConsumerState<AddFriendScreen> createState() => _AddFriendScreenState();
}

class _AddFriendScreenState extends ConsumerState<AddFriendScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<User> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;
  final Set<String> _pendingRequests = {};

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

  Future<void> _sendFriendRequest(User user) async {
    if (_pendingRequests.contains(user.id)) return;

    setState(() {
      _pendingRequests.add(user.id);
    });

    try {
      final userService = ref.read(userServiceProvider);
      final response = await userService.sendFriendRequest(user.id);

      if (response.success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('好友请求已发送')),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(response.message ?? '发送失败'),
              backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('发送失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _pendingRequests.remove(user.id);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final friendState = ref.watch(friendListProvider);

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
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
                prefixIcon: const Icon(Icons.search,
                    color: AppColors.textSecondaryDark),
                onSubmitted: (_) => _search(),
              ),
            ),
            Expanded(
              child: _hasSearched
                  ? _buildSearchResults(isDark)
                  : _buildDefaultContent(isDark, friendState),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults(bool isDark) {
    if (_isSearching) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_searchResults.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off_outlined,
                size: 64, color: AppColors.textSecondaryDark),
            SizedBox(height: 16),
            Text(
              '未找到用户',
              style: TextStyle(color: AppColors.textSecondaryDark),
            ),
          ],
        ),
      );
    }

    final friendIds =
        ref.read(friendListProvider).friends.map((f) => f.friendId).toSet();

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _searchResults.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        final isAlreadyFriend = friendIds.contains(user.id);
        final isPending = _pendingRequests.contains(user.id);

        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            leading: AppAvatar(
              name: user.nickname,
              avatarUrl: user.avatar,
              size: AvatarSize.medium,
            ),
            title: Text(
              user.nickname,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
              ),
            ),
            subtitle: Text(
              '@${user.username}',
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondaryDark,
              ),
            ),
            trailing: isAlreadyFriend
                ? Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      '已添加',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )
                : SizedBox(
                    height: 36,
                    child: AppButton(
                      text: '添加',
                      onPressed:
                          isPending ? null : () => _sendFriendRequest(user),
                      loading: isPending,
                      width: 80,
                    ),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildDefaultContent(bool isDark, FriendListState friendState) {
    final pendingRequests = friendState.friends
        .where((f) => f.status == FriendStatus.pending)
        .toList();

    return ListView(
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
        if (pendingRequests.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionTitle('好友请求', isDark),
          const SizedBox(height: 12),
          if (friendState.isLoading)
            const Center(child: CircularProgressIndicator())
          else ...[
            for (final friend in pendingRequests)
              _buildFriendRequestItem(friend, isDark),
          ],
        ],
      ],
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
            color:
                isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.textSecondaryDark,
          ),
        ),
        trailing:
            const Icon(Icons.chevron_right, color: AppColors.textSecondaryDark),
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
            color:
                isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        subtitle: const Text(
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
