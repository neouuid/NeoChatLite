import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from 'neochat-shared';
import { useWebRTC, CallType } from 'neochat-shared';

type RootStackParamList = {
  VideoCall: undefined;
  VoiceCall: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CallInviteModalProps {
  visible: boolean;
}

export const CallInviteModal: React.FC<CallInviteModalProps> = ({ visible }) => {
  const navigation = useNavigation<NavigationProp>();
  const { callState, acceptCall, rejectCall } = useWebRTC();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && callState.status === 'incoming') {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Vibrate
      Vibration.vibrate([0, 500, 500, 500], true);
    } else {
      // Stop animations
      scaleAnim.stopAnimation();
      opacityAnim.setValue(0);
      Vibration.cancel();
    }

    return () => {
      Vibration.cancel();
    };
  }, [visible, callState.status, scaleAnim, opacityAnim]);

  const handleAccept = async () => {
    try {
      await acceptCall();
      // Navigate to call screen
      if (callState.callType === 'video') {
        navigation.navigate('VideoCall');
      } else {
        navigation.navigate('VoiceCall');
      }
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    rejectCall();
  };

  const isIncoming = callState.status === 'incoming';
  const isCalling = callState.status === 'calling';

  if (!isIncoming && !isCalling) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
        <View style={styles.content}>
          {/* Avatar with pulse effect */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {callState.peerAvatar ? (
              <Avatar uri={callState.peerAvatar} size={120} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.placeholderText}>
                  {callState.peerName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Caller name */}
          <Text style={styles.name}>
            {callState.peerName || 'Unknown'}
          </Text>

          {/* Call type and status */}
          <Text style={styles.status}>
            {isIncoming
              ? `${callState.callType === 'video' ? '视频' : '语音'}通话邀请...`
              : `正在${callState.callType === 'video' ? '视频' : '语音'}呼叫...`}
          </Text>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            {isIncoming ? (
              <>
                {/* Reject button */}
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handleReject}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>❌</Text>
                </TouchableOpacity>

                {/* Accept button */}
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={handleAccept}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>📞</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Spacer */}
                <View style={styles.button} />

                {/* Cancel button */}
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handleReject}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>❌</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Button labels */}
          <View style={styles.buttonLabels}>
            {isIncoming ? (
              <>
                <Text style={styles.buttonLabel}>拒绝</Text>
                <Text style={styles.buttonLabel}>接听</Text>
              </>
            ) : (
              <>
                <View />
                <Text style={styles.buttonLabel}>取消</Text>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#A1A1AA',
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#22C55E',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  buttonIcon: {
    fontSize: 32,
  },
  buttonLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  buttonLabel: {
    width: 72,
    textAlign: 'center',
    fontSize: 14,
    color: '#A1A1AA',
  },
});

export default CallInviteModal;
