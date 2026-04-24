// 桌面端关于页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

const APP_VERSION = '1.0.0';
const GITHUB_URL = 'https://github.com/neochat/neochat';
const WEBSITE_URL = 'https://neochat.app';
const FEEDBACK_EMAIL = 'feedback@neohope.com';
const PRIVACY_POLICY_URL = `${WEBSITE_URL}/privacy`;
const TERMS_OF_SERVICE_URL = `${WEBSITE_URL}/terms`;
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

interface AboutWindowProps {
  onBack?: () => void;
}

export const AboutWindow: React.FC<AboutWindowProps> = ({ onBack }) => {
  const menuItems = [
    {
      id: 'website',
      title: '官方网站',
      icon: 'globe-outline' as const,
      onPress: () => Linking.openURL(WEBSITE_URL),
    },
    {
      id: 'github',
      title: 'GitHub 仓库',
      icon: 'logo-github' as const,
      onPress: () => Linking.openURL(GITHUB_URL),
    },
    {
      id: 'feedback',
      title: '意见反馈',
      icon: 'chatbubbles-outline' as const,
      onPress: () => {
        const emailUrl = `mailto:${FEEDBACK_EMAIL}?subject=NeoChat 反馈`;
        Linking.openURL(emailUrl);
      },
    },
    {
      id: 'license',
      title: '开源许可',
      icon: 'document-text-outline' as const,
      onPress: () => Linking.openURL(LICENSE_URL),
    },
    {
      id: 'privacy',
      title: '隐私政策',
      icon: 'shield-checkmark-outline' as const,
      onPress: () => Linking.openURL(PRIVACY_POLICY_URL),
    },
    {
      id: 'terms',
      title: '用户协议',
      icon: 'document-outline' as const,
      onPress: () => Linking.openURL(TERMS_OF_SERVICE_URL),
    },
  ];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* App 信息 */}
        <View style={styles.appInfoSection}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Ionicons name="chatbubbles" size={48} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.appName}>NeoChat</Text>
          <Text style={styles.appVersion}>版本 {APP_VERSION}</Text>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>© 2024 NeoChat</Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ by NeoChat Team
          </Text>
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
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 8,
  },
  appVersion: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  menuSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
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
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  copyrightText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: 4,
  },
  copyrightSubtext: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
