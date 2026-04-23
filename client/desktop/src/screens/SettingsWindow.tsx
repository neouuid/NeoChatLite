// 桌面端系统设置窗�?

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useUISettingsStore,
} from 'neochat-shared';

interface SettingsWindowProps {
  onNavigate?: (screen: string) => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({
  onNavigate,
}) => {
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
      title: '帮助与反�?,
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
              <Ionicons name={item.icon as any} size={20} color="#ffffff" />
            </View>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#2d2d44', true: 'rgba(91, 124, 255, 0.5)' }}
            thumbColor={item.value ? '#5b7cff' : '#8b8bb3'}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => onNavigate?.(item.screen)}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Ionicons name={item.icon as any} size={20} color="#ffffff" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderSection('功能设置', settingsItems)}
        {renderSection('数据管理', dataItems)}
        {renderSection('关于', aboutItems)}

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: 32,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#252542',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuItemSubtitle: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
