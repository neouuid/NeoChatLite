import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LoginWindow: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.appTitle}>NeoChat</Text>
          <Text style={styles.appSubtitle}>欢迎回来，请登录您的账号</Text>
        </View>

        {/* Form will go here */}
        <Text style={styles.placeholderText}>Login Form</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: 440,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appSubtitle: {
    color: '#8b8bb3',
    fontSize: 14,
  },
  placeholderText: {
    color: '#8b8bb3',
    fontSize: 16,
  },
});
