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

import { useAuthStore, AuthService, Input, Button } from '@neochat/shared';
import type { RootStackParamList } from '@neochat/shared';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@neochat/shared';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setAuth, setLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('提示', '请输入用户名/手机号和密码');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await AuthService.login({ identifier, password });
      setAuth(auth);
    } catch (error) {
      Alert.alert('登录失败', error instanceof Error ? error.message : '请稍后重试');
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>N</Text>
            </View>
            <Text style={styles.appTitle}>NeoChat</Text>
            <Text style={styles.appSubtitle}>欢迎回来，请登录您的账号</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Identifier Input */}
            <Input
              label="用户名/邮箱/手机号"
              placeholder="请输入用户名、邮箱或手机号"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password Input */}
            <Input
              label="密码"
              placeholder="请输入密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Options Row */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberRow}>
                <Text style={styles.rememberText}>记住我</Text>
              </View>
              <Text
                style={styles.forgotLink}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                忘记密码？
              </Text>
            </View>

            {/* Login Button */}
            <Button
              title={isSubmitting ? '登录中...' : '登录'}
              onPress={handleLogin}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或者</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              注册新账号
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
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  appTitle: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  appSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  formSection: {
    gap: SPACING.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rememberText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  forgotLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dark.surface,
  },
  dividerText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 'auto',
  },
  footerText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  eyeIcon: {
    fontSize: 20,
  },
});
