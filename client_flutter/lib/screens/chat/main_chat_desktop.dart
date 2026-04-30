import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/widgets/chat/conversation_item.dart';
import 'package:neochat/widgets/chat/message_bubble.dart' as bubble;
import 'package:neochat/widgets/common/common.dart';

class MainChatDesktop extends ConsumerStatefulWidget {
  const MainChatDesktop({super.key});

  @override
  ConsumerState<MainChatDesktop> createState() => _MainChatDesktopState();
}

class _MainChatDesktopState extends ConsumerState<MainChatDesktop> {
  int _selectedNavIndex = 0;
  String? _selectedConversationId;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final chatState = ref.watch(conversationListProvider);
    final selectedConversation = ref.watch(currentConversationProvider);
    final messagesState = _selectedConversationId != null
        ? ref.watch(messagesProvider(_selectedConversationId!))
        : null;

    return Scaffold(
      body: Row(
        children: [
          _buildIconSidebar(isDark),
          _buildConversationSidebar(
              isDark, chatState, selectedConversation?.id),
          Expanded(
            child: _selectedConversationId != null &&
                    selectedConversation != null
                ? _buildChatArea(isDark, selectedConversation, messagesState)
                : _buildEmptyState(isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildIconSidebar(bool isDark) {
    return Container(
      width: 72,
      color: isDark ? const Color(0xFF131324) : const Color(0xFFF0F2F5),
      child: Column(
        children: [
          const SizedBox(height: 24),
          _buildNavIcon(Icons.chat_bubble_outline, 0, 'Chat'),
          const SizedBox(height: 16),
          _buildNavIcon(Icons.people_outline, 1, 'Contacts'),
          const SizedBox(height: 16),
          _buildNavIcon(Icons.bookmark_border, 2, 'Favorites'),
          const SizedBox(height: 16),
          _buildNavIcon(Icons.call_outlined, 3, 'Calls'),
          const Expanded(child: SizedBox()),
          _buildNavIcon(Icons.settings_outlined, 4, 'Settings'),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, int index, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSelected = _selectedNavIndex == index;

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: isSelected
            ? (isDark
                ? AppColors.primary
                : AppColors.primary.withValues(alpha: 0.1))
            : Colors.transparent,
        borderRadius: BorderRadius.circular(16),
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: isSelected
              ? Colors.white
              : (isDark ? Colors.white60 : Colors.black54),
        ),
        onPressed: () {
          setState(() => _selectedNavIndex = index);
          if (index == 1) {
            context.push('/friends');
          } else if (index == 2) {
            context.push('/favorites');
          } else if (index == 4) {
            context.push('/settings');
          }
        },
        tooltip: label,
      ),
    );
  }

  Widget _buildConversationSidebar(
      bool isDark, ConversationListState chatState, String? selectedId) {
    return Container(
      width: 320,
      color: isDark ? const Color(0xFF1a1a2e) : Colors.white,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search conversations',
                      prefixIcon: Icon(Icons.search,
                          color: isDark ? Colors.white54 : Colors.black54),
                      filled: true,
                      fillColor: isDark
                          ? AppColors.inputBackgroundDark
                          : const Color(0xFFF0F2F5),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    onTap: () => context.push('/search'),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                final conversation = chatState.conversations[index];
                final isSelected = conversation.id == _selectedConversationId;

                return ConversationItem(
                  name: conversation.name ?? 'Chat',
                  avatar: conversation.avatar,
                  lastMessage: conversation.lastMessage,
                  time: conversation.lastMsgAt != null
                      ? _formatTime(conversation.lastMsgAt!)
                      : null,
                  isSelected: isSelected,
                  hasUnread: conversation.unreadCount != null &&
                      conversation.unreadCount! > 0,
                  unreadCount: conversation.unreadCount,
                  onTap: () {
                    setState(() => _selectedConversationId = conversation.id);
                    ref.read(currentConversationProvider.notifier).state =
                        conversation;
                  },
                );
              },
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemCount: chatState.conversations.length,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 80,
              color: isDark ? Colors.white24 : Colors.black12,
            ),
            const SizedBox(height: 24),
            Text(
              'Select a conversation',
              style: TextStyle(
                fontSize: 20,
                color: isDark ? Colors.white60 : Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatArea(
      bool isDark, Conversation conversation, MessagesState? messagesState) {
    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.user?.id;

    return Container(
      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      child: Column(
        children: [
          _buildChatHeader(isDark, conversation),
          Expanded(
            child: messagesState == null
                ? const Center(child: CircularProgressIndicator())
                : messagesState.isLoading && messagesState.messages.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.separated(
                        reverse: true,
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 16),
                        itemBuilder: (context, index) {
                          final message = messagesState.messages[index];
                          final isSent = message.senderId == currentUserId;
                          final messageType = _convertMessageType(message.type);

                          return bubble.MessageBubble(
                            isSent: isSent,
                            type: messageType,
                            text: message.content,
                            imageUrl: message.mediaUrl,
                            fileName: message.fileName,
                            fileSize: message.fileSize,
                            time: _formatTime(message.createdAt),
                            isRead: message.readCount != null &&
                                message.readCount! > 0,
                            senderName: message.sender?.nickname,
                            senderAvatar: message.sender?.avatar,
                          );
                        },
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 16),
                        itemCount: messagesState.messages.length,
                      ),
          ),
          _buildInputArea(isDark),
        ],
      ),
    );
  }

  Widget _buildChatHeader(bool isDark, Conversation conversation) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? AppColors.inputBackgroundDark
                : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          AppAvatar(
            name: conversation.name,
            avatarUrl: conversation.avatar,
            size: AvatarSize.medium,
            backgroundColor: AppColors.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conversation.name ?? 'Chat',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Online',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.phone),
            color: AppColors.textSecondaryDark,
            onPressed: () => context.push('/voice-call'),
          ),
          IconButton(
            icon: const Icon(Icons.videocam),
            color: AppColors.textSecondaryDark,
            onPressed: () => context.push('/video-call'),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            color: AppColors.textSecondaryDark,
            onPressed: () {
              if (_selectedConversationId != null) {
                context.push('/chat-settings/$_selectedConversationId');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          top: BorderSide(
            color: isDark
                ? AppColors.inputBackgroundDark
                : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.emoji_emotions_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.image_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.attach_file_outlined),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.inputBackgroundDark
                        : AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    style: TextStyle(
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                      fontSize: 15,
                    ),
                    maxLines: null,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: Colors.white, size: 20),
                  onPressed: () {
                    if (_messageController.text.trim().isNotEmpty &&
                        _selectedConversationId != null) {
                      ref
                          .read(messagesProvider(_selectedConversationId!)
                              .notifier)
                          .sendMessage(_messageController.text.trim());
                      _messageController.clear();
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  bubble.MessageType _convertMessageType(MessageType type) {
    switch (type) {
      case MessageType.image:
        return bubble.MessageType.image;
      case MessageType.file:
        return bubble.MessageType.file;
      default:
        return bubble.MessageType.text;
    }
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
