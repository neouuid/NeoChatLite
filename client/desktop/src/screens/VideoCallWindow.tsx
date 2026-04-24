// 桌面端音视频通话页面

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useAuthStore,
  useChatStore,
  useWebRTC,
  VideoView,
  Avatar,
} from 'neochat-shared';

import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User } from 'neochat-shared/src/types';

type CallType = 'video' | 'voice';

interface VideoCallWindowProps {
  callId?: string;
  callType?: CallType;
  remoteUser?: User;
}

export const VideoCallWindow: React.FC<VideoCallWindowProps> = ({
  callId: propCallId,
  callType: propCallType = 'video',
  remoteUser: propRemoteUser,
}) => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();

  // 从路由参数获取数据或使用props
  const {
    conversationId,
    userId,
    userName,
    userAvatar,
    incoming = false,
    callType: routeCallType,
  } = route.params || {};

  const {
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
  } = useWebRTC();

  const [callDuration, setCallDuration] = useState(0);

  // 确定使用的通话类型
  const callType = routeCallType || propCallType;

  // 获取通话对方用户信息
  const remoteUser = useMemo((): User | null => {
    // 优先使用props
    if (propRemoteUser) {
      return propRemoteUser;
    }
    // 如果路由参数直接提供了用户信息
    if (userId && userName) {
      return {
        id: userId,
        username: userName,
        nickname: userName,
        avatar: userAvatar,
        status: 'online',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    // 从会话中查找对方用户
    if (conversationId && currentUser) {
      const conversation = conversations.find(c => c.id === conversationId);
      const otherMember = conversation?.members?.find(m => m.user_id !== currentUser.id);
      if (otherMember?.user) {
        return otherMember.user;
      }
    }
    return null;
  }, [propRemoteUser, conversationId, conversations, currentUser, userId, userName, userAvatar]);

  // 计时器
  useEffect(() => {
    let timer: any;
    if (callState.status === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState.status === 'ended') {
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.status, navigation]);

  // 发起/接受通话
  useEffect(() => {
    if (incoming && callState.status === 'idle') {
      // 如果是来电但状态是idle，说明是从通知进入的，等待用户操作
    } else if (!incoming && remoteUser && callState.status === 'idle') {
      // 发起通话
      initiateCall(
        remoteUser.id,
        callType,
        formatDisplayName(remoteUser.nickname, remoteUser.username),
        remoteUser.avatar
      ).catch(error => {
        console.error('Failed to initiate call:', error);
        Alert.alert('错误', '发起通话失败');
        navigation.goBack();
      });
    }
  }, [incoming, remoteUser, callState.status, callType, initiateCall, navigation]);

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 接受来电
  const handleAcceptCall = useCallback(() => {
    acceptCall().catch(error => {
      console.error('Failed to accept call:', error);
      Alert.alert('错误', '接受通话失败');
    });
  }, [acceptCall]);

  // 拒绝来电
  const handleRejectCall = useCallback(() => {
    rejectCall();
    navigation.goBack();
  }, [rejectCall, navigation]);

  // 挂断通话
  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  const displayName = remoteUser
    ? formatDisplayName(remoteUser.nickname, remoteUser.username)
    : '用户';

  const currentUserDisplayName = currentUser
    ? formatDisplayName(currentUser.nickname, currentUser.username)
    : '用户';

  return (
    <View style={styles.container}>
      {/* 视频通话时的视频区域 */}
      {callType === 'video' && (
        <View style={styles.videoContainer}>
          {/* 远程视频视图 */}
          <View style={styles.remoteVideo}>
            {remoteStream && callState.isVideoEnabled !== false ? (
              <VideoView
                stream={remoteStream}
                style={styles.video}
                objectFit="cover"
              />
            ) : (
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
            )}
          </View>

          {/* 本地视频预览 */}
          <View style={styles.localVideo}>
            {localStream && callState.isVideoEnabled !== false ? (
              <VideoView
                stream={localStream}
                style={styles.video}
                mirror={true}
                objectFit="cover"
              />
            ) : (
              <View style={styles.localVideoPlaceholder}>
                <Ionicons name="person-outline" size={40} color="#8080a0" />
              </View>
            )}
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
          {callState.status === 'connected' && (
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
            {callState.status === 'calling'
              ? '正在呼叫...'
              : callState.status === 'incoming'
              ? '邀请你通话...'
              : callState.status === 'connected'
              ? formatDuration(callDuration)
              : '通话结束'}
          </Text>
        </View>
      </View>

      {/* 底部控制区域 */}
      <View style={styles.controls}>
        {callState.status === 'incoming' ? (
          /* 来电时的控制 */
          <View style={styles.incomingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.declineButton]}
              onPress={handleRejectCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.acceptButton]}
              onPress={handleAcceptCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : callState.status === 'connected' ? (
          /* 通话中的控制 */
          <View style={styles.callControls}>
            {/* 静音按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={callState.isMuted ? 'mic-off-outline' : 'mic-outline'}
                size={24}
                color={callState.isMuted ? '#6366f1' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* 视频通话时的视频开关 */}
            {callType === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, callState.isVideoEnabled === false && styles.controlButtonActive]}
                onPress={toggleVideo}
              >
                <Ionicons
                  name={callState.isVideoEnabled !== false ? 'videocam-outline' : 'videocam-off-outline'}
                  size={24}
                  color={callState.isVideoEnabled !== false ? '#ffffff' : '#6366f1'}
                />
              </TouchableOpacity>
            )}

            {/* 扬声器切换 */}
            <TouchableOpacity
              style={[styles.controlButton, callState.isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={callState.isSpeakerOn ? 'volume-high-outline' : 'volume-medium-outline'}
                size={24}
                color={callState.isSpeakerOn ? '#6366f1' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* 视频通话时的摄像头切换 */}
            {callType === 'video' && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={switchCamera}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* 结束通话按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        ) : (
          /* 呼叫中的控制 */
          <View style={styles.callingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call-outline" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
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
