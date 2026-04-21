// 语音通话页面

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
  type User,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';

type VoiceCallScreenRouteProp = {
  params: {
    conversationId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    incoming?: boolean;
  };
};

export const VoiceCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VoiceCallScreenRouteProp>();
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
    endCall,
    toggleMute,
    toggleSpeaker,
    acceptCall,
    rejectCall,
  } = useWebRTC();

  const [callDuration, setCallDuration] = useState(0);

  // 获取通话对方用户信息
  const remoteUser = useMemo((): User | null => {
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
  }, [conversationId, conversations, currentUser, userId, userName, userAvatar]);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
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

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 挂断通话
  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  // 接受来电
  const handleAcceptCall = useCallback(() => {
    acceptCall();
  }, [acceptCall]);

  // 拒绝来电
  const handleRejectCall = useCallback(() => {
    rejectCall();
    navigation.goBack();
  }, [rejectCall, navigation]);

  // 获取通话状态文本
  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return '呼叫中...';
      case 'incoming':
        return '来电中...';
      case 'connected':
        return '通话中';
      case 'ended':
        return '通话已结束';
      default:
        return '连接中...';
    }
  };

  // 获取音频可视化波浪动画（基于通话状态）
  const renderAudioWave = () => {
    if (callState.status !== 'connected') return null;

    return (
      <View style={styles.waveContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: callState.isMuted ? 20 : 20 + Math.sin(Date.now() / 200 + i) * 20,
                opacity: callState.isMuted ? 0.3 : 0.7,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // 渲染来电界面
  if (callState.status === 'incoming') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.infoContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={remoteUser?.avatar}
              nickname={remoteUser?.nickname || remoteUser?.username || '用户'}
              size="xxl"
            />
          </View>

          <Text style={styles.remoteName}>
            {remoteUser?.nickname || remoteUser?.username || '用户'}
          </Text>
          <Text style={styles.callStatus}>来电中...</Text>
        </View>

        {/* 来电控制栏 */}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 通话信息区域 */}
      <View style={styles.infoContainer}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={remoteUser?.avatar}
            nickname={remoteUser?.nickname || remoteUser?.username || '用户'}
            size="xxl"
          />
        </View>

        <Text style={styles.remoteName}>
          {remoteUser?.nickname || remoteUser?.username || '用户'}
        </Text>
        <Text style={styles.callStatus}>{getStatusText()}</Text>

        {callState.status === 'connected' && (
          <Text style={styles.callTimer}>{formatDuration(callDuration)}</Text>
        )}

        {renderAudioWave()}
      </View>

      {/* 控制栏 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={callState.isMuted ? 'mic-off' : 'mic'}
            size={28}
            color="#ffffff"
          />
          <Text style={styles.controlButtonLabel}>
            {callState.isMuted ? '取消静音' : '静音'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, callState.isSpeakerOn && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Ionicons
            name={callState.isSpeakerOn ? 'volume-high' : 'volume-medium'}
            size={28}
            color="#ffffff"
          />
          <Text style={styles.controlButtonLabel}>
            {callState.isSpeakerOn ? '听筒' : '扬声器'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hangupButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={32} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
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
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.lg,
  },
  remoteName: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  callStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  callTimer: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: SPACING.md,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  waveBar: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING['3xl'],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    paddingBottom: SPACING['3xl'] + SPACING.md,
    backgroundColor: COLORS.dark.surface,
  },
  incomingControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING['4xl'],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    paddingBottom: SPACING['3xl'] + SPACING.md,
    backgroundColor: COLORS.dark.surface,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary,
  },
  controlButtonLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  hangupButton: {
    width: 72,
    height: 72,
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
