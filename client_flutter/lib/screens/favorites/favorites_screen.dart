import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/data/models/favorite.dart';
import 'package:neochat/providers/favorites_provider.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(favoritesProvider.notifier).loadFavorites());
  }

  Future<void> _removeFavorite(String favoriteId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认取消收藏'),
        content: const Text('确定要取消收藏这条消息吗？'),
        actions: [
          TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
          TextButton(onPressed: () => context.pop(true), child: const Text('确定')),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ref.read(favoritesProvider.notifier).removeFavorite(favoriteId);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('已取消收藏')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('操作失败'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  void _openMessage(Favorite favorite) {
    final message = favorite.message;
    if (message == null) return;

    // Find or create conversation for this message
    ref.read(conversationListProvider.notifier).createConversation([message.senderId]).then((conversation) {
      if (conversation != null && mounted) {
        ref.read(currentConversationProvider.notifier).state = conversation;
        ref.read(messagesProvider(conversation.id).notifier).loadMessages();
        context.go('/');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final favoritesState = ref.watch(favoritesProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('收藏'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(favoritesProvider.notifier).loadFavorites(),
        child: _buildContent(isDark, favoritesState),
      ),
    );
  }

  Widget _buildContent(bool isDark, FavoritesState state) {
    if (state.isLoading && state.favorites.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              state.error!,
              style: TextStyle(color: AppColors.textSecondaryDark),
            ),
            const SizedBox(height: 16),
            AppButton(
              text: '重试',
              onPressed: () => ref.read(favoritesProvider.notifier).loadFavorites(),
            ),
          ],
        ),
      );
    }

    if (state.favorites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark_border_outlined,
              size: 64,
              color: AppColors.textSecondaryDark,
            ),
            const SizedBox(height: 16),
            Text(
              '暂无收藏',
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
      itemCount: state.favorites.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final favorite = state.favorites[index];
        return _buildFavoriteItem(isDark, favorite);
      },
    );
  }

  Widget _buildFavoriteItem(bool isDark, Favorite favorite) {
    final message = favorite.message;
    final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(favorite.createdAt);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                AppAvatar(
                  name: message?.sender?.nickname ?? '用户',
                  avatarUrl: message?.sender?.avatar,
                  size: AvatarSize.medium,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message?.sender?.nickname ?? '用户',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      Text(
                        dateStr,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondaryDark,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton(
                  onSelected: (value) {
                    if (value == 'remove') {
                      _removeFavorite(favorite.id);
                    } else if (value == 'open') {
                      _openMessage(favorite);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'open',
                      child: Row(
                        children: [
                          Icon(Icons.open_in_new_outlined, size: 18),
                          SizedBox(width: 12),
                          Text('查看上下文'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'remove',
                      child: Row(
                        children: [
                          const Icon(Icons.bookmark_remove_outlined, size: 18),
                          const SizedBox(width: 12),
                          Text('取消收藏', style: TextStyle(color: AppColors.error)),
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
                ),
              ],
            ),
          ),
          if (message != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: _buildMessageContent(isDark, message),
            ),
          if (favorite.note != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  favorite.note!,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMessageContent(bool isDark, Message message) {
    switch (message.type) {
      case MessageType.text:
        return Text(
          message.content ?? '',
          style: TextStyle(
            fontSize: 15,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        );
      case MessageType.image:
        return Container(
          constraints: const BoxConstraints(maxHeight: 200),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: message.mediaUrl != null
                ? Image.network(
                    message.mediaUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 120,
                      color: AppColors.inputBackgroundDark,
                      child: const Center(
                        child: Icon(Icons.broken_image_outlined, color: AppColors.textSecondaryDark),
                      ),
                    ),
                  )
                : Container(
                    height: 120,
                    color: AppColors.inputBackgroundDark,
                    child: const Center(
                      child: Icon(Icons.image_outlined, color: AppColors.textSecondaryDark),
                    ),
                  ),
          ),
        );
      case MessageType.file:
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(Icons.insert_drive_file_outlined, color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message.fileName ?? '文件',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ),
            ],
          ),
        );
      default:
        return Text(
          message.content ?? '',
          style: TextStyle(
            fontSize: 15,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        );
    }
  }
}
