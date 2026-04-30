import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum VoiceCallState {
  calling,
  connecting,
  connected,
  ended,
}

class VoiceCallScreen extends ConsumerStatefulWidget {
  const VoiceCallScreen({
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
  ConsumerState<VoiceCallScreen> createState() => _VoiceCallScreenState();
}

class _VoiceCallScreenState extends ConsumerState<VoiceCallScreen> {
  VoiceCallState _callState = VoiceCallState.calling;
  bool _isMicEnabled = true;
  bool _isSpeakerOn = true;
  int _callDuration = 0;
  late DateTime _callStartTime;

  @override
  void initState() {
    super.initState();
    if (widget.isIncoming) {
      _callState = VoiceCallState.calling;
    } else {
      _startCall();
    }
  }

  Future<void> _startCall() async {
    setState(() => _callState = VoiceCallState.calling);

    // 模拟连接过程
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    setState(() => _callState = VoiceCallState.connecting);

    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    setState(() {
      _callState = VoiceCallState.connected;
      _callStartTime = DateTime.now();
    });

    _startTimer();
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || _callState != VoiceCallState.connected) {
        return false;
      }
      setState(() {
        _callDuration = DateTime.now().difference(_callStartTime).inSeconds;
      });
      return true;
    });
  }

  Future<void> _endCall() async {
    setState(() => _callState = VoiceCallState.ended);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) context.pop();
  }

  Future<void> _acceptCall() async {
    setState(() => _callState = VoiceCallState.connecting);

    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    setState(() {
      _callState = VoiceCallState.connected;
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final remoteUser = widget.remoteUser;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            if (_callState != VoiceCallState.connected)
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
              ),
            const SizedBox(height: 40),
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: remoteUser != null
                  ? AppAvatar(
                      name: remoteUser.nickname,
                      size: AvatarSize.large,
                      avatarUrl: remoteUser.avatar,
                    )
                  : const Icon(
                      Icons.person_outline,
                      size: 64,
                      color: AppColors.primary,
                    ),
            ),
            const SizedBox(height: 24),
            Text(
              remoteUser?.nickname ?? '用户',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getStatusText(),
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textSecondaryDark,
              ),
            ),
            if (_callState == VoiceCallState.connected)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _formatDuration(_callDuration),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ),
            const Expanded(child: SizedBox()),
            Padding(
              padding: const EdgeInsets.all(32),
              child: _callState == VoiceCallState.calling && widget.isIncoming
                  ? _buildIncomingControls()
                  : _buildCallControls(isDark),
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusText() {
    switch (_callState) {
      case VoiceCallState.calling:
        return widget.isIncoming ? '邀请你语音通话...' : '正在呼叫...';
      case VoiceCallState.connecting:
        return '连接中...';
      case VoiceCallState.connected:
        return '语音通话中';
      case VoiceCallState.ended:
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

  Widget _buildCallControls(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _CallButton(
          icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_off,
          onTap: () => setState(() => _isSpeakerOn = !_isSpeakerOn),
          isDark: isDark,
        ),
        _CallButton(
          icon: _isMicEnabled ? Icons.mic : Icons.mic_off,
          onTap: () => setState(() => _isMicEnabled = !_isMicEnabled),
          isDark: isDark,
        ),
        _CallButton(
          icon: Icons.call_end,
          onTap: _endCall,
          backgroundColor: Colors.red,
          isDark: isDark,
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
    this.isDark = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color? backgroundColor;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: backgroundColor ?? (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: backgroundColor != null
              ? Colors.white
              : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
          size: 28,
        ),
      ),
    );
  }
}
