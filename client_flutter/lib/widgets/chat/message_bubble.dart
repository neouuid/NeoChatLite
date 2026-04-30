import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/core/theme/app_theme.dart';

enum MessageType { text, image, file, audio }

class MessageBubble extends StatelessWidget {
  final bool isSent;
  final MessageType type;
  final String? text;
  final String? imageUrl;
  final String? fileName;
  final int? fileSize;
  final String time;
  final bool isRead;
  final String? senderName;
  final String? senderAvatar;
  final String? messageId;

  const MessageBubble({
    super.key,
    required this.isSent,
    this.type = MessageType.text,
    this.text,
    this.imageUrl,
    this.fileName,
    this.fileSize,
    required this.time,
    this.isRead = false,
    this.senderName,
    this.senderAvatar,
    this.messageId,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Align(
      alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!isSent && senderAvatar != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: AppAvatar(
                avatarUrl: senderAvatar,
                name: senderName,
                size: AvatarSize.small,
              ),
            ),
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.6,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSent
                    ? AppColors.primary
                    : (isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isSent ? const Radius.circular(16) : Radius.zero,
                  bottomRight: isSent ? Radius.zero : const Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildMessageContent(context, isDark),
                  const SizedBox(height: 4),
                  _buildTimeAndStatus(isDark),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context, bool isDark) {
    switch (type) {
      case MessageType.text:
        return Text(
          text ?? '',
          style: TextStyle(
            fontSize: 15,
            height: 1.5,
            color: isSent
                ? Colors.white
                : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
          ),
        );
      case MessageType.image:
        return GestureDetector(
          onTap: imageUrl != null
              ? () {
                  context.push('/media/image?url=${Uri.encodeComponent(imageUrl!)}${messageId != null ? '&id=${Uri.encodeComponent(messageId!)}' : ''}');
                }
              : null,
          child: Container(
            width: 240,
            height: 180,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
            ),
            child: imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(imageUrl!, fit: BoxFit.cover),
                  )
                : const Center(
                    child: Icon(Icons.image, size: 48, color: AppColors.textSecondaryDark),
                  ),
          ),
        );
      case MessageType.file:
        return GestureDetector(
          onTap: imageUrl != null
              ? () {
                  context.push('/media/file?url=${Uri.encodeComponent(imageUrl!)}&name=${Uri.encodeComponent(fileName ?? 'file')}${fileSize != null ? '&size=$fileSize' : ''}');
                }
              : null,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: isSent ? Colors.white.withValues(alpha: 0.15) : AppColors.inputBackgroundDark,
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: isSent ? Colors.white.withValues(alpha: 0.25) : AppColors.backgroundLight,
                  ),
                  child: Icon(
                    Icons.insert_drive_file,
                    color: isSent ? Colors.white : AppColors.textSecondaryDark,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fileName ?? '文件',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: isSent
                              ? Colors.white
                              : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (fileSize != null)
                        Text(
                          _formatFileSize(fileSize!),
                          style: TextStyle(
                            fontSize: 12,
                            color: isSent ? Colors.white.withValues(alpha: 0.7) : AppColors.textSecondaryDark,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      case MessageType.audio:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSent ? Icons.pause : Icons.play_arrow,
              color: isSent ? Colors.white : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
              size: 28,
            ),
            const SizedBox(width: 12),
            Container(
              height: 4,
              width: 150,
              decoration: BoxDecoration(
                color: isSent ? Colors.white.withValues(alpha: 0.3) : AppColors.textSecondaryDark,
                borderRadius: BorderRadius.circular(2),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: 0.3,
                child: Container(
                  decoration: BoxDecoration(
                    color: isSent ? Colors.white : AppColors.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ],
        );
    }
  }

  Widget _buildTimeAndStatus(bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          time,
          style: TextStyle(
            fontSize: 12,
            color: isSent ? Colors.white.withValues(alpha: 0.7) : AppColors.textSecondaryDark,
          ),
        ),
        if (isSent) ...[
          const SizedBox(width: 4),
          Icon(
            isRead ? Icons.done_all : Icons.done,
            size: 16,
            color: isRead ? Colors.white : Colors.white.withValues(alpha: 0.7),
          ),
        ],
      ],
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
