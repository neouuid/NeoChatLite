import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/providers/chat_provider.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/widgets/chat/message_bubble.dart' as bubble;

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  bool _isUploading = false;

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
        type: ConversationType.single,
        name: '聊天',
        createdBy: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
    final messagesState = ref.watch(messagesProvider(widget.conversationId));

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildChatHeader(isDark, conversation),
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

  Widget _buildChatHeader(bool isDark, Conversation conversation) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
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
            name: conversation.name ?? '聊天',
            size: AvatarSize.medium,
            avatarUrl: conversation.avatar,
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
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '在线',
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
            onPressed: () {
              context.push('/call/voice?id=${widget.conversationId}');
            },
          ),
          IconButton(
            icon: const Icon(Icons.videocam),
            color: AppColors.textSecondaryDark,
            onPressed: () {
              context.push('/call/video?id=${widget.conversationId}');
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            color: AppColors.textSecondaryDark,
            onPressed: () {
              if (widget.conversationId.startsWith('group-')) {
                final groupId = widget.conversationId.replaceFirst('group-', '');
                context.push('/group/$groupId');
              } else {
                context.push('/settings/chat/${widget.conversationId}');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList(bool isDark, List<Message> messages) {
    if (messages.isEmpty) {
      return Center(
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
          senderName = '对方';
        }

        bubble.MessageType bubbleType;
        switch (message.type) {
          case MessageType.image:
            bubbleType = bubble.MessageType.image;
            break;
          case MessageType.file:
            bubbleType = bubble.MessageType.file;
            break;
          default:
            bubbleType = bubble.MessageType.text;
            break;
        }

        return bubble.MessageBubble(
          isSent: isSent,
          type: bubbleType,
          text: message.content,
          imageUrl: message.mediaUrl,
          fileName: message.fileName,
          fileSize: message.fileSize,
          time: DateFormat.Hm().format(message.createdAt),
          isRead: message.readCount != null && message.readCount! > 0,
          senderName: senderName,
          senderAvatar: message.sender?.avatar,
          messageId: message.id,
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
            color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.emoji_emotions_outlined),
            color: AppColors.textSecondaryDark,
            onPressed: _showEmojiPicker,
          ),
          IconButton(
            icon: const Icon(Icons.image_outlined),
            color: AppColors.textSecondaryDark,
            onPressed: _isUploading ? null : _pickImage,
          ),
          IconButton(
            icon: const Icon(Icons.attach_file_outlined),
            color: AppColors.textSecondaryDark,
            onPressed: _isUploading ? null : _pickFile,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
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
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  fontSize: 15,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          if (_isUploading)
            Container(
              width: 44,
              height: 44,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(22),
              ),
              child: const CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          else
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
    );
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      final notifier = ref.read(messagesProvider(widget.conversationId).notifier);
      notifier.sendMessage(_messageController.text.trim());
      _messageController.clear();
    }
  }

  void _showEmojiPicker() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        height: 300,
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 8,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemBuilder: (context, index) {
            final emojis = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱'];
            if (index >= emojis.length) return null;
            return GestureDetector(
              onTap: () {
                _messageController.text += emojis[index];
                context.pop();
              },
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(emojis[index], style: const TextStyle(fontSize: 28)),
                ),
              ),
            );
          },
          itemCount: 64,
        ),
      ),
    );
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      await _uploadMedia(image, 'image');
    }
  }

  Future<void> _pickFile() async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      final file = XFile(result.files.single.path!);
      await _uploadMedia(file, 'file');
    }
  }

  Future<void> _uploadMedia(XFile file, String type) async {
    setState(() => _isUploading = true);
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.uploadFile(
        '/api/v1/upload',
        await MultipartFile.fromFile(file.path, filename: file.name),
        data: {'type': type},
      );

      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data as Map<String, dynamic>;
        final data = responseData['data'] as Map<String, dynamic>;
        final url = data['url'] as String;
        final fileName = data['file_name'] as String?;
        final fileSize = data['file_size'] as int?;

        final notifier = ref.read(messagesProvider(widget.conversationId).notifier);
        notifier.sendMediaMessage(
          type == 'image' ? MessageType.image : MessageType.file,
          url,
          fileName ?? file.name,
          fileSize,
        );
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('上传失败'), backgroundColor: AppColors.error),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('上传失败: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }
}
