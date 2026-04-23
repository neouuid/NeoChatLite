// 查看他人资料页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User, Friend } from 'neochat-shared/src/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'neochat-shared/src/types';

type ViewProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ViewProfile'>;

export const ViewProfileScreen: React.FC = () => {
  const navigation = useNavigation<ViewProfileScreenNavigationProp>();
  const route = useRoute();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [friendRelation, setFriendRelation] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  const { userId } = route.params as { userId: string };

  // 加载用户资料
  const loadUserProfile = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await chatService.getUser(userId);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('错误', '加载用户资料失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userId]);

  // 检查是否是好友
  const checkFriendStatus = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await chatService.getFriends();
      if (response.success && response.data) {
        setFriends(response.data);
        const friend = response.data.find(f => f.friend?.id === userId);
        setFriendRelation(friend || null);
      }
    } catch (error) {
      console.error('Failed to check friend status:', error);
    }
  }, [currentUser, userId]);

  // 添加好友
  const handleAddFriend = useCallback(() => {
    if (!user) return;

    Alert.alert(
      '添加好友',
      `确定要添�?${formatDisplayName(user.nickname, user.username)} 为好友吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await chatService.sendFriendRequest(user.id);
              Alert.alert('成功', '好友请求已发�?);
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '发送请求失�?);
            }
          },
        },
      ]
    );
  }, [user]);

  // 删除好友
  const handleDeleteFriend = useCallback(() => {
    if (!user || !friendRelation) return;

    Alert.alert(
      '删除好友',
      `确定要删�?${formatDisplayName(user.nickname, user.username)} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteFriend(friendRelation.id);
              Alert.alert('成功', '已删除好�?);
              setFriendRelation(null);
              checkFriendStatus();
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '删除失败');
            }
          },
        },
      ]
    );
  }, [user, friendRelation, checkFriendStatus]);

  // 拉黑用户
  const handleBlockUser = useCallback(() => {
    if (!user) return;

    Alert.alert(
      '拉黑用户',
      `确定要拉�?${formatDisplayName(user.nickname, user.username)} 吗？拉黑后将不会收到对方的消息。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.blockUser(user.id);
              Alert.alert('成功', '已拉黑用�?);
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
            }
          },
        },
      ]
    );
  }, [user]);

  // 发起聊天
  const handleStartChat = useCallback(async () => {
    if (!user || !currentUser) return;

    try {
      const response = await chatService.createSingleConversation(user.id);
      if (response.success && response.data) {
        navigation.replace('Chat', { conversationId: response.data.id });
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '创建聊天失败');
    }
  }, [user, currentUser, navigation]);

  useEffect(() => {
    loadUserProfile();
    checkFriendStatus();
  }, [loadUserProfile, checkFriendStatus]);

  const displayName = user ? formatDisplayName(user.nickname, user.username) : '加载�?..';
  const isFriend = !!friendRelation;
  const isOwnProfile = currentUser?.id === userId;

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载�?..</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>详细资料</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
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
            {user.status && (
              <Text style={styles.userStatus}>
                {user.status === 'online' ? '在线' : '离线'}
              </Text>
            )}
          </View>
        </View>

        {/* 个性签�?*/}
        {user.bio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* 操作按钮区域 */}
        <View style={styles.actionsSection}>
          {!isOwnProfile && (
            <>
              {/* 发起聊天按钮 */}
              {isFriend && (
                <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleStartChat}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
                  <Text style={styles.actionButtonPrimaryText}>发消�?/Text>
                </TouchableOpacity>
              )}

              {/* 添加好友按钮 */}
              {!isFriend && (
                <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddFriend}>
                  <Ionicons name="person-add-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
                  <Text style={styles.actionButtonPrimaryText}>添加好友</Text>
                </TouchableOpacity>
              )}

              {/* 删除好友按钮 */}
              {isFriend && (
                <TouchableOpacity style={styles.actionButton} onPress={handleDeleteFriend}>
                  <Ionicons name="person-remove-outline" size={20} color={COLORS.error} style={styles.actionButtonIcon} />
                  <Text style={styles.actionButtonDangerText}>删除好友</Text>
                </TouchableOpacity>
              )}

              {/* 拉黑按钮 */}
              <TouchableOpacity style={styles.actionButton} onPress={handleBlockUser}>
                <Ionicons name="ban-outline" size={20} color={COLORS.error} style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonDangerText}>拉黑</Text>
              </TouchableOpacity>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
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
  userStatus: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bioCard: {
    backgroundColor: COLORS.dark.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  bioText: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 22,
  },
  actionsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonIcon: {
    marginRight: SPACING.xs,
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionButtonDangerText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
