import { websocket } from './websocket';

// WebRTC configuration
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export type CallType = 'video' | 'voice';
export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export interface CallState {
  status: CallStatus;
  callType: CallType | null;
  callId: string | null;
  peerId: string | null;
  peerName: string | null;
  peerAvatar: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
}

type CallStateChangeListener = (state: CallState) => void;
type RemoteStreamChangeListener = (stream: MediaStream | null) => void;
type LocalStreamChangeListener = (stream: MediaStream | null) => void;

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private state: CallState = {
    status: 'idle',
    callType: null,
    callId: null,
    peerId: null,
    peerName: null,
    peerAvatar: null,
    isMuted: false,
    isVideoEnabled: true,
    isSpeakerOn: false,
  };

  private stateChangeListeners: Set<CallStateChangeListener> = new Set();
  private remoteStreamListeners: Set<RemoteStreamChangeListener> = new Set();
  private localStreamListeners: Set<LocalStreamChangeListener> = new Set();

  constructor() {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // Handle incoming call invite
    websocket.on('call_invite', (data: any, fromId: string) => {
      if (this.state.status !== 'idle') {
        // Already in a call, reject incoming
        websocket.sendCallReject(fromId);
        return;
      }
      this.updateState({
        status: 'incoming',
        callType: data.call_type || 'video',
        peerId: fromId,
        peerName: data.caller_name,
        peerAvatar: data.caller_avatar,
      });
    });

    // Handle call accept
    websocket.on('call_accept', (data: any, fromId: string) => {
      if (this.state.status === 'calling' && this.state.peerId === fromId) {
        this.updateState({ status: 'connected' });
      }
    });

    // Handle call reject
    websocket.on('call_reject', (data: any, fromId: string) => {
      if (this.state.status === 'calling' && this.state.peerId === fromId) {
        this.endCall();
      }
    });

    // Handle call hangup
    websocket.on('call_hangup', (data: any, fromId: string) => {
      if (this.state.peerId === fromId) {
        this.endCall();
      }
    });

    // Handle WebRTC signaling
    websocket.on('signal_offer', async (data: any, fromId: string) => {
      if (this.state.peerId !== fromId) return;
      await this.handleOffer(data.sdp);
    });

    websocket.on('signal_answer', async (data: any, fromId: string) => {
      if (this.state.peerId !== fromId) return;
      await this.handleAnswer(data.sdp);
    });

    websocket.on('signal_ice', async (data: any, fromId: string) => {
      if (this.state.peerId !== fromId) return;
      await this.handleIceCandidate(data);
    });
  }

  private updateState(newState: Partial<CallState>) {
    this.state = { ...this.state, ...newState };
    this.stateChangeListeners.forEach((listener) => listener(this.state));
  }

  private notifyRemoteStream() {
    this.remoteStreamListeners.forEach((listener) => listener(this.remoteStream));
  }

  private notifyLocalStream() {
    this.localStreamListeners.forEach((listener) => listener(this.localStream));
  }

  async initiateCall(peerId: string, callType: CallType, peerName?: string, peerAvatar?: string): Promise<void> {
    if (this.state.status !== 'idle') {
      throw new Error('Already in a call');
    }

    this.updateState({
      status: 'calling',
      callType,
      peerId,
      peerName,
      peerAvatar,
    });

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      this.notifyLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send invite first
      websocket.sendCallInvite(peerId, callType);

      // Wait for ICE candidates to be gathered, then send offer
      // For now, send offer immediately
      websocket.sendSignalOffer(peerId, offer.sdp!);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      this.endCall();
      throw error;
    }
  }

  async acceptCall(): Promise<void> {
    if (this.state.status !== 'incoming') {
      throw new Error('No incoming call');
    }

    this.updateState({ status: 'connected' });
    websocket.sendCallAccept(this.state.peerId!);

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.state.callType === 'video',
      });
      this.notifyLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.endCall();
      throw error;
    }
  }

  rejectCall(): void {
    if (this.state.status !== 'incoming') {
      return;
    }
    websocket.sendCallReject(this.state.peerId!);
    this.endCall();
  }

  endCall(): void {
    if (this.state.status === 'idle') {
      return;
    }

    // Notify peer
    if (this.state.peerId && this.state.status !== 'incoming') {
      websocket.sendCallHangup(this.state.peerId);
    }

    // Clean up
    this.cleanup();

    // Reset state
    this.updateState({
      status: 'idle',
      callType: null,
      callId: null,
      peerId: null,
      peerName: null,
      peerAvatar: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: false,
    });
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(ICE_CONFIG);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.state.peerId) {
        websocket.sendSignalIce(
          this.state.peerId,
          event.candidate.candidate,
          event.candidate.sdpMid,
          event.candidate.sdpMlineIndex
        );
      }
    };

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.notifyRemoteStream();
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed' ||
          this.peerConnection?.connectionState === 'closed') {
        this.endCall();
      }
    };
  }

  private async handleOffer(sdp: string): Promise<void> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    websocket.sendSignalAnswer(this.state.peerId!, answer.sdp!);
  }

  private async handleAnswer(sdp: string): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
  }

  private async handleIceCandidate(data: any): Promise<void> {
    if (!this.peerConnection) return;
    const candidate = new RTCIceCandidate({
      candidate: data.candidate,
      sdpMid: data.sdp_mid,
      sdpMlineIndex: data.sdp_mline_index,
    });
    await this.peerConnection.addIceCandidate(candidate);
  }

  private cleanup(): void {
    // Stop local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      this.notifyLocalStream();
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;
    this.notifyRemoteStream();
  }

  toggleMute(): void {
    if (!this.localStream) return;
    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    this.updateState({ isMuted: !this.state.isMuted });
  }

  toggleVideo(): void {
    if (!this.localStream || this.state.callType !== 'video') return;
    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    this.updateState({ isVideoEnabled: !this.state.isVideoEnabled });
  }

  toggleSpeaker(): void {
    // Toggle speaker on/off (platform specific)
    this.updateState({ isSpeakerOn: !this.state.isSpeakerOn });
  }

  switchCamera(): void {
    // Switch camera (platform specific)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.log('Switch camera not available in this environment');
      return;
    }

    if (!this.localStream) {
      console.log('No local stream available');
      return;
    }

    // Web implementation - switch camera by getting new media with facingMode
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.log('No video track to switch');
      return;
    }

    // Get current facing mode if available
    const currentSettings = videoTracks[0].getSettings();
    const currentFacing = currentSettings.facingMode;

    // Toggle between user and environment
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    // Recreate stream with new facing mode
    this.recreateLocalStreamWithFacing(newFacing);
  }

  private async recreateLocalStreamWithFacing(facingMode: 'user' | 'environment'): Promise<void> {
    if (!this.localStream) return;

    try {
      // Stop current tracks
      this.localStream.getTracks().forEach((track) => track.stop());

      // Get new stream with requested facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode },
      });

      // Update local stream
      this.localStream = newStream;
      this.notifyLocalStream();

      // Replace tracks in peer connection if active
      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders();
        newStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            this.peerConnection?.addTrack(track, newStream);
          }
        });
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }

  // State subscription
  onStateChange(listener: CallStateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  onRemoteStream(listener: RemoteStreamChangeListener): () => void {
    this.remoteStreamListeners.add(listener);
    return () => this.remoteStreamListeners.delete(listener);
  }

  onLocalStream(listener: LocalStreamChangeListener): () => void {
    this.localStreamListeners.add(listener);
    return () => this.localStreamListeners.delete(listener);
  }

  getState(): CallState {
    return this.state;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

// Export singleton instance
export const webrtc = new WebRTCService();
export default webrtc;
