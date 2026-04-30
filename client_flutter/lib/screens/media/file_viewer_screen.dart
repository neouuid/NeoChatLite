import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:permission_handler/permission_handler.dart';

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
  String? _localFilePath;

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
                text: _isDownloading ? '下载中...' : (_localFilePath != null ? '已下载' : '下载文件'),
                onPressed: _isDownloading || _localFilePath != null ? null : _downloadFile,
                type: AppButtonType.primary,
              ),
              const SizedBox(height: 12),
              AppButton(
                text: '分享',
                onPressed: _localFilePath != null ? _shareFile : null,
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
    try {
      setState(() {
        _isDownloading = true;
        _downloadProgress = 0.0;
      });

      if (Theme.of(context).platform == TargetPlatform.android || Theme.of(context).platform == TargetPlatform.iOS) {
        final status = await Permission.storage.request();
        if (!status.isGranted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('需要存储权限才能下载文件')),
            );
          }
          setState(() => _isDownloading = false);
          return;
        }
      }

      final request = http.Request('GET', Uri.parse(widget.url));
      final response = await http.Client().send(request);

      if (response.statusCode != 200) {
        throw Exception('下载失败: ${response.statusCode}');
      }

      final contentLength = response.contentLength ?? widget.size ?? 0;
      final List<int> bytes = [];
      int received = 0;

      response.stream.listen(
        (List<int> newBytes) {
          bytes.addAll(newBytes);
          received += newBytes.length;
          if (contentLength > 0 && mounted) {
            setState(() => _downloadProgress = received / contentLength);
          }
        },
        onDone: () async {
          if (!mounted) return;

          Directory? saveDir;
          if (Theme.of(context).platform == TargetPlatform.android) {
            saveDir = Directory('/storage/emulated/0/Download');
            if (!await saveDir.exists()) {
              saveDir = await getExternalStorageDirectory();
            }
          } else {
            saveDir = await getApplicationDocumentsDirectory();
          }

          if (saveDir == null) {
            throw Exception('无法获取存储目录');
          }

          final filePath = '${saveDir.path}/${widget.name}';
          final file = File(filePath);
          await file.writeAsBytes(bytes);

          if (mounted) {
            setState(() {
              _isDownloading = false;
              _localFilePath = filePath;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('文件已保存到 $filePath')),
            );
          }
        },
        onError: (error) {
          if (mounted) {
            setState(() => _isDownloading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('下载失败: $error'), backgroundColor: AppColors.error),
            );
          }
        },
        cancelOnError: true,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('下载失败: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _shareFile() async {
    if (_localFilePath == null) return;

    try {
      final file = File(_localFilePath!);
      if (!await file.exists()) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('文件不存在'), backgroundColor: AppColors.error),
          );
        }
        return;
      }

      await Share.shareXFiles([XFile(_localFilePath!)]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('分享失败: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}
