// 语音通话页面

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

type VoiceCallScreenRouteProp = {
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

export const VoiceCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VoiceCallScreenRouteProp>();
  const { user: currentUser } = useAuthStore();
  const { conversationId, userId } = route.params;

  const [callState, setCallState] = useState<'calling' | 'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
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

  // 切换扬声器
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // 挂断通话
  const endCall = useCallback(() => {
    setCallState('ended');
    Alert.alert('通话已结束', '', [
      { text: '确定', onPress: () => navigation.goBack() },
    ]);
  }, [navigation]);

  const displayName = formatDisplayName(mockRemoteUser.nickname, mockRemoteUser.username);

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

  // 获取音频可视化波浪动画
  const renderAudioWave = () => {
    if (callState !== 'connected') return null;

    return (
      <View style={styles.waveContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: 20 + Math.random() * 40,
                opacity: 0.5 + Math.random() * 0.5,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 通话信息区域 */}
      <View style={styles.infoContainer}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={mockRemoteUser.avatar}
            nickname={displayName}
            size="xxl"
          />
        </View>

        <Text style={styles.remoteName}>{displayName}</Text>
        <Text style={styles.callStatus}>{getStatusText()}</Text>

        {callState === 'connected' && (
          <Text style={styles.callTimer}>{formatDuration(callDuration)}</Text>
        )}

        {renderAudioWave()}
      </View>

      {/* 控制栏 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={28}
            color="#ffffff"
          />
          <Text style={styles.controlButtonLabel}>
            {isMuted ? '取消静音' : '静音'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Ionicons
            name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
            size={28}
            color="#ffffff"
          />
          <Text style={styles.controlButtonLabel}>
            {isSpeakerOn ? '听筒' : '扬声器'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hangupButton]}
          onPress={endCall}
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
});
