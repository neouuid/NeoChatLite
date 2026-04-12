// 视频通话页面

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';

type VideoCallScreenRouteProp = {
  params: {
    conversationId: string;
    userId?: string;
  };
};

// Mock 通话对象
const mockRemoteUser = {
  id: 'user2',
  username: 'testuser',
  nickname: '张三',
  avatar: '',
  status: 'online',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VideoCallScreenRouteProp>();
  const { user: currentUser } = useAuthStore();
  const { conversationId, userId } = route.params;

  const [callState, setCallState] = useState<'calling' | 'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSwitchCamera, setIsSwitchCamera] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // 模拟连接
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 静音/取消静音
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // 开启/关闭视频
  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev);
  }, []);

  // 切换摄像头
  const switchCamera = useCallback(() => {
    setIsSwitchCamera((prev) => !prev);
  }, []);

  // 挂断通话
  const endCall = useCallback(() => {
    setCallState('ended');
    Alert.alert('通话已结束', '', [
      { text: '确定', onPress: () => navigation.goBack() },
    ]);
  }, [navigation]);

  const displayName = formatDisplayName(mockRemoteUser.nickname, mockRemoteUser.username);
  const currentUserDisplayName = currentUser
    ? formatDisplayName(currentUser.nickname, currentUser.username)
    : '我';

  // 获取通话状态文本
  const getStatusText = () => {
    switch (callState) {
      case 'connecting':
        return '连接中...';
      case 'calling':
        return '呼叫中...';
      case 'connected':
        return '通话中';
      case 'ended':
        return '通话已结束';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 远程视频区域 */}
      <View style={styles.remoteVideoContainer}>
        {isVideoEnabled ? (
          <View style={styles.remoteVideoPlaceholder}>
            <View style={styles.remoteAvatarContainer}>
              <Avatar
                uri={mockRemoteUser.avatar}
                nickname={displayName}
                size="xl"
              />
            </View>
          </View>
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <View style={styles.remoteAvatarContainer}>
              <Avatar
                uri={mockRemoteUser.avatar}
                nickname={displayName}
                size="xl"
              />
            </View>
          </View>
        )}

        {/* 通话信息叠加层 */}
        <View style={styles.infoOverlay}>
          <Text style={styles.remoteName}>{displayName}</Text>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
          {callState === 'connected' && (
            <Text style={styles.callTimer}>{formatDuration(callDuration)}</Text>
          )}
        </View>

        {/* 自己的小视频窗口 */}
        <View style={styles.selfVideoContainer}>
          <View style={styles.selfVideoPlaceholder}>
            <View style={styles.selfAvatarContainer}>
              <Avatar
                uri={currentUser?.avatar}
                nickname={currentUserDisplayName}
                size="md"
              />
            </View>
          </View>
        </View>
      </View>

      {/* 控制栏 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={isVideoEnabled ? 'videocam' : 'videocam-off'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hangupButton]}
          onPress={endCall}
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
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#2d2d44',
    position: 'relative',
  },
  remoteVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
