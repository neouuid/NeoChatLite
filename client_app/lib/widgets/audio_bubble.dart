import 'dart:async';

import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

/// 语音消息气泡：点击播放/暂停，带进度条与时长
class AudioBubble extends StatefulWidget {
  const AudioBubble({super.key, required this.url});

  final String url;

  @override
  State<AudioBubble> createState() => _AudioBubbleState();
}

class _AudioBubbleState extends State<AudioBubble> {
  final _player = AudioPlayer();
  StreamSubscription<PlayerState>? _stateSub;
  bool _ready = false;
  bool _playing = false;
  Duration? _duration;
  String? _error;

  @override
  void initState() {
    super.initState();
    _stateSub = _player.playerStateStream.listen((state) {
      if (!mounted) return;
      setState(() => _playing = state.playing);
    });
    _load();
  }

  Future<void> _load() async {
    try {
      final duration = await _player.setUrl(widget.url);
      if (!mounted) return;
      setState(() {
        _duration = duration;
        _ready = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    }
  }

  Future<void> _toggle() async {
    if (!_ready) return;
    if (_player.playing) {
      await _player.pause();
    } else {
      if (_player.processingState == ProcessingState.completed) {
        await _player.seek(Duration.zero);
      }
      await _player.play();
    }
  }

  static String _fmt(Duration? d) {
    if (d == null) return '--:--';
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _stateSub?.cancel();
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return const Text('[语音加载失败]');
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          iconSize: 20,
          visualDensity: VisualDensity.compact,
          onPressed: _ready ? _toggle : null,
          icon: Icon(_playing ? Icons.pause_circle : Icons.play_circle),
        ),
        Flexible(
          child: StreamBuilder<Duration>(
            stream: _player.positionStream,
            builder: (context, snapshot) {
              final position = snapshot.data ?? Duration.zero;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 140,
                    child: LinearProgressIndicator(
                      value: (_duration != null && _duration!.inMilliseconds > 0)
                          ? (position.inMilliseconds / _duration!.inMilliseconds)
                              .clamp(0.0, 1.0)
                          : 0,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_fmt(position)} / ${_fmt(_duration)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}
