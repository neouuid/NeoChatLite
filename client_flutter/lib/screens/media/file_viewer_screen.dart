import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/widgets/common/common.dart';

class FileViewerScreen extends StatefulWidget {
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
  State<FileViewerScreen> createState() => _FileViewerScreenState();
}

class _FileViewerScreenState extends State<FileViewerScreen> {
  bool _isDownloading = false;
  double _downloadProgress = 0.0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: Text(widget.name),
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
                widget.name,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              if (widget.size != null) ...[
                const SizedBox(height: 8),
                Text(
                  _formatFileSize(widget.size!),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
              if (widget.sender != null) ...[
                const SizedBox(height: 8),
                Text(
                  '发送者: ${widget.sender}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
              if (widget.sendTime != null) ...[
                const SizedBox(height: 4),
                Text(
                  widget.sendTime!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
              if (_isDownloading) ...[
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Column(
                    children: [
                      LinearProgressIndicator(value: _downloadProgress),
                      const SizedBox(height: 8),
                      Text(
                        '下载中 ${(_downloadProgress * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondaryDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 32),
              AppButton(
                text: _isDownloading ? '下载中...' : '下载文件',
                onPressed: _isDownloading ? null : _downloadFile,
                type: AppButtonType.primary,
              ),
              const SizedBox(height: 12),
              AppButton(
                text: '分享',
                onPressed: _shareFile,
                type: AppButtonType.secondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getFileIcon() {
    if (widget.name.endsWith('.pdf')) return Icons.picture_as_pdf;
    if (widget.name.endsWith('.doc') || widget.name.endsWith('.docx')) return Icons.description;
    if (widget.name.endsWith('.xls') || widget.name.endsWith('.xlsx')) return Icons.table_chart;
    if (widget.name.endsWith('.ppt') || widget.name.endsWith('.pptx')) return Icons.slideshow;
    if (widget.name.endsWith('.zip') || widget.name.endsWith('.rar') || widget.name.endsWith('.7z')) {
      return Icons.folder_zip;
    }
    if (widget.name.endsWith('.mp3') || widget.name.endsWith('.wav') || widget.name.endsWith('.flac')) {
      return Icons.audiotrack;
    }
    if (widget.name.endsWith('.mp4') || widget.name.endsWith('.avi') || widget.name.endsWith('.mov')) {
      return Icons.videocam;
    }
    return Icons.insert_drive_file;
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _downloadFile() async {
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    // 模拟下载进度
    for (int i = 1; i <= 10; i++) {
      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted) return;
      setState(() => _downloadProgress = i / 10);
    }

    if (!mounted) return;
    setState(() => _isDownloading = false);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('文件下载功能待实现')),
    );
  }

  Future<void> _shareFile() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('文件分享功能待实现')),
    );
  }
}
