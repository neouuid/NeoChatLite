// 忘记密码页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

import { Button } from '@neochat/shared/src/components';

type Step = 'identify' | 'verify' | 'reset';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('identify');
  const [isLoading, setIsLoading] = useState(false);

  // 第一步：输入账号
  const [identifier, setIdentifier] = useState('');

  // 第二步：输入验证码
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 第三步：设置新密码
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 发送验证码
  const handleSendCode = async () => {
    if (!identifier.trim()) {
      Alert.alert('提示', '请输入手机号或邮箱');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 调用发送验证码 API
      // await authService.sendVerificationCode(identifier);
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
      // TODO: 调用验证验证码 API
      // await authService.verifyCode(identifier, verifyCode);
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
      // TODO: 调用重置密码 API
      // await authService.resetPassword(identifier, verifyCode, newPassword);
      Alert.alert('成功', '密码重置成功，请使用新密码登录', [
        { text: '确定', onPress: () => navigation.navigate('Login' as never) },
      ]);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '重置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染第一步：输入账号
  const renderIdentifyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>找回密码</Text>
      <Text style={styles.stepSubtitle}>请输入您的手机号或邮箱，我们将发送验证码给您</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
          size={20}
          color={COLORS.dark.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="手机号/邮箱"
          placeholderTextColor={COLORS.dark.text.tertiary}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      </View>

      <Button
        title="发送验证码"
        onPress={handleSendCode}
        loading={isLoading}
        disabled={!identifier.trim()}
        style={styles.button}
      />
    </View>
  );

  // 渲染第二步：输入验证码
  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>输入验证码</Text>
      <Text style={styles.stepSubtitle}>验证码已发送至 {identifier}</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, styles.verifyInputContainer]}>
          <Ionicons
            name="keypad-outline"
            size={20}
            color={COLORS.dark.text.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="6位验证码"
            placeholderTextColor={COLORS.dark.text.tertiary}
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
        style={styles.button}
      />
    </View>
  );

  // 渲染第三步：设置新密码
  const renderResetStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>设置新密码</Text>
      <Text style={styles.stepSubtitle}>请设置您的新密码</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.dark.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="新密码（至少6位）"
          placeholderTextColor={COLORS.dark.text.tertiary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.dark.text.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="确认新密码"
          placeholderTextColor={COLORS.dark.text.tertiary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <Button
        title="确认重置"
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={!newPassword.trim() || !confirmPassword.trim()}
        style={styles.button}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 'identify') {
              navigation.goBack();
            } else if (step === 'verify') {
              setStep('identify');
            } else if (step === 'reset') {
              setStep('verify');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>忘记密码</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Logo 区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Ionicons name="chatbubbles" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>NeoChat</Text>
        </View>

        {/* 当前步骤 */}
        {step === 'identify' && renderIdentifyStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'reset' && renderResetStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  stepContainer: {
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  verifyInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  resendButton: {
    paddingHorizontal: SPACING.lg,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendButtonDisabled: {
    backgroundColor: COLORS.dark.surface,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  resendButtonTextDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  button: {
    marginTop: SPACING.lg,
  },
});
