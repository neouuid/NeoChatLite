// 桌面端音视频通话页面

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';
import type { User } from '@neochat/shared/src/types';

type CallState = 'calling' | 'incoming' | 'connected' | 'ended';
type CallType = 'video' | 'voice';

interface VideoCallWindowProps {
  callId?: string;
  callType: CallType;
  callState: CallState;
  remoteUser?: User;
  onEnd?: () => void;
  onAccept?: () => void;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  onToggleSpeaker?: () => void;
  onSwitchCamera?: () => void;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isSpeakerEnabled?: boolean;
  callDuration?: string;
}

export const VideoCallWindow: React.FC<VideoCallWindowProps> = ({
  callId,
  callType = 'video',
  callState = 'calling',
  remoteUser,
  onEnd,
  onAccept,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onSwitchCamera,
  isMuted = false,
  isVideoEnabled = true,
  isSpeakerEnabled = false,
  callDuration = '00:00',
}) => {
  const displayName = remoteUser ? formatDisplayName(remoteUser.nickname, remoteUser.username) : '用户';

  // 结束通话
  const handleEndCall = useCallback(() => {
    onEnd?.();
  }, [onEnd]);

  // 接受通话
  const handleAcceptCall = useCallback(() => {
    onAccept?.();
  }, [onAccept]);

  return (
    <View style={styles.container}>
      {/* 视频通话时的视频区域 */}
      {callType === 'video' && (
        <View style={styles.videoContainer}>
          {/* 远程视频视图 */}
          <View style={styles.remoteVideo}>
            {!isVideoEnabled ? (
              <View style={styles.videoPlaceholder}>
                {remoteUser && (
                  <Avatar
                    uri={remoteUser.avatar}
                    nickname={displayName}
                    size="2xl"
                    style={styles.avatarLarge}
                  />
                )}
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>视频预览</Text>
              </View>
            )}
          </View>

          {/* 本地视频预览 */}
          <View style={styles.localVideo}>
            <View style={styles.localVideoPlaceholder}>
              <Ionicons name="person-outline" size={40} color="#8080a0" />
            </View>
          </View>
        </View>
      )}

      {/* 语音通话时的视图 */}
      {callType === 'voice' && (
        <View style={styles.voiceContainer}>
          <View style={styles.voiceAvatarContainer}>
            {remoteUser ? (
              <Avatar
                uri={remoteUser.avatar}
                nickname={displayName}
                size="3xl"
                style={styles.voiceAvatar}
              />
            ) : (
              <View style={styles.voiceAvatarPlaceholder}>
                <Ionicons name="person-outline" size={80} color="#8080a0" />
              </View>
            )}
          </View>

          {/* 音频波动动画 */}
          {callState === 'connected' && (
            <View style={styles.audioWaveContainer}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[styles.audioWave, styles[`wave${i + 1}` as keyof typeof styles]]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 顶部信息区域 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.callStatus}>
            {callState === 'calling'
              ? '正在呼叫...'
              : callState === 'incoming'
              ? '邀请你通话...'
              : callState === 'connected'
              ? callDuration
              : '通话结束'}
          </Text>
        </View>
      </View>

      {/* 底部控制区域 */}
      <View style={styles.controls}>
        {callState === 'incoming' ? (
          /* 来电时的控制 */
          <View style={styles.incomingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.declineButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.acceptButton]}
              onPress={handleAcceptCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : callState === 'connected' ? (
          /* 通话中的控制 */
          <View style={styles.callControls}>
            {/* 静音按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={onToggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off-outline' : 'mic-outline'}
                size={24}
                color={isMuted ? '#6366f1' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* 视频通话时的视频开关 */}
            {callType === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                onPress={onToggleVideo}
              >
                <Ionicons
                  name={isVideoEnabled ? 'videocam-outline' : 'videocam-off-outline'}
                  size={24}
                  color={isVideoEnabled ? '#ffffff' : '#6366f1'}
                />
              </TouchableOpacity>
            )}

            {/* 扬声器切换 */}
            <TouchableOpacity
              style={[styles.controlButton, isSpeakerEnabled && styles.controlButtonActive]}
              onPress={onToggleSpeaker}
            >
              <Ionicons
                name={isSpeakerEnabled ? 'volume-high-outline' : 'volume-medium-outline'}
                size={24}
                color={isSpeakerEnabled ? '#6366f1' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* 视频通话时的摄像头切换 */}
            {callType === 'video' && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={onSwitchCamera}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* 结束通话按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          /* 呼叫中的控制 */
          <View style={styles.callingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  videoPlaceholderText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  localVideo: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 150,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#2d2d44',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceAvatarContainer: {
    marginBottom: 40,
  },
  voiceAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  voiceAvatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 60,
  },
  audioWave: {
    width: 6,
    backgroundColor: '#5b7cff',
    borderRadius: 3,
  },
  wave1: {
    height: 20,
  },
  wave2: {
    height: 35,
  },
  wave3: {
    height: 50,
  },
  wave4: {
    height: 35,
  },
  wave5: {
    height: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 8,
  },
  callStatus: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    alignItems: 'center',
  },
  callingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ffffff',
  },
  acceptButton: {
    backgroundColor: '#34c759',
  },
  declineButton: {
    backgroundColor: COLORS.error,
    transform: [{ rotate: '135deg' }],
  },
  endButton: {
    backgroundColor: COLORS.error,
    transform: [{ rotate: '135deg' }],
  },
});
