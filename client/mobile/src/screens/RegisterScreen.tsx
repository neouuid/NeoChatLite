import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore, AuthService, Input, Button } from 'neochat-shared';
import type { RootStackParamList } from 'neochat-shared';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from 'neochat-shared';
import { validateUsername, validatePassword, validateEmail, validatePhone } from 'neochat-shared';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // 验证必填字段
    if (!username || !password || !confirmPassword) {
      Alert.alert('提示', '请填写必填字�?);
      return;
    }

    // 验证用户�?    const usernameError = validateUsername(username);
    if (usernameError) {
      Alert.alert('用户名错�?, usernameError);
      return;
    }

    // 验证密码
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('密码错误', passwordError);
      return;
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一�?);
      return;
    }

    // 验证邮箱（如果提供）
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) {
        Alert.alert('邮箱错误', emailError);
        return;
      }
    }

    // 验证手机号（如果提供�?    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        Alert.alert('手机号错�?, phoneError);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const auth = await AuthService.register({
        username,
        nickname: nickname || username,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
      });
      setAuth(auth);
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '请稍后重�?);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>创建账号</Text>
            <Text style={styles.subtitle}>加入NeoChat，开始聊�?/Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Username Input */}
            <Input
              label="用户�?*"
              placeholder="请输入用户名�?-20个字符）"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Nickname Input */}
            <Input
              label="昵称"
              placeholder="请输入昵称（可选）"
              value={nickname}
              onChangeText={setNickname}
            />

            {/* Email Input */}
            <Input
              label="邮箱"
              placeholder="请输入邮箱（可选）"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            {/* Phone Input */}
            <Input
              label="手机�?
              placeholder="请输入手机号（可选）"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Password Input */}
            <Input
              label="密码 *"
              placeholder="请输入密码（至少6位）"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁�? : '👁️‍🗨️'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Confirm Password Input */}
            <Input
              label="确认密码 *"
              placeholder="请再次输入密�?
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁�? : '👁️‍🗨️'}
                </Text>
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Register Button */}
            <Button
              title={isSubmitting ? '注册�?..' : '注册'}
              onPress={handleRegister}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>已有账号�?/Text>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              立即登录
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  formSection: {
    gap: SPACING.lg,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  eyeIcon: {
    fontSize: 20,
  },
});
