import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// 视频消息气泡：内嵌播放器，点击播放/暂停
class VideoBubble extends StatefulWidget {
  const VideoBubble({super.key, required this.url});

  final String url;

  @override
  State<VideoBubble> createState() => _VideoBubbleState();
}

class _VideoBubbleState extends State<VideoBubble> {
  VideoPlayerController? _controller;
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      await controller.setLooping(false);
      setState(() {
        _controller = controller;
        _ready = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    }
  }

  void _toggle() {
    final controller = _controller;
    if (controller == null) return;
    if (controller.value.isPlaying) {
      controller.pause();
    } else {
      controller.play();
    }
    setState(() {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return const Text('[视频加载失败]');
    }
    if (!_ready || _controller == null) {
      return const SizedBox(
        width: 180,
        height: 100,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    final controller = _controller!;
    return GestureDetector(
      onTap: _toggle,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 200,
              child: AspectRatio(
                aspectRatio: controller.value.aspectRatio == 0
                    ? 16 / 9
                    : controller.value.aspectRatio,
                child: VideoPlayer(controller),
              ),
            ),
            if (!controller.value.isPlaying)
              const CircleAvatar(
                radius: 20,
                backgroundColor: Colors.black54,
                child: Icon(Icons.play_arrow, color: Colors.white),
              ),
          ],
        ),
      ),
    );
  }
}
