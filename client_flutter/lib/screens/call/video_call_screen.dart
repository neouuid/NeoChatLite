import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum CallState {
  calling,
  connecting,
  connected,
  ended,
}

class VideoCallScreen extends ConsumerStatefulWidget {
  const VideoCallScreen({
    super.key,
    required this.conversationId,
    required this.userId,
    this.remoteUser,
    this.isIncoming = false,
  });

  final String conversationId;
  final String userId;
  final User? remoteUser;
  final bool isIncoming;

  @override
  ConsumerState<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends ConsumerState<VideoCallScreen> {
  CallState _callState = CallState.calling;
  bool _isVideoEnabled = true;
  bool _isMicEnabled = true;
  bool _isFrontCamera = true;
  int _callDuration = 0;
  late DateTime _callStartTime;

  @override
  void initState() {
    super.initState();
    if (widget.isIncoming) {
      _callState = CallState.calling;
    } else {
      _startCall();
    }
  }

  Future<void> _startCall() async {
    setState(() => _callState = CallState.calling);

    // 模拟连接过程
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    setState(() => _callState = CallState.connecting);

    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    setState(() {
      _callState = CallState.connected;
      _callStartTime = DateTime.now();
    });

    _startTimer();
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || _callState != CallState.connected) {
        return false;
      }
      setState(() {
        _callDuration = DateTime.now().difference(_callStartTime).inSeconds;
      });
      return true;
    });
  }

  Future<void> _endCall() async {
    setState(() => _callState = CallState.ended);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) context.pop();
  }

  Future<void> _acceptCall() async {
    setState(() => _callState = CallState.connecting);

    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    setState(() {
      _callState = CallState.connected;
      _callStartTime = DateTime.now();
    });

    _startTimer();
  }

  Future<void> _declineCall() async {
    context.pop();
  }

  String _formatDuration(int seconds) {
    final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$minutes:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final currentUser = authState.user;
    final remoteUser = widget.remoteUser;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 远程视频（全屏）
          Container(
            color: Colors.black,
            child: Center(
              child: remoteUser != null
                  ? AppAvatar(
                      name: remoteUser.nickname,
                      size: AvatarSize.extraLarge,
                      avatarUrl: remoteUser.avatar,
                    )
                  : const Icon(
                      Icons.person_outline,
                      size: 120,
                      color: Colors.white30,
                    ),
            ),
          ),

          // 本地视频（小窗口）
          if (_isVideoEnabled && _callState == CallState.connected)
            Positioned(
              top: 40,
              right: 16,
              child: GestureDetector(
                onTap: () => setState(() => _isFrontCamera = !_isFrontCamera),
                child: Container(
                  width: 120,
                  height: 160,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade900,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: currentUser != null
                      ? AppAvatar(
                          name: currentUser.nickname,
                          size: AvatarSize.large,
                          avatarUrl: currentUser.avatar,
                        )
                      : const Icon(
                          Icons.person_outline,
                          size: 48,
                          color: Colors.white30,
                        ),
                ),
              ),
            ),

          // 通话状态信息
          Positioned(
            top: 40,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Column(
                children: [
                  Text(
                    remoteUser?.nickname ?? '用户',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getStatusText(),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                  if (_callState == CallState.connected)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        _formatDuration(_callDuration),
                        style: const TextStyle(
                          fontSize: 18,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // 通话控制按钮
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: _callState == CallState.calling && widget.isIncoming
                    ? _buildIncomingControls()
                    : _buildCallControls(),
              ),
            ),
          ),

          // 返回按钮
          if (_callState != CallState.connected)
            Positioned(
              top: 40,
              left: 8,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.pop(),
              ),
            ),
        ],
      ),
    );
  }

  String _getStatusText() {
    switch (_callState) {
      case CallState.calling:
        return widget.isIncoming ? '邀请你视频通话...' : '正在呼叫...';
      case CallState.connecting:
        return '连接中...';
      case CallState.connected:
        return '视频通话中';
      case CallState.ended:
        return '通话已结束';
    }
  }

  Widget _buildIncomingControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _CallButton(
          icon: Icons.call_end,
          onTap: _declineCall,
          backgroundColor: Colors.red,
        ),
        _CallButton(
          icon: Icons.call,
          onTap: _acceptCall,
          backgroundColor: Colors.green,
        ),
      ],
    );
  }

  Widget _buildCallControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _CallButton(
          icon: _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
          onTap: () => setState(() => _isVideoEnabled = !_isVideoEnabled),
        ),
        _CallButton(
          icon: _isMicEnabled ? Icons.mic : Icons.mic_off,
          onTap: () => setState(() => _isMicEnabled = !_isMicEnabled),
        ),
        _CallButton(
          icon: Icons.switch_camera,
          onTap: () => setState(() => _isFrontCamera = !_isFrontCamera),
        ),
        _CallButton(
          icon: Icons.call_end,
          onTap: _endCall,
          backgroundColor: Colors.red,
        ),
      ],
    );
  }
}

class _CallButton extends StatelessWidget {
  const _CallButton({
    required this.icon,
    required this.onTap,
    this.backgroundColor,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.white24,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}
