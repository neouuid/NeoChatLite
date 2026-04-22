// 桌面端账号安全页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  authService,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

interface AccountSecurityWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const AccountSecurityWindow: React.FC<AccountSecurityWindowProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user, logout } = useAuthStore();

  // 修改密码
  const handleChangePassword = () => {
    Alert.alert('提示', '修改密码功能开发中');
  };

  // 修改手机号
  const handleChangePhone = () => {
    Alert.alert('提示', '修改手机号功能开发中');
  };

  // 修改邮箱
  const handleChangeEmail = () => {
    Alert.alert('提示', '修改邮箱功能开发中');
  };

  // 绑定设备
  const handleBindDevice = () => {
    Alert.alert('提示', '设备绑定功能开发中');
  };

  // 登录记录
  const handleLoginHistory = () => {
    Alert.alert('提示', '登录记录功能开发中');
  };

  // 注销账号
  const handleDeleteAccount = () => {
    Alert.alert(
      '注销账号',
      '注销账号后，你的所有数据将被删除且无法恢复。确定要注销吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定注销',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              logout();
              Alert.alert('已注销', '账号已成功注销');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '注销失败');
            }
          },
        },
      ]
    );
  };

  const securityItems = [
    {
      id: 'password',
      title: '修改密码',
      icon: 'key-outline' as const,
      subtitle: '当前：******',
      onPress: handleChangePassword,
    },
    {
      id: 'phone',
      title: '手机号',
      icon: 'phone-portrait-outline' as const,
      subtitle: user?.phone ? `当前：${user.phone}` : '未绑定',
      onPress: handleChangePhone,
    },
    {
      id: 'email',
      title: '邮箱',
      icon: 'mail-outline' as const,
      subtitle: user?.email ? `当前：${user.email}` : '未绑定',
      onPress: handleChangeEmail,
    },
    {
      id: 'device',
      title: '设备管理',
      icon: 'tablet-portrait-outline' as const,
      subtitle: '查看登录设备',
      onPress: handleBindDevice,
    },
    {
      id: 'history',
      title: '登录记录',
      icon: 'time-outline' as const,
      subtitle: '查看登录历史',
      onPress: handleLoginHistory,
    },
  ];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>账号安全</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 安全设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全设置</Text>
          <View style={styles.securityCard}>
            {securityItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.securityItem} onPress={item.onPress}>
                  <View style={styles.securityLeft}>
                    <View style={styles.securityIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#ffffff" />
                    </View>
                    <View style={styles.securityText}>
                      <Text style={styles.securityTitle}>{item.title}</Text>
                      <Text style={styles.securitySubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
                </TouchableOpacity>
                {index < securityItems.length - 1 && <View style={styles.securityDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 注销账号 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerCard} onPress={handleDeleteAccount}>
            <View style={styles.dangerLeft}>
              <View style={styles.dangerIconContainer}>
                <Ionicons name="trash-outline" size={20} color="#ff4757" />
              </View>
              <Text style={styles.dangerTitle}>注销账号</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
          </TouchableOpacity>
        </View>

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
  },
  securityCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  securitySubtitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  securityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dangerTitle: {
    color: '#ff4757',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
