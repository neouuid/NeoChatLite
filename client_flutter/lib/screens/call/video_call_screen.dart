import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/data/models/chat.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/data/services/chat_service.dart';
import 'package:neochat/data/services/websocket_service.dart';
import 'package:neochat/widgets/common/common.dart';

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
    this.callId,
  });

  final String conversationId;
  final String userId;
  final User? remoteUser;
  final bool isIncoming;
  final String? callId;

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
  String? _callId;

  // WebRTC
  RTCPeerConnection? _peerConnection;
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  MediaStream? _localStream;

  @override
  void initState() {
    super.initState();
    _callId = widget.callId;
    _initRenderers();
    if (widget.isIncoming) {
      _callState = CallState.calling;
    } else {
      _startCall();
    }
    _listenToEvents();
  }

  Future<void> _initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  void _listenToEvents() {
    final wsService = ref.read(webSocketServiceProvider);
    wsService.eventStream.listen((event) {
      if (!mounted) return;
      final type = event['type'] as String?;
      final data = event['data'] as Map<String, dynamic>?;

      switch (type) {
        case 'call_accept':
          if (_callState == CallState.calling) {
            _onCallAccepted();
          }
          break;
        case 'call_reject':
          if (_callState == CallState.calling) {
            _onCallRejected();
          }
          break;
        case 'call_hangup':
          if (_callState == CallState.connected || _callState == CallState.connecting) {
            _onRemoteHangup();
          }
          break;
        case 'signal_offer':
          if (_callState == CallState.connecting) {
            _onOffer(data!);
          }
          break;
        case 'signal_answer':
          if (_callState == CallState.connecting) {
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
    setState(() => _callState = CallState.calling);

    try {
      final authState = ref.read(authStateProvider);
      final chatService = ref.read(chatServiceProvider);
      final wsService = ref.read(webSocketServiceProvider);

      // 1. Initiate call via API
      final response = await chatService.initiateCall(widget.userId, 'video');
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
        'video',
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
        setState(() => _callState = CallState.ended);
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) context.pop();
      }
    }
  }

  Future<void> _setupWebRTC(bool isAnswer) async {
    setState(() => _callState = CallState.connecting);

    try {
      final config = {
        'iceServers': [
          {
            'urls': 'stun:stun.l.google.com:19302',
          },
        ],
      };

      _peerConnection = await createPeerConnection(config);

      // Get user media
      final stream = await navigator.mediaDevices.getUserMedia({
        'video': true,
        'audio': true,
      });

      _localStream = stream;
      _localRenderer.srcObject = _localStream;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, stream);
      });

      // Listen for remote stream
      _peerConnection?.onTrack = (event) {
        _remoteRenderer.srcObject = event.streams[0];
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
      _callState = CallState.connected;
      _callStartTime = DateTime.now();
    });
    _startTimer();
  }

  void _onCallAccepted() async {
    setState(() => _callState = CallState.connecting);
  }

  void _onCallRejected() async {
    setState(() => _callState = CallState.ended);
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
    setState(() => _callState = CallState.ended);
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
    setState(() => _callState = CallState.ended);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) context.pop();
  }

  Future<void> _cleanup() async {
    _localStream?.getTracks().forEach((track) => track.stop());
    await _localStream?.dispose();
    await _peerConnection?.close();
    await _localRenderer.dispose();
    await _remoteRenderer.dispose();
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

  void _toggleVideo() {
    setState(() => _isVideoEnabled = !_isVideoEnabled);
    _localStream?.getVideoTracks().forEach((track) {
      track.enabled = _isVideoEnabled;
    });
  }

  void _toggleMic() {
    setState(() => _isMicEnabled = !_isMicEnabled);
    _localStream?.getAudioTracks().forEach((track) {
      track.enabled = _isMicEnabled;
    });
  }

  Future<void> _switchCamera() async {
    await Helper.switchCamera(_localStream!.getVideoTracks()[0]);
    setState(() => _isFrontCamera = !_isFrontCamera);
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
    final authState = ref.watch(authStateProvider);
    final remoteUser = widget.remoteUser;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Remote video (full screen)
          if (_callState == CallState.connected)
            SizedBox.expand(
              child: RTCVideoView(
                _remoteRenderer,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
              ),
            )
          else
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

          // Local video (small window)
          if (_isVideoEnabled && _callState == CallState.connected)
            Positioned(
              top: 40,
              right: 16,
              child: GestureDetector(
                onTap: _switchCamera,
                child: Container(
                  width: 120,
                  height: 160,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade900,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: RTCVideoView(
                    _localRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  ),
                ),
              ),
            ),

          // Call state info
          Positioned(
            top: 40,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Column(
                children: [
                  Text(
                    remoteUser?.nickname ?? 'User',
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

          // Call controls
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

          // Back button
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
        return widget.isIncoming ? 'Incoming video call...' : 'Calling...';
      case CallState.connecting:
        return 'Connecting...';
      case CallState.connected:
        return 'Video call in progress';
      case CallState.ended:
        return 'Call ended';
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
          onTap: _toggleVideo,
        ),
        _CallButton(
          icon: _isMicEnabled ? Icons.mic : Icons.mic_off,
          onTap: _toggleMic,
        ),
        _CallButton(
          icon: Icons.flip_camera_ios,
          onTap: _switchCamera,
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
