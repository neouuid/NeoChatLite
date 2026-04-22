// 桌面端个人资料窗口

import React, { useCallback } from 'react';
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
  useUserStore,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';

interface ProfileWindowProps {
  onNavigate?: (screen: string) => void;
}

export const ProfileWindow: React.FC<ProfileWindowProps> = ({
  onNavigate,
}) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { clearUser } = useUserStore();

  // 菜单项目
  const menuItems = [
    {
      id: 'my-profile',
      title: '我的资料',
      icon: 'person-outline',
      onPress: () => {
        onNavigate?.('EditProfile');
      },
    },
    {
      id: 'mentions',
      title: '我的提及',
      icon: 'at-outline',
      onPress: () => {
        onNavigate?.('Mentions');
      },
    },
    {
      id: 'friends',
      title: '好友管理',
      icon: 'people-outline',
      onPress: () => {
        onNavigate?.('FriendManage');
      },
    },
    {
      id: 'favorites',
      title: '收藏',
      icon: 'bookmark-outline',
      onPress: () => {
        onNavigate?.('Favorites');
      },
    },
    {
      id: 'settings',
      title: '设置',
      icon: 'settings-outline',
      onPress: () => {
        onNavigate?.('Settings');
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
        onNavigate?.('About');
      },
    },
    {
      id: 'help',
      title: '帮助与反馈',
      icon: 'help-circle-outline',
      onPress: () => {
        onNavigate?.('Help');
      },
    },
  ];

  // 处理退出登录
  const handleLogout = useCallback(() => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
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
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              onNavigate?.('EditProfile');
            }}
          >
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
                      <Ionicons name={item.icon as any} size={22} color="#ffffff" />
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

        {/* 关于区域 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.menuCard}>
            {aboutItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={22} color="#ffffff" />
                    </View>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
                </TouchableOpacity>
                {index < aboutItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 退出登录按钮 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>退出登录</Text>
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
    backgroundColor: '#f7f8fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginTop: SPACING.lg,
  },
  avatar: {
    marginRight: SPACING.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  userUsername: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  userBio: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  editButton: {
    padding: SPACING.sm,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 24,
    marginTop: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
  },
  menuSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
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
  menuItemTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 16,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
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
