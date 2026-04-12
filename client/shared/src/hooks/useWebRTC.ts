import { useEffect, useState, useCallback, useRef } from 'react';
import { webrtc, CallState, CallType } from '../services/webrtc';

export function useWebRTC() {
  const [callState, setCallState] = useState<CallState>(webrtc.getState());
  const [localStream, setLocalStream] = useState<MediaStream | null>(webrtc.getLocalStream());
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(webrtc.getRemoteStream());
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const cleanupState = webrtc.onStateChange(setCallState);
    const cleanupLocal = webrtc.onLocalStream(setLocalStream);
    const cleanupRemote = webrtc.onRemoteStream(setRemoteStream);

    cleanupRef.current = [cleanupState, cleanupLocal, cleanupRemote];

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, []);

  const initiateCall = useCallback(async (peerId: string, callType: CallType, peerName?: string, peerAvatar?: string) => {
    await webrtc.initiateCall(peerId, callType, peerName, peerAvatar);
  }, []);

  const acceptCall = useCallback(async () => {
    await webrtc.acceptCall();
  }, []);

  const rejectCall = useCallback(() => {
    webrtc.rejectCall();
  }, []);

  const endCall = useCallback(() => {
    webrtc.endCall();
  }, []);

  const toggleMute = useCallback(() => {
    webrtc.toggleMute();
  }, []);

  const toggleVideo = useCallback(() => {
    webrtc.toggleVideo();
  }, []);

  const toggleSpeaker = useCallback(() => {
    webrtc.toggleSpeaker();
  }, []);

  const switchCamera = useCallback(() => {
    webrtc.switchCamera();
  }, []);

  return {
    callState,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
  };
}

export default useWebRTC;
