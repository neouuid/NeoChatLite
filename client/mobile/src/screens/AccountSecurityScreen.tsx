// 账户安全页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
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

export const AccountSecurityScreen: React.FC = () => {
  const navigation = useNavigation();

  const securityItems = [
    {
      id: 'password',
      title: '修改密码',
      icon: 'lock-closed-outline',
      subtitle: '定期修改密码以保护账户安全',
      type: 'navigate' as const,
    },
    {
      id: 'phone',
      title: '绑定手机号',
      icon: 'phone-portrait-outline',
      subtitle: '未绑定',
      type: 'navigate' as const,
      hasWarning: true,
    },
    {
      id: 'email',
      title: '绑定邮箱',
      icon: 'mail-outline',
      subtitle: '未绑定',
      type: 'navigate' as const,
      hasWarning: true,
    },
  ];

  const authItems = [
    {
      id: 'devices',
      title: '登录设备管理',
      icon: 'desktop-outline',
      type: 'navigate' as const,
    },
    {
      id: 'sessions',
      title: '活跃会话',
      icon: 'time-outline',
      type: 'navigate' as const,
    },
  ];

  const dangerItems = [
    {
      id: 'logout-all',
      title: '退出所有设备',
      icon: 'log-out-outline',
      type: 'action' as const,
      isDanger: true,
      onPress: () => {
        Alert.alert(
          '退出所有设备',
          '确定要退出所有已登录的设备吗？',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '确定',
              style: 'destructive',
              onPress: () => Alert.alert('已退出', '所有设备已退出登录'),
            },
          ]
        );
      },
    },
    {
      id: 'delete-account',
      title: '注销账户',
      icon: 'trash-outline',
      type: 'action' as const,
      isDanger: true,
      onPress: () => {
        Alert.alert(
          '注销账户',
          '注销后您的账户数据将被永久删除，此操作不可撤销。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '确定注销',
              style: 'destructive',
              onPress: () => Alert.alert('已提交', '账户注销申请已提交'),
            },
          ]
        );
      },
    },
  ];

  const renderMenuItem = (item: any) => {
    if (item.type === 'navigate') {
      return (
        <TouchableOpacity key={item.id} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.isDanger ? COLORS.error : COLORS.dark.text.primary}
              />
            </View>
            <View style={styles.menuItemText}>
              <Text
                style={[
                  styles.menuItemTitle,
                  item.isDanger && styles.menuItemTitleDanger,
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text
                  style={[
                    styles.menuItemSubtitle,
                    item.hasWarning && styles.menuItemSubtitleWarning,
                  ]}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color={item.isDanger ? COLORS.error : COLORS.dark.text.primary}
            />
          </View>
          <Text
            style={[
              styles.menuItemTitle,
              item.isDanger && styles.menuItemTitleDanger,
            ]}
          >
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string | null, items: any[], hasDivider: boolean = true) => (
    <View style={styles.menuSection} key={title || 'security'}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderMenuItem(item)}
            {hasDivider && index < items.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>账户安全</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.tipsContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.primary}
            style={styles.tipsIcon}
          />
          <Text style={styles.tipsText}>
            建议开启双重验证，定期修改密码，保护您的账户安全。
          </Text>
        </View>

        {renderSection('安全设置', securityItems)}
        {renderSection('登录管理', authItems)}
        {renderSection('危险操作', dangerItems, false)}

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
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
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  tipsIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  tipsText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuItemTitleDanger: {
    color: COLORS.error,
  },
  menuItemSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  menuItemSubtitleWarning: {
    color: COLORS.warning,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 32 + SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
