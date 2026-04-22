// 主题设置页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  useUISettingsStore,
  type Theme,
} from '@neochat/shared';

const themeOptions: { value: Theme; label: string; icon: string; description: string }[] = [
  {
    value: 'system',
    label: '跟随系统',
    icon: 'phone-portrait-outline',
    description: '使用系统的主题设置',
  },
  {
    value: 'light',
    label: '浅色模式',
    icon: 'sunny-outline',
    description: '使用浅色主题',
  },
  {
    value: 'dark',
    label: '深色模式',
    icon: 'moon-outline',
    description: '使用深色主题',
  },
];

export const ThemeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, setTheme } = useUISettingsStore();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>主题设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择主题</Text>
          <View style={styles.optionsCard}>
            {themeOptions.map((option, index) => (
              <React.Fragment key={option.value}>
                <TouchableOpacity
                  style={[styles.optionItem, theme === option.value && styles.optionItemActive]}
                  onPress={() => setTheme(option.value)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIconContainer,
                        theme === option.value && styles.optionIconContainerActive,
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={theme === option.value ? '#fff' : COLORS.dark.text.primary}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                  </View>
                  {theme === option.value && (
                    <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
                {index < themeOptions.length - 1 && <View style={styles.optionDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预览</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAvatar} />
              <View style={styles.previewText}>
                <View style={styles.previewLineShort} />
                <View style={styles.previewLineLong} />
              </View>
            </View>
            <View style={styles.previewBody}>
              <View style={styles.previewBubbleLeft}>
                <View style={styles.previewBubbleText} />
              </View>
              <View style={styles.previewBubbleRight}>
                <View style={styles.previewBubbleText} />
              </View>
            </View>
          </View>
        </View>

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
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  optionsCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  optionItemActive: {
    backgroundColor: `${COLORS.primary}10`,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs / 2,
  },
  optionDescription: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 48 + SPACING.md,
  },
  previewCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.border,
    marginRight: SPACING.md,
  },
  previewText: {
    flex: 1,
    gap: SPACING.xs,
  },
  previewLineShort: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.dark.border,
  },
  previewLineLong: {
    width: 160,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.dark.border,
  },
  previewBody: {
    gap: SPACING.sm,
  },
  previewBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dark.background,
    borderRadius: BORDER_RADIUS.md,
    borderTopLeftRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  previewBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderTopRightRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  previewBubbleText: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${COLORS.dark.text.primary}40`,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
