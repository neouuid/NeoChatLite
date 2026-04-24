// 系统设置页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useUISettingsStore,
} from 'neochat-shared';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, setTheme, notificationsEnabled, toggleNotifications } = useUISettingsStore();

  // 功能设置
  const settingsItems = [
    {
      id: 'notifications',
      title: '消息通知',
      icon: 'notifications-outline',
      type: 'toggle' as const,
      value: notificationsEnabled,
      onToggle: toggleNotifications,
    },
    {
      id: 'theme',
      title: '主题设置',
      icon: 'color-palette-outline',
      type: 'navigate' as const,
      screen: 'Theme' as const,
      subtitle: theme === 'dark' ? '深色模式' : theme === 'light' ? '浅色模式' : '跟随系统',
    },
    {
      id: 'chat-background',
      title: '聊天背景',
      icon: 'image-outline',
      type: 'navigate' as const,
      screen: 'ChatBackground' as const,
    },
    {
      id: 'security',
      title: '账号安全',
      icon: 'lock-closed-outline',
      type: 'navigate' as const,
      screen: 'AccountSecurity' as const,
    },
  ];

  // 数据管理
  const dataItems = [
    {
      id: 'backup',
      title: '聊天备份',
      icon: 'cloud-upload-outline',
      type: 'navigate' as const,
      screen: 'ChatBackup' as const,
    },
    {
      id: 'clear',
      title: '清除数据',
      icon: 'trash-outline',
      type: 'navigate' as const,
      screen: 'DataClear' as const,
    },
  ];

  // 关于
  const aboutItems = [
    {
      id: 'about',
      title: '关于 NeoChat',
      icon: 'information-circle-outline',
      type: 'navigate' as const,
      screen: 'About' as const,
    },
    {
      id: 'help',
      title: '帮助与反馈',
      icon: 'help-circle-outline',
      type: 'navigate' as const,
      screen: 'Help' as const,
    },
  ];

  const renderMenuItem = (item: any) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={22} color={COLORS.dark.text.primary} />
            </View>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: COLORS.dark.border, true: `${COLORS.primary}80` }}
            thumbColor={item.value ? COLORS.primary : COLORS.dark.text.tertiary}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => navigation.navigate(item.screen as never)}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Ionicons name={item.icon as any} size={22} color={COLORS.dark.text.primary} />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: any[]) => (
    <View style={styles.menuSection} key={title}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderMenuItem(item)}
            {index < items.length - 1 && <View style={styles.menuDivider} />}
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
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {renderSection('功能设置', settingsItems)}
        {renderSection('数据管理', dataItems)}
        {renderSection('关于', aboutItems)}

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
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
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
  menuItemSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
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
