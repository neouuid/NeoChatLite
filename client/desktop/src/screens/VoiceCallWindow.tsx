import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  formatDisplayName,
} from '@neochat/shared';

interface VoiceCallWindowProps {
  onBack?: () => void;
  participantName?: string;
  participantAvatar?: string;
}

export const VoiceCallWindow: React.FC<VoiceCallWindowProps> = ({
  onBack,
  participantName = '张三',
  participantAvatar,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnSpeaker, setIsOnSpeaker] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化通话时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 挂断电话
  const handleHangup = () => {
    Alert.alert(
      '挂断通话',
      '确定要结束通话吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '挂断',
          style: 'destructive',
          onPress: () => {
            onBack?.();
          },
        },
      ]
    );
  };

  // 切换静音
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 切换扬声器
  const toggleSpeaker = () => {
    setIsOnSpeaker(!isOnSpeaker);
  };

  // 打开/关闭键盘
  const toggleKeypad = () => {
    setIsKeypadOpen(!isKeypadOpen);
  };

  const initials = formatDisplayName(participantName).substring(0, 1);

  return (
    <View style={styles.container}>
      {/* 主内容区 */}
      <View style={styles.content}>
        {/* 头像 */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* 姓名和状态 */}
        <Text style={styles.name}>{participantName}</Text>
        <Text style={styles.status}>通话中...</Text>

        {/* 通话时长 */}
        <Text style={styles.timer}>{formatDuration(callDuration)}</Text>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          {/* 静音按钮 */}
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* 键盘按钮 */}
          <TouchableOpacity
            style={[styles.controlButton, isKeypadOpen && styles.controlButtonActive]}
            onPress={toggleKeypad}
          >
            <Ionicons name="keypad" size={28} color="#ffffff" />
          </TouchableOpacity>

          {/* 挂断按钮 */}
          <TouchableOpacity style={styles.hangupButton} onPress={handleHangup}>
            <Ionicons name="call" size={32} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {/* 扬声器按钮 */}
          <TouchableOpacity
            style={[styles.controlButton, isOnSpeaker && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isOnSpeaker ? 'volume-high' : 'volume-medium'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
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
});
