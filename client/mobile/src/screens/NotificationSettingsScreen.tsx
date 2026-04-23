// 通知设置页面

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

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    messagePreviewEnabled,
    setMessagePreviewEnabled,
    soundEnabled,
    setSoundEnabled,
    vibrateEnabled,
    setVibrateEnabled,
  } = useUISettingsStore();

  const notificationItems = [
    {
      id: 'notifications',
      title: '接收新消息通知',
      subtitle: '接收聊天消息通知',
      type: 'toggle' as const,
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
  ];

  const messageItems = [
    {
      id: 'preview',
      title: '消息预览',
      subtitle: '在通知中显示消息内�?,
      type: 'toggle' as const,
      value: messagePreviewEnabled,
      onToggle: setMessagePreviewEnabled,
      requiresNotification: true,
    },
    {
      id: 'sound',
      title: '提示�?,
      subtitle: '收到消息时播放提示音',
      type: 'toggle' as const,
      value: soundEnabled,
      onToggle: setSoundEnabled,
      requiresNotification: true,
    },
    {
      id: 'vibrate',
      title: '震动',
      subtitle: '收到消息时震�?,
      type: 'toggle' as const,
      value: vibrateEnabled,
      onToggle: setVibrateEnabled,
      requiresNotification: true,
    },
  ];

  const otherItems = [
    {
      id: 'exception',
      title: '通知例外',
      icon: 'person-remove-outline',
      type: 'navigate' as const,
      requiresNotification: true,
    },
  ];

  const renderToggleItem = (item: any, disabled: boolean) => (
    <View key={item.id} style={[styles.menuItem, disabled && styles.menuItemDisabled]}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, disabled && styles.menuItemTitleDisabled]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.menuItemSubtitle, disabled && styles.menuItemSubtitleDisabled]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={disabled ? false : item.value}
        onValueChange={disabled ? undefined : item.onToggle}
        trackColor={{ false: COLORS.dark.border, true: `${COLORS.primary}80` }}
        thumbColor={disabled ? COLORS.dark.text.tertiary : (item.value ? COLORS.primary : COLORS.dark.text.tertiary)}
        disabled={disabled}
      />
    </View>
  );

  const renderNavigateItem = (item: any, disabled: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, disabled && styles.menuItemDisabled]}
      disabled={disabled}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons
            name={item.icon as any}
            size={22}
            color={disabled ? COLORS.dark.text.tertiary : COLORS.dark.text.primary}
          />
        </View>
        <Text style={[styles.menuItemTitle, disabled && styles.menuItemTitleDisabled]}>
          {item.title}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={disabled ? COLORS.dark.text.tertiary : COLORS.dark.text.tertiary}
      />
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: any[]) => (
    <View style={styles.menuSection} key={title}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.type === 'toggle' && renderToggleItem(item, item.requiresNotification && !notificationsEnabled)}
            {item.type === 'navigate' && renderNavigateItem(item, item.requiresNotification && !notificationsEnabled)}
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
        <Text style={styles.headerTitle}>通知设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {renderSection('消息通知', notificationItems)}
        {renderSection('消息设置', messageItems)}
        {renderSection('其他', otherItems)}

        {!notificationsEnabled && (
          <View style={styles.hintContainer}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.dark.text.tertiary} style={styles.hintIcon} />
            <Text style={styles.hintText}>开启新消息通知后才能使用以下功�?/Text>
          </View>
        )}

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
  menuItemDisabled: {
    opacity: 0.5,
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
  menuItemTitleDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  menuItemSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  menuItemSubtitleDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.dark.surface}80`,
    borderRadius: BORDER_RADIUS.md,
  },
  hintIcon: {
    marginRight: SPACING.sm,
  },
  hintText: {
    flex: 1,
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
