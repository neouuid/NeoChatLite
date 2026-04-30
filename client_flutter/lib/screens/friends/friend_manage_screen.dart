import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/user_provider.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/data/models/user.dart';

class FriendManageScreen extends ConsumerStatefulWidget {
  const FriendManageScreen({super.key});

  @override
  ConsumerState<FriendManageScreen> createState() => _FriendManageScreenState();
}

class _FriendManageScreenState extends ConsumerState<FriendManageScreen> {
  final TextEditingController _searchController = TextEditingController();
  int _selectedFilter = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isMobile = MediaQuery.of(context).size.width < 768;
    final friendState = ref.watch(friendListProvider);

    final pendingRequests = friendState.friends.where((f) => f.status == FriendStatus.pending).toList();
    final acceptedFriends = friendState.friends.where((f) => f.status == FriendStatus.accepted).toList();

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
            ? _buildMobileLayout(isDark, pendingRequests, acceptedFriends, friendState)
            : _buildDesktopLayout(isDark, pendingRequests, acceptedFriends, friendState),
      ),
    );
  }

  Widget _buildMobileLayout(bool isDark, List<Friend> pendingRequests, List<Friend> acceptedFriends, FriendListState friendState) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchAndAdd(isDark),
          const SizedBox(height: 16),
          _buildFriendRequests(isDark, pendingRequests, friendState),
          const SizedBox(height: 16),
          _buildFriendsList(isDark, acceptedFriends, friendState),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout(bool isDark, List<Friend> pendingRequests, List<Friend> acceptedFriends, FriendListState friendState) {
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
              _buildFriendRequests(isDark, pendingRequests, friendState),
              const SizedBox(height: 16),
              _buildFriendsList(isDark, acceptedFriends, friendState),
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
            child: GestureDetector(
              onTap: () => context.go('/add-friend'),
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
          ),
          const SizedBox(width: 12),
          SizedBox(
            height: 44,
            child: AppButton(
              text: '添加',
              onPressed: () => context.go('/add-friend'),
              width: 100,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFriendRequests(bool isDark, List<Friend> pendingRequests, FriendListState friendState) {
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
              if (pendingRequests.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    pendingRequests.length.toString(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (friendState.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (pendingRequests.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  '暂无好友请求',
                  style: TextStyle(color: AppColors.textSecondaryDark),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final request = pendingRequests[index];
                return _buildRequestItem(isDark, request);
              },
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemCount: pendingRequests.length,
            ),
        ],
      ),
    );
  }

  Widget _buildRequestItem(bool isDark, Friend request) {
    return Row(
      children: [
        AppAvatar(
          name: request.friend?.nickname ?? '用户',
          avatarUrl: request.friend?.avatar,
          size: AvatarSize.large,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                request.friend?.nickname ?? '用户',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '想加你好友',
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
                onPressed: () => _handleRejectRequest(request.id),
                type: AppButtonType.secondary,
                width: 80,
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 36,
              child: AppButton(
                text: '接受',
                onPressed: () => _handleAcceptRequest(request.id),
                width: 80,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFriendsList(bool isDark, List<Friend> acceptedFriends, FriendListState friendState) {
    final filteredFriends = _filterFriends(acceptedFriends);

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
                '${acceptedFriends.length} 位',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondaryDark,
                ),
              ),
              TextButton(
                onPressed: () => context.go('/blocklist'),
                child: const Text('黑名单'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('全部', 0, isDark),
                const SizedBox(width: 8),
                _buildFilterChip('在线', 1, isDark),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (friendState.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (filteredFriends.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
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
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final friend = filteredFriends[index];
                return _buildFriendItem(context, isDark, friend);
              },
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemCount: filteredFriends.length,
            ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, int index, bool isDark) {
    final selected = _selectedFilter == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = index;
        });
      },
      child: Container(
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
      ),
    );
  }

  Widget _buildFriendItem(BuildContext context, bool isDark, Friend friend) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          AppAvatar(
            name: friend.friend?.nickname ?? '用户',
            avatarUrl: friend.friend?.avatar,
            size: AvatarSize.medium,
            showStatus: true,
            statusColor: friend.friend?.status == UserStatus.online
                ? AppColors.statusOnline
                : AppColors.statusOffline,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      friend.alias ?? friend.friend?.nickname ?? '用户',
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
                  _getUserStatusText(friend.friend?.status),
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
                  onPressed: () => _startConversation(friend),
                ),
              ),
              const SizedBox(width: 8),
              _buildMoreMenu(context, isDark, friend),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMoreMenu(BuildContext context, bool isDark, Friend friend) {
    return PopupMenuButton(
      onSelected: (value) {
        if (value == 'delete') {
          _handleDeleteFriend(friend);
        } else if (value == 'block') {
          _handleBlockFriend(friend);
        } else if (value == 'view') {
          if (friend.friend?.id != null) {
            context.go('/profile/${friend.friend!.id}');
          }
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          value: 'view',
          child: Row(
            children: [
              const Icon(Icons.person_outline, size: 18),
              const SizedBox(width: 12),
              const Text('查看资料'),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              const Icon(Icons.person_remove_outlined, size: 18),
              const SizedBox(width: 12),
              Text('删除好友', style: TextStyle(color: AppColors.error)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'block',
          child: Row(
            children: [
              const Icon(Icons.block_outlined, size: 18),
              const SizedBox(width: 12),
              Text('加入黑名单', style: TextStyle(color: AppColors.error)),
            ],
          ),
        ),
      ],
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Icon(Icons.more_vert, size: 18, color: AppColors.textSecondaryDark),
      ),
    );
  }

  List<Friend> _filterFriends(List<Friend> friends) {
    if (_selectedFilter == 1) {
      return friends.where((f) => f.friend?.status == UserStatus.online).toList();
    }
    return friends;
  }

  String _getUserStatusText(UserStatus? status) {
    switch (status) {
      case UserStatus.online:
        return '在线';
      case UserStatus.offline:
        return '离线';
      case UserStatus.away:
        return '离开';
      case UserStatus.busy:
        return '忙碌';
      case UserStatus.dnd:
        return '请勿打扰';
      default:
        return '离线';
    }
  }

  Future<void> _handleAcceptRequest(String requestId) async {
    final success = await ref.read(friendListProvider.notifier).acceptFriendRequest(requestId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已添加好友')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('操作失败'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _handleRejectRequest(String requestId) async {
    final success = await ref.read(friendListProvider.notifier).rejectFriendRequest(requestId);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('已拒绝')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('操作失败'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _handleDeleteFriend(Friend friend) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除好友'),
        content: Text('确定要删除 ${friend.alias ?? friend.friend?.nickname ?? '该好友'} 吗？'),
        actions: [
          TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(onPressed: () => context.pop(true), child: const Text('删除', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref.read(friendListProvider.notifier).removeFriend(friend.friendId);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已删除好友')),
        );
      }
    }
  }

  Future<void> _handleBlockFriend(Friend friend) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认拉黑'),
        content: Text('确定要将 ${friend.alias ?? friend.friend?.nickname ?? '该好友'} 加入黑名单吗？'),
        actions: [
          TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(onPressed: () => context.pop(true), child: const Text('拉黑', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref.read(friendListProvider.notifier).blockUser(friend.friendId);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已加入黑名单')),
        );
      }
    }
  }

  Future<void> _startConversation(Friend friend) async {
    final conversation = await ref.read(conversationListProvider.notifier).createConversation([friend.friendId]);
    if (conversation != null && mounted) {
      ref.read(currentConversationProvider.notifier).state = conversation;
      ref.read(messagesProvider(conversation.id).notifier).loadMessages();
      context.go('/');
    }
  }
}
