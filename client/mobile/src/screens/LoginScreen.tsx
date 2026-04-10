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

import { useAuthStore, AuthService } from '@neochat/shared';
import type { RootStackParamList } from '@neochat/shared';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@neochat/shared';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setAuth, setLoading } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await AuthService.login({ username, password });
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
            {/* Username Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>用户名/手机号</Text>
              <View style={styles.inputContainer}>
                {/* TODO: Replace with actual Input component */}
                <View style={styles.inputPlaceholder}>
                  <Text style={styles.inputText}>{username || '请输入用户名'}</Text>
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>密码</Text>
              <View style={styles.inputContainer}>
                {/* TODO: Replace with actual Input component */}
                <View style={styles.inputPlaceholder}>
                  <Text style={styles.inputText}>{password ? '••••••••' : '请输入密码'}</Text>
                </View>
              </View>
            </View>

            {/* Options Row */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberRow}>
                {/* TODO: Add checkbox */}
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
            <View style={styles.loginButton}>
              <Text style={styles.loginButtonText}>
                {isSubmitting ? '登录中...' : '登录'}
              </Text>
            </View>

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
  fieldContainer: {
    gap: SPACING.sm,
  },
  fieldLabel: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputContainer: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  inputPlaceholder: {
    flex: 1,
    justifyContent: 'center',
  },
  inputText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
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
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
});
