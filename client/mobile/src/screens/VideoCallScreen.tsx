// 视频通话页面

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  type User,
} from 'neochat-shared';

import { formatDisplayName } from 'neochat-shared/src/utils';

type VideoCallScreenRouteProp = {
  params: {
    conversationId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    incoming?: boolean;
  };
};

export const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VideoCallScreenRouteProp>();
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();
  const {
    conversationId,
    userId,
    userName,
    userAvatar,
    incoming = false,
  } = route.params;

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
    switchCamera,
  } = useWebRTC();

  const [callDuration, setCallDuration] = useState(0);

  // 获取通话对方用户信息
  const remoteUser = useMemo((): User | null => {
    // 如果路由参数直接提供了用户信�?
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
  }, [conversationId, conversations, currentUser, userId, userName, userAvatar]);

  // 计时�?
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
    if (incoming && callState.status === 'incoming') {
      // 已经有来电，等待用户接受
    } else if (!incoming && remoteUser && callState.status === 'idle') {
      // 发起通话
      initiateCall(
        remoteUser.id,
        'video',
        remoteUser.nickname || remoteUser.username,
        remoteUser.avatar
      ).catch(error => {
        console.error('Failed to initiate call:', error);
        Alert.alert('错误', '发起通话失败');
        navigation.goBack();
      });
    }
  }, [incoming, remoteUser, callState.status, initiateCall, navigation]);

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
    : '�?;

  // 获取通话状态文�?
  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return '呼叫�?..';
      case 'incoming':
        return '来电�?..';
      case 'connected':
        return '通话�?;
      case 'ended':
        return '通话已结�?;
      default:
        return '连接�?..';
    }
  };

  // 渲染来电界面
  if (callState.status === 'incoming') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.incomingContainer}>
          <View style={styles.incomingAvatarContainer}>
            <Avatar
              uri={remoteUser?.avatar}
              nickname={displayName}
              size="2xl"
            />
          </View>

          <Text style={styles.remoteName}>{displayName}</Text>
          <Text style={styles.callStatus}>来电�?..</Text>

          {/* 来电控制�?*/}
          <View style={styles.incomingControlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, styles.rejectButton]}
              onPress={handleRejectCall}
            >
              <Ionicons name="close" size={32} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.acceptButton]}
              onPress={handleAcceptCall}
            >
              <Ionicons name="call" size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 远程视频区域 */}
      <View style={styles.remoteVideoContainer}>
        {/* 远程视频�?*/}
        {remoteStream ? (
          <VideoView
            stream={remoteStream}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <View style={styles.remoteAvatarContainer}>
              <Avatar
                uri={remoteUser?.avatar}
                nickname={displayName}
                size="xl"
              />
            </View>
          </View>
        )}

        {/* 通话信息叠加�?*/}
        <View style={styles.infoOverlay}>
          <Text style={styles.remoteName}>{displayName}</Text>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
          {callState.status === 'connected' && (
            <Text style={styles.callTimer}>{formatDuration(callDuration)}</Text>
          )}
        </View>

        {/* 自己的小视频窗口 */}
        <View style={styles.selfVideoContainer}>
          {localStream && callState.isVideoEnabled !== false ? (
            <VideoView
              stream={localStream}
              style={styles.selfVideo}
              mirror={true}
              objectFit="cover"
            />
          ) : (
            <View style={styles.selfVideoPlaceholder}>
              <View style={styles.selfAvatarContainer}>
                <Avatar
                  uri={currentUser?.avatar}
                  nickname={currentUserDisplayName}
                  size="md"
                />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 控制�?*/}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={callState.isMuted ? 'mic-off' : 'mic'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !callState.isVideoEnabled && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={callState.isVideoEnabled !== false ? 'videocam' : 'videocam-off'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hangupButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
  },
  incomingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  incomingAvatarContainer: {
    marginBottom: SPACING.lg,
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2d44',
  },
  remoteAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    top: SPACING.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  remoteName: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  callStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  callTimer: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: SPACING.md,
  },
  selfVideoContainer: {
    position: 'absolute',
    bottom: SPACING.xl + 100,
    right: SPACING.lg,
    width: 100,
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  selfVideo: {
    width: '100%',
    height: '100%',
  },
  selfVideoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xl + SPACING.md,
    backgroundColor: COLORS.dark.surface,
  },
  incomingControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xl + SPACING.md,
    backgroundColor: COLORS.dark.surface,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary,
  },
  hangupButton: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.error,
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.success || '#22c55e',
  },
  rejectButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.error,
  },
});
