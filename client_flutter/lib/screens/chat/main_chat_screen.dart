import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/widgets/chat/conversation_item.dart';
import 'package:neochat/widgets/chat/message_bubble.dart' as bubble;
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/screens/chat/main_chat_desktop.dart';
import 'package:neochat/layouts/responsive_layout.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/data/models/chat.dart';

class MainChatScreen extends ConsumerStatefulWidget {
  const MainChatScreen({super.key});

  @override
  ConsumerState<MainChatScreen> createState() => _MainChatScreenState();
}

class _MainChatScreenState extends ConsumerState<MainChatScreen> {
  int _selectedNavIndex = 0;
  final TextEditingController _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveLayout(
      mobileLayout: _buildMobileLayout(),
      desktopLayout: const MainChatDesktop(),
    );
  }

  Widget _buildMobileLayout() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authStateProvider);
    final chatState = ref.watch(conversationListProvider);
    final selectedConversation = ref.watch(currentConversationProvider);

    if (!authState.isAuthenticated) {
      Future.microtask(() {
        if (mounted) {
          context.go('/login');
        }
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  AppAvatar(
                    name: authState.user?.nickname ?? '我',
                    avatarUrl: authState.user?.avatar,
                    size: AvatarSize.medium,
                    backgroundColor: AppColors.warning,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      '消息',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings),
                    onPressed: () => context.go('/settings'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: selectedConversation == null
                  ? _buildConversationList(isDark, chatState, authState)
                  : _buildChatArea(isDark, selectedConversation, authState),
            ),
            if (selectedConversation == null) _buildBottomNavBar(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationList(
      bool isDark, ConversationListState chatState, AuthState authState) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => context.go('/search'),
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.inputBackgroundDark
                    : AppColors.backgroundLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                children: [
                  Icon(Icons.search,
                      color: AppColors.textSecondaryDark, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '搜索联系人...',
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
          const SizedBox(height: 16),
          if (chatState.isLoading)
            const Expanded(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (chatState.conversations.isEmpty)
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 64,
                      color: AppColors.textSecondaryDark,
                    ),
                    SizedBox(height: 16),
                    Text(
                      '还没有会话',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppColors.textSecondaryDark,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                padding: EdgeInsets.zero,
                itemBuilder: (context, index) {
                  final conversation = chatState.conversations[index];
                  final isSelected = conversation.id ==
                      ref.read(currentConversationProvider)?.id;
                  return ConversationItem(
                    name: conversation.name ?? '聊天',
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
                      ref.read(currentConversationProvider.notifier).state =
                          conversation;
                      ref
                          .read(messagesProvider(conversation.id).notifier)
                          .loadMessages();
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

  Widget _buildChatArea(
      bool isDark, Conversation conversation, AuthState authState) {
    final messagesState = ref.watch(messagesProvider(conversation.id));

    return Container(
      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      child: Column(
        children: [
          _buildChatHeader(isDark, conversation),
          Expanded(
            child: messagesState.isLoading && messagesState.messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : messagesState.messages.isEmpty
                    ? const Center(
                        child: Text(
                          '开始聊天吧',
                          style: TextStyle(color: AppColors.textSecondaryDark),
                        ),
                      )
                    : ListView.separated(
                        reverse: true,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 16),
                        itemBuilder: (context, index) {
                          final message = messagesState.messages[index];
                          final isSent = message.senderId == authState.user?.id;
                          final messageType = _convertMessageType(message.type);
                          String? senderName;
                          String? senderAvatar;
                          if (!isSent) {
                            senderName = message.sender?.nickname;
                            senderAvatar = message.sender?.avatar;
                          }
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
                            senderName: senderName,
                            senderAvatar: senderAvatar,
                          );
                        },
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 16),
                        itemCount: messagesState.messages.length,
                      ),
          ),
          _buildInputArea(isDark, conversation),
        ],
      ),
    );
  }

  Widget _buildChatHeader(bool isDark, Conversation conversation) {
    return Container(
      height: 72,
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
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                ref.read(currentConversationProvider.notifier).state = null;
              },
            ),
          ),
          AppAvatar(
            name: conversation.name,
            avatarUrl: conversation.avatar,
            size: AvatarSize.medium,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conversation.name ?? '聊天',
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
                  '在线',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
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
            onPressed: () => context.push('/chat-settings/${conversation.id}'),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isDark, Conversation conversation) {
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
              IconButton(
                icon: const Icon(Icons.sticky_note_2_outlined),
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
                      hintText: '输入消息...',
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
                    if (_messageController.text.trim().isNotEmpty) {
                      ref
                          .read(messagesProvider(conversation.id).notifier)
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

  Widget _buildBottomNavBar(bool isDark) {
    return Container(
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildBottomNavItem(Icons.message, '聊天', 0, isDark),
          _buildBottomNavItem(Icons.group, '群组', 1, isDark),
          _buildBottomNavItem(Icons.person_add, '好友', 2, isDark),
        ],
      ),
    );
  }

  Widget _buildBottomNavItem(
      IconData icon, String label, int index, bool isDark) {
    final isSelected = _selectedNavIndex == index;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedNavIndex = index;
        });
        if (index == 2) {
          context.go('/friends');
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? AppColors.primary : AppColors.textSecondaryDark,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color:
                  isSelected ? AppColors.primary : AppColors.textSecondaryDark,
            ),
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
