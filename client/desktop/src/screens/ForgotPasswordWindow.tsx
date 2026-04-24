// 桌面端忘记密码窗口

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Input,
  Button,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  authService,
} from 'neochat-shared';

interface ForgotPasswordWindowProps {
  onSwitchToLogin?: () => void;
}

type Step = 'identify' | 'verify' | 'reset';

export const ForgotPasswordWindow: React.FC<ForgotPasswordWindowProps> = ({
  onSwitchToLogin,
}) => {
  const [step, setStep] = useState<Step>('identify');
  const [isLoading, setIsLoading] = useState(false);

  // 第一步：输入账号
  const [identifier, setIdentifier] = useState('');

  // 第二步：输入验证码
  const [verifyCode, setVerifyCode] = useState('');
  const [resetToken, setResetToken] = useState<string>('');
  const [countdown, setCountdown] = useState(0);

  // 第三步：设置新密码
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 发送验证码
  const handleSendCode = async () => {
    if (!identifier.trim()) {
      Alert.alert('提示', '请输入手机号或邮箱');
      return;
    }

    setIsLoading(true);
    try {
      const token = await authService.requestPasswordReset(identifier);
      setResetToken(token);
      Alert.alert('成功', '验证码已发送');
      setStep('verify');
      startCountdown();
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    setIsLoading(true);
    try {
      if (resetToken && verifyCode !== resetToken) {
        throw new Error('验证码不正确');
      }
      Alert.alert('成功', '验证成功');
      setStep('reset');
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '验证失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('提示', '请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '密码至少需要6个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码输入不一致');
      return;
    }

    setIsLoading(true);
    try {
      const tokenToUse = verifyCode || resetToken;
      await authService.resetPassword(tokenToUse, newPassword);
      Alert.alert('成功', '密码重置成功，请使用新密码登录', [
        { text: '确定', onPress: onSwitchToLogin },
      ]);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '重置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (step === 'identify') {
      onSwitchToLogin?.();
    } else if (step === 'verify') {
      setStep('identify');
    } else if (step === 'reset') {
      setStep('verify');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                {step === 'identify' && (
                  <>
                    <Text style={styles.title}>忘记密码</Text>
                    <Text style={styles.subtitle}>
                      请输入您的手机号或邮箱，我们将发送验证码给您
                    </Text>
                  </>
                )}
                {step === 'verify' && (
                  <>
                    <Text style={styles.title}>输入验证码</Text>
                    <Text style={styles.subtitle}>验证码已发送至 {identifier}</Text>
                  </>
                )}
                {step === 'reset' && (
                  <>
                    <Text style={styles.title}>设置新密码</Text>
                    <Text style={styles.subtitle}>请设置您的新密码</Text>
                  </>
                )}
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {step === 'identify' && (
                <>
                  <Input
                    label="账号"
                    placeholder="手机号或邮箱"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Button
                    title="发送验证码"
                    onPress={handleSendCode}
                    loading={isLoading}
                    disabled={!identifier.trim()}
                    size="lg"
                  />
                </>
              )}

              {step === 'verify' && (
                <>
                  <View style={styles.verifyInputRow}>
                    <View style={styles.verifyInputWrapper}>
                      <Input
                        label="验证码"
                        placeholder="6位验证码"
                        value={verifyCode}
                        onChangeText={setVerifyCode}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                      onPress={countdown > 0 ? undefined : handleSendCode}
                      disabled={countdown > 0}
                    >
                      <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonTextDisabled]}>
                        {countdown > 0 ? `${countdown}s` : '重发'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Button
                    title="下一步"
                    onPress={handleVerifyCode}
                    loading={isLoading}
                    disabled={verifyCode.length !== 6}
                    size="lg"
                  />
                </>
              )}

              {step === 'reset' && (
                <>
                  <Input
                    label="新密码"
                    placeholder="新密码（至少6位）"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    rightIcon={
                      <Text style={styles.eyeIcon}>
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    }
                    onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                  />
                  <Input
                    label="确认新密码"
                    placeholder="确认新密码"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={
                      <Text style={styles.eyeIcon}>
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    }
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  <Button
                    title="确认重置"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    disabled={!newPassword.trim() || !confirmPassword.trim()}
                    size="lg"
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: 440,
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xxl,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  content: {
    gap: SPACING.lg,
  },
  verifyInputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  verifyInputWrapper: {
    flex: 1,
  },
  resendButton: {
    paddingHorizontal: SPACING.lg,
    height: 52,
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendButtonDisabled: {
    backgroundColor: '#2d2d44',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  resendButtonTextDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  eyeIcon: {
    fontSize: 20,
  },
});
