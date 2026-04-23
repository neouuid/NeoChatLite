// 关于页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

const APP_VERSION = '1.0.0';
const GITHUB_URL = 'https://github.com/neochat/neochat';
const WEBSITE_URL = 'https://neohope.com';
const FEEDBACK_EMAIL = 'feedback@neohope.com';
const APP_STORE_URL = 'https://apps.apple.com/app/neochat';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.neochat';
const PRIVACY_POLICY_URL = `${WEBSITE_URL}/privacy`;
const TERMS_OF_SERVICE_URL = `${WEBSITE_URL}/terms`;
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  const menuItems = [
    {
      id: 'website',
      title: '官方网站',
      icon: 'globe-outline',
      onPress: () => Linking.openURL(WEBSITE_URL),
    },
    {
      id: 'github',
      title: 'GitHub 仓库',
      icon: 'logo-github',
      onPress: () => Linking.openURL(GITHUB_URL),
    },
    {
      id: 'feedback',
      title: '意见反馈',
      icon: 'chatbubbles-outline',
      onPress: () => {
        const emailUrl = `mailto:${FEEDBACK_EMAIL}?subject=NeoChat 反馈`;
        Linking.openURL(emailUrl);
      },
    },
    {
      id: 'review',
      title: '评分',
      icon: 'star-outline',
      onPress: () => {
        // 尝试打开应用商店，降级到官网
        Linking.openURL(APP_STORE_URL).catch(() => {
          Linking.openURL(PLAY_STORE_URL).catch(() => {
            Linking.openURL(WEBSITE_URL);
          });
        });
      },
    },
    {
      id: 'license',
      title: '开源许�?,
      icon: 'document-text-outline',
      onPress: () => Linking.openURL(LICENSE_URL),
    },
    {
      id: 'privacy',
      title: '隐私政策',
      icon: 'shield-checkmark-outline',
      onPress: () => Linking.openURL(PRIVACY_POLICY_URL),
    },
    {
      id: 'terms',
      title: '用户协议',
      icon: 'reader-outline',
      onPress: () => Linking.openURL(TERMS_OF_SERVICE_URL),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Logo 区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Ionicons name="chatbubbles" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>NeoChat</Text>
          <Text style={styles.versionText}>版本 {APP_VERSION}</Text>
        </View>

        {/* 描述 */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            NeoChat 是一款现代化的跨平台即时通讯应用�?            支持 iOS、Android、Windows �?macOS�?          </Text>
        </View>

        {/* 菜单�?*/}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={22} color={COLORS.dark.text.primary} />
                    </View>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>© 2026 NeoChat Team</Text>
          <Text style={styles.copyrightSubtext}>All rights reserved.</Text>
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
  logoSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  versionText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  descriptionSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  descriptionText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  menuCard: {
    backgroundColor: COLORS.dark.surface,
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
  menuItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 32 + SPACING.md,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  copyrightText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  copyrightSubtext: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
