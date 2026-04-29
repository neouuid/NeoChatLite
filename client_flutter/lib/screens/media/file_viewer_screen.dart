import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/widgets/common/common.dart';

class FileViewerScreen extends StatelessWidget {
  const FileViewerScreen({
    super.key,
    required this.url,
    required this.name,
    this.size,
    this.type,
    this.sendTime,
    this.sender,
  });

  final String url;
  final String name;
  final int? size;
  final String? type;
  final String? sendTime;
  final String? sender;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: Text(name),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  _getFileIcon(),
                  size: 48,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                name,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              if (size != null) ...[
                const SizedBox(height: 8),
                Text(
                  _formatFileSize(size!),
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
              const SizedBox(height: 32),
              AppButton(
                text: '下载文件',
                onPressed: () {},
                type: AppButtonType.primary,
              ),
              const SizedBox(height: 12),
              AppButton(
                text: '分享',
                onPressed: () {},
                type: AppButtonType.secondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getFileIcon() {
    if (name.endsWith('.pdf')) return Icons.picture_as_pdf;
    if (name.endsWith('.doc') || name.endsWith('.docx')) return Icons.description;
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return Icons.table_chart;
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return Icons.slideshow;
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return Icons.folder_zip;
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')) return Icons.audiotrack;
    if (name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.mov')) return Icons.videocam;
    return Icons.insert_drive_file;
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
