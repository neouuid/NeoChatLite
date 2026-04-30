import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:photo_view/photo_view.dart';

class ImageViewerScreen extends StatelessWidget {
  const ImageViewerScreen({super.key, required this.url, this.messageId});

  final String url;
  final String? messageId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: () => _saveImage(context),
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareImage(context),
          ),
        ],
      ),
      body: PhotoView(
        imageProvider: CachedNetworkImageProvider(url),
        backgroundDecoration: const BoxDecoration(color: Colors.black),
        heroAttributes: PhotoViewHeroAttributes(tag: messageId ?? 'image-view'),
      ),
    );
  }

  Future<void> _saveImage(BuildContext context) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('图片保存功能待实现')),
    );
  }

  Future<void> _shareImage(BuildContext context) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('图片分享功能待实现')),
    );
  }
}
