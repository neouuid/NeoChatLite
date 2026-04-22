// 桌面端主题设置页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useUISettingsStore,
} from '@neochat/shared';

interface ThemeWindowProps {
  onBack?: () => void;
}

type ThemeType = 'light' | 'dark' | 'system';

export const ThemeWindow: React.FC<ThemeWindowProps> = ({ onBack }) => {
  const { theme, setTheme } = useUISettingsStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>((theme as ThemeType) || 'light');

  const themes = [
    { id: 'light' as const, title: '浅色模式', icon: 'sunny-outline', color: '#ffffff' },
    { id: 'dark' as const, title: '深色模式', icon: 'moon-outline', color: '#1a1a2e' },
    { id: 'system' as const, title: '跟随系统', icon: 'phone-portrait-outline', color: '#5b7cff' },
  ];

  const handleSelectTheme = (themeType: ThemeType) => {
    setCurrentTheme(themeType);
    setTheme(themeType);
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>主题设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 主题预览 */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>主题预览</Text>
          <View style={styles.previewContainer}>
            <View style={[styles.previewCard, styles.previewCardLight]}>
              <View style={styles.previewHeader} />
              <View style={styles.previewContent} />
              <Text style={styles.previewLabel}>浅色</Text>
            </View>
            <View style={[styles.previewCard, styles.previewCardDark]}>
              <View style={styles.previewHeaderDark} />
              <View style={styles.previewContentDark} />
              <Text style={styles.previewLabelDark}>深色</Text>
            </View>
          </View>
        </View>

        {/* 主题选择 */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>选择主题</Text>
          <View style={styles.themeCard}>
            {themes.map((themeOption, index) => (
              <React.Fragment key={themeOption.id}>
                <TouchableOpacity
                  style={styles.themeItem}
                  onPress={() => handleSelectTheme(themeOption.id)}
                >
                  <View style={styles.themeItemLeft}>
                    <View style={[styles.themeIconContainer, { backgroundColor: themeOption.color + '20' }]}>
                      <Ionicons name={themeOption.icon} size={20} color={themeOption.color} />
                    </View>
                    <Text style={styles.themeTitle}>{themeOption.title}</Text>
                  </View>
                  {currentTheme === themeOption.id ? (
                    <View style={styles.checkboxSelected}>
                      <Ionicons name="checkmark" size={18} color="#5b7cff" />
                    </View>
                  ) : (
                    <View style={styles.checkbox} />
                  )}
                </TouchableOpacity>
                {index < themes.length - 1 && <View style={styles.themeDivider} />}
              </React.Fragment>
            ))}
          </View>
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
  previewSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.md,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  previewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    overflow: 'hidden',
  },
  previewCardLight: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  previewCardDark: {
    backgroundColor: '#2d2d44',
  },
  previewHeader: {
    height: 24,
    backgroundColor: '#F7F8FA',
    borderRadius: 4,
    marginBottom: 8,
  },
  previewHeaderDark: {
    height: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    marginBottom: 8,
  },
  previewContent: {
    height: 80,
    backgroundColor: '#F7F8FA',
    borderRadius: 4,
    marginBottom: 12,
  },
  previewContentDark: {
    height: 80,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    marginBottom: 12,
  },
  previewLabel: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  previewLabelDark: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  themeSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  themeCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  themeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  themeTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  checkboxSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
