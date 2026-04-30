import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/widgets/chat/message_bubble.dart' as bubble;

class GroupChatScreen extends ConsumerStatefulWidget {
  const GroupChatScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<GroupChatScreen> createState() => _GroupChatScreenState();
}

class _GroupChatScreenState extends ConsumerState<GroupChatScreen> {
  final TextEditingController _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final conversationState = ref.watch(conversationListProvider);
    final conversation = conversationState.conversations.firstWhere(
      (c) => c.id == widget.conversationId,
      orElse: () => Conversation(
        id: widget.conversationId,
        type: ConversationType.group,
        name: '群聊',
        createdBy: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
    final messagesState = ref.watch(messagesProvider(widget.conversationId));

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildGroupHeader(isDark, conversation),
            Expanded(
              child: messagesState.isLoading && messagesState.messages.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : _buildMessageList(isDark, messagesState.messages),
            ),
            _buildInputArea(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupHeader(bool isDark, Conversation conversation) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 16),
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
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          AppAvatar(
            name: conversation.name ?? '群聊',
            size: AvatarSize.medium,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conversation.name ?? '群聊',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${conversation.members?.length ?? 0} 名成员',
                  style: const TextStyle(
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
            onPressed: () =>
                context.push(Uri(path: '/voice-call', queryParameters: {
              'conversationId': widget.conversationId,
            }).toString()),
          ),
          IconButton(
            icon: const Icon(Icons.videocam),
            color: AppColors.textSecondaryDark,
            onPressed: () =>
                context.push(Uri(path: '/video-call', queryParameters: {
              'conversationId': widget.conversationId,
            }).toString()),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            color: AppColors.textSecondaryDark,
            onPressed: () => context.push('/group-info/${conversation.id}'),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(bool isDark, List<Message> messages) {
    if (messages.isEmpty) {
      return const Center(
        child: Text(
          '暂无消息',
          style: TextStyle(
            color: AppColors.textSecondaryDark,
          ),
        ),
      );
    }

    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.user?.id;

    return ListView.separated(
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemBuilder: (context, index) {
        final message = messages[index];
        final isSent = message.senderId == currentUserId;
        String? senderName;
        if (!isSent && message.sender != null) {
          senderName = message.sender!.nickname;
        } else if (!isSent && message.sender == null) {
          senderName = '群成员';
        }

        final showHeader = index == messages.length - 1 ||
            messages[index + 1].senderId != message.senderId;

        return Column(
          crossAxisAlignment:
              isSent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isSent && showHeader) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 52),
                child: Text(
                  senderName ?? '群成员',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ),
            ],
            bubble.MessageBubble(
              isSent: isSent,
              type: message.type == MessageType.image
                  ? bubble.MessageType.image
                  : message.type == MessageType.file
                      ? bubble.MessageType.file
                      : bubble.MessageType.text,
              text: message.content,
              imageUrl: message.mediaUrl,
              fileName: message.fileName,
              fileSize: message.fileSize,
              time: DateFormat.Hm().format(message.createdAt),
              isRead: message.readCount != null && message.readCount! > 0,
              senderName: isSent ? null : senderName,
            ),
          ],
        );
      },
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemCount: messages.length,
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                icon: const Icon(Icons.people),
                color: AppColors.textSecondaryDark,
                onPressed: () {},
              ),
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
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.inputBackgroundDark
                        : AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: '输入消息...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 10),
                    ),
                    style: TextStyle(
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: Colors.white, size: 20),
                  onPressed: _sendMessage,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      final notifier =
          ref.read(messagesProvider(widget.conversationId).notifier);
      notifier.sendMessage(_messageController.text.trim());
      _messageController.clear();
    }
  }
}
