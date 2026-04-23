// 桌面端个人资料面�?
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useUserStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';

interface ProfilePanelProps {
  onClose?: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ onClose }) => {
  const navigation = useNavigation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { clearUser } = useUserStore();

  // 菜单项目
  const menuItems = [
    {
      id: 'my-profile',
      title: '我的资料',
      icon: 'person-outline',
      onPress: () => {
        console.log('Navigate to edit profile');
      },
    },
    {
      id: 'friends',
      title: '好友管理',
      icon: 'people-outline',
      onPress: () => {
        console.log('Navigate to friends');
      },
    },
    {
      id: 'favorites',
      title: '收藏',
      icon: 'bookmark-outline',
      onPress: () => {
        console.log('Navigate to favorites');
      },
    },
    {
      id: 'settings',
      title: '设置',
      icon: 'settings-outline',
      onPress: () => {
        navigation.navigate('Settings' as never);
      },
    },
  ];

  // 关于项目
  const aboutItems = [
    {
      id: 'about',
      title: '关于 NeoChat',
      icon: 'information-circle-outline',
      onPress: () => {
        console.log('Navigate to about');
      },
    },
    {
      id: 'help',
      title: '帮助与反�?,
      icon: 'help-circle-outline',
      onPress: () => {
        console.log('Navigate to help');
      },
    },
  ];

  // 处理退出登�?  const handleLogout = useCallback(() => {
    Alert.alert(
      '退出登�?,
      '确定要退出登录吗�?,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            logout();
            clearUser();
          },
        },
      ]
    );
  }, [logout, clearUser]);

  const displayName = user ? formatDisplayName(user.nickname, user.username) : '未知用户';

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>个人中心</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <Avatar
            uri={user.avatar}
            nickname={displayName}
            size="xl"
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            {user.username && (
              <Text style={styles.userUsername}>@{user.username}</Text>
            )}
            {user.bio && (
              <Text style={styles.userBio} numberOfLines={2}>
                {user.bio}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>好友</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>群组</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
        </View>

        {/* 菜单区域 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>功能</Text>
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

        {/* 关于区域 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.menuCard}>
            {aboutItems.map((item, index) => (
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
                {index < aboutItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 退出登录按�?*/}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>退出登�?/Text>
        </TouchableOpacity>

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.dark.border,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  headerTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  avatar: {
    marginRight: SPACING.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  userUsername: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  userBio: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  editButton: {
    padding: SPACING.sm,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.background,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
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
    backgroundColor: COLORS.dark.background,
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
  menuItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 32 + SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.background,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
