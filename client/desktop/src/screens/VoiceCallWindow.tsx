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
  formatDisplayName,
  useAuthStore,
  useChatStore,
  useWebRTC,
  Avatar,
} from '@neochat/shared';
import type { User } from '@neochat/shared/src/types';

interface VoiceCallWindowProps {
  remoteUser?: User;
}

export const VoiceCallWindow: React.FC<VoiceCallWindowProps> = ({
  remoteUser: propRemoteUser,
}) => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();

  const {
    callState,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  } = useWebRTC();

  const [callDuration, setCallDuration] = useState(0);

  // 从路由参数获取数据
  const {
    conversationId,
    userId,
    userName,
    userAvatar,
    incoming = false,
  } = route.params || {};

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
        setCallDuration(prev => prev + 1);
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
        'voice',
        formatDisplayName(remoteUser.nickname, remoteUser.username),
        remoteUser.avatar
      ).catch(error => {
        console.error('Failed to initiate call:', error);
        Alert.alert('错误', '发起通话失败');
        navigation.goBack();
      });
    }
  }, [incoming, remoteUser, callState.status, initiateCall, navigation]);

  // 格式化通话时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // 挂断电话
  const handleHangup = useCallback(() => {
    endCall();
  }, [endCall]);

  const displayName = remoteUser ? formatDisplayName(remoteUser.nickname, remoteUser.username) : '用户';

  return (
    <View style={styles.container}>
      {/* 主内容区 */}
      <View style={styles.content}>
        {/* 头像 */}
        <View style={styles.avatarContainer}>
          {remoteUser ? (
            <Avatar
              uri={remoteUser.avatar}
              nickname={displayName}
              size="3xl"
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.substring(0, 1)}</Text>
            </View>
          )}
        </View>

        {/* 姓名和状态 */}
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.status}>
          {callState.status === 'calling'
            ? '正在呼叫...'
            : callState.status === 'incoming'
            ? '邀请你通话...'
            : callState.status === 'connected'
            ? '通话中...'
            : '通话结束'}
        </Text>

        {/* 通话时长 */}
        {callState.status === 'connected' && (
          <Text style={styles.timer}>{formatDuration(callDuration)}</Text>
        )}

        {/* 控制按钮 */}
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
        ) : (
          <View style={styles.controls}>
            {/* 静音按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={callState.isMuted ? 'mic-off' : 'mic'}
                size={28}
                color="#ffffff"
              />
            </TouchableOpacity>

            {/* 键盘按钮 - 保留UI但暂不实现键盘 */}
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="keypad" size={28} color="#ffffff" />
            </TouchableOpacity>

            {/* 挂断按钮 */}
            <TouchableOpacity style={styles.hangupButton} onPress={handleHangup}>
              <Ionicons name="call" size={32} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* 扬声器按钮 */}
            <TouchableOpacity
              style={[styles.controlButton, callState.isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={callState.isSpeakerOn ? 'volume-high' : 'volume-medium'}
                size={28}
                color="#ffffff"
              />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 56,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  status: {
    color: '#a0a0c0',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    marginTop: -16,
  },
  timer: {
    color: '#ffffff',
    fontSize: 40,
    fontFamily: TYPOGRAPHY.fontFamily,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    width: '100%',
    paddingHorizontal: 40,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
    width: '100%',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#5b7cff',
  },
  hangupButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
