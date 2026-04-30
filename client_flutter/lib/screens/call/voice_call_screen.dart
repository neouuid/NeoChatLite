import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/data/services/chat_service.dart';
import 'package:neochat/widgets/common/common.dart';

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
    this.callId,
  });

  final String conversationId;
  final String userId;
  final User? remoteUser;
  final bool isIncoming;
  final String? callId;

  @override
  ConsumerState<VoiceCallScreen> createState() => _VoiceCallScreenState();
}

class _VoiceCallScreenState extends ConsumerState<VoiceCallScreen> {
  VoiceCallState _callState = VoiceCallState.calling;
  bool _isMicEnabled = true;
  bool _isSpeakerOn = true;
  int _callDuration = 0;
  late DateTime _callStartTime;
  String? _callId;

  // WebRTC
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;

  @override
  void initState() {
    super.initState();
    _callId = widget.callId;
    if (widget.isIncoming) {
      _callState = VoiceCallState.calling;
    } else {
      _startCall();
    }
    _listenToEvents();
  }

  void _listenToEvents() {
    final wsService = ref.read(webSocketServiceProvider);
    wsService.eventStream.listen((event) {
      if (!mounted) return;
      final type = event['type'] as String?;
      final data = event['data'] as Map<String, dynamic>?;

      switch (type) {
        case 'call_accept':
          if (_callState == VoiceCallState.calling) {
            _onCallAccepted();
          }
          break;
        case 'call_reject':
          if (_callState == VoiceCallState.calling) {
            _onCallRejected();
          }
          break;
        case 'call_hangup':
          if (_callState == VoiceCallState.connected || _callState == VoiceCallState.connecting) {
            _onRemoteHangup();
          }
          break;
        case 'signal_offer':
          if (_callState == VoiceCallState.connecting) {
            _onOffer(data!);
          }
          break;
        case 'signal_answer':
          if (_callState == VoiceCallState.connecting) {
            _onAnswer(data!);
          }
          break;
        case 'signal_ice':
          _onIceCandidate(data!);
          break;
      }
    });
  }

  Future<void> _startCall() async {
    setState(() => _callState = VoiceCallState.calling);

    try {
      final authState = ref.read(authStateProvider);
      final chatService = ref.read(chatServiceProvider);
      final wsService = ref.read(webSocketServiceProvider);

      // 1. Initiate call via API
      final response = await chatService.initiateCall(widget.userId, 'voice');
      if (!response.success || response.data == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to initiate call: ${response.message}')),
          );
        }
        return;
      }

      final callRecord = response.data!;
      _callId = callRecord.id;

      // 2. Send call invite via WebSocket
      wsService.sendCallInvite(
        widget.userId,
        _callId!,
        'voice',
        authState.user?.nickname ?? 'User',
        authState.user?.avatar ?? '',
      );

      // 3. Start WebRTC setup
      await _setupWebRTC(false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Call failed: $e')),
        );
        setState(() => _callState = VoiceCallState.ended);
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) context.pop();
      }
    }
  }

  Future<void> _setupWebRTC(bool isAnswer) async {
    setState(() => _callState = VoiceCallState.connecting);

    try {
      final config = {
        'iceServers': [
          {
            'urls': 'stun:stun.l.google.com:19302',
          },
        ],
      };

      _peerConnection = await createPeerConnection(config);

      // Get user media (audio only)
      final stream = await navigator.mediaDevices.getUserMedia({
        'video': false,
        'audio': true,
      });

      _localStream = stream;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, stream);
      });

      // Listen for remote stream
      _peerConnection?.onTrack = (event) {
        // Play remote audio
        event.streams[0].getAudioTracks().forEach((track) {
          track.enabled = true;
        });
      };

      // Listen for ICE candidates
      _peerConnection?.onIceCandidate = (candidate) {
        if (candidate.candidate != null && candidate.candidate!.isNotEmpty) {
          final wsService = ref.read(webSocketServiceProvider);
          wsService.sendSignalIceCandidate(
            widget.userId,
            _callId!,
            candidate.candidate!,
            candidate.sdpMid!,
            candidate.sdpMLineIndex!,
          );
        }
      };

      // Listen for ICE connection state
      _peerConnection?.onIceConnectionState = (state) {
        if (state == RTCIceConnectionState.RTCIceConnectionStateConnected) {
          _onConnected();
        }
      };

      if (!isAnswer) {
        // Create offer
        final offer = await _peerConnection!.createOffer();
        await _peerConnection!.setLocalDescription(offer);

        // Send offer
        final wsService = ref.read(webSocketServiceProvider);
        wsService.sendSignalOffer(
          widget.userId,
          _callId!,
          offer.sdp!,
        );
      }
    } catch (e) {
      print('WebRTC setup failed: $e');
    }
  }

  Future<void> _onOffer(Map<String, dynamic> data) async {
    await _setupWebRTC(true);

    final payload = data['payload'] as Map<String, dynamic>;
    final sdp = payload['sdp'] as String;

    final remoteDescription = RTCSessionDescription(sdp, 'offer');
    await _peerConnection!.setRemoteDescription(remoteDescription);

    // Create answer
    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);

    // Send answer
    final wsService = ref.read(webSocketServiceProvider);
    wsService.sendSignalAnswer(
      widget.userId,
      _callId!,
      answer.sdp!,
    );
  }

  Future<void> _onAnswer(Map<String, dynamic> data) async {
    final payload = data['payload'] as Map<String, dynamic>;
    final sdp = payload['sdp'] as String;

    final remoteDescription = RTCSessionDescription(sdp, 'answer');
    await _peerConnection!.setRemoteDescription(remoteDescription);
  }

  Future<void> _onIceCandidate(Map<String, dynamic> data) async {
    final payload = data['payload'] as Map<String, dynamic>;
    final candidate = RTCIceCandidate(
      payload['candidate'],
      payload['sdpMid'],
      payload['sdpMLineIndex'],
    );

    await _peerConnection!.addCandidate(candidate);
  }

  void _onConnected() {
    setState(() {
      _callState = VoiceCallState.connected;
      _callStartTime = DateTime.now();
    });
    _startTimer();
  }

  void _onCallAccepted() async {
    setState(() => _callState = VoiceCallState.connecting);
  }

  void _onCallRejected() async {
    setState(() => _callState = VoiceCallState.ended);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Call rejected')),
      );
    }
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) context.pop();
  }

  void _onRemoteHangup() async {
    await _cleanup();
    setState(() => _callState = VoiceCallState.ended);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) context.pop();
  }

  Future<void> _acceptCall() async {
    if (_callId != null) {
      final wsService = ref.read(webSocketServiceProvider);
      wsService.sendCallAccept(widget.userId, _callId!);

      final chatService = ref.read(chatServiceProvider);
      await chatService.acceptCall(_callId!);
    }

    await _setupWebRTC(true);
  }

  Future<void> _declineCall() async {
    if (_callId != null) {
      final wsService = ref.read(webSocketServiceProvider);
      wsService.sendCallReject(widget.userId, _callId!);

      final chatService = ref.read(chatServiceProvider);
      await chatService.rejectCall(_callId!);
    }
    context.pop();
  }

  Future<void> _endCall() async {
    if (_callId != null) {
      final wsService = ref.read(webSocketServiceProvider);
      wsService.sendCallHangup(widget.userId, _callId!);

      final chatService = ref.read(chatServiceProvider);
      try {
        await chatService.endCall(_callId!);
      } catch (e) {
        // Ignore, call might already be ended
      }
    }

    await _cleanup();
    setState(() => _callState = VoiceCallState.ended);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) context.pop();
  }

  Future<void> _cleanup() async {
    _localStream?.getTracks().forEach((track) => track.stop());
    await _localStream?.dispose();
    await _peerConnection?.close();
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

  void _toggleMic() {
    setState(() => _isMicEnabled = !_isMicEnabled);
    _localStream?.getAudioTracks().forEach((track) {
      track.enabled = _isMicEnabled;
    });
  }

  void _toggleSpeaker() async {
    setState(() => _isSpeakerOn = !_isSpeakerOn);
    await Helper.setSpeakerphoneOn(_isSpeakerOn);
  }

  String _formatDuration(int seconds) {
    final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$minutes:$secs';
  }

  @override
  void dispose() {
    _cleanup();
    super.dispose();
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
                  : Icon(
                      Icons.person_outline,
                      size: 64,
                      color: AppColors.primary,
                    ),
            ),
            const SizedBox(height: 24),
            Text(
              remoteUser?.nickname ?? 'User',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getStatusText(),
              style: TextStyle(
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
                  ? _buildIncomingControls(isDark)
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
        return widget.isIncoming ? 'Incoming voice call...' : 'Calling...';
      case VoiceCallState.connecting:
        return 'Connecting...';
      case VoiceCallState.connected:
        return 'Voice call in progress';
      case VoiceCallState.ended:
        return 'Call ended';
    }
  }

  Widget _buildIncomingControls(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _CallButton(
          icon: Icons.call_end,
          onTap: _declineCall,
          backgroundColor: Colors.red,
          isDark: isDark,
        ),
        _CallButton(
          icon: Icons.call,
          onTap: _acceptCall,
          backgroundColor: Colors.green,
          isDark: isDark,
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
          onTap: _toggleSpeaker,
          isDark: isDark,
        ),
        _CallButton(
          icon: _isMicEnabled ? Icons.mic : Icons.mic_off,
          onTap: _toggleMic,
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
