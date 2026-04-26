// 桌面端查看他人资料页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
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
import type { User, Friend, RootStackParamList } from 'neochat-shared/src/types';

export const ViewProfileWindow: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ViewProfile'>>();
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [friendRelation, setFriendRelation] = useState<Friend | null>(null);

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
      `确定要添加 ${formatDisplayName(user.nickname, user.username)} 为好友吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await chatService.sendFriendRequest(user.id);
              Alert.alert('成功', '好友请求已发送');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '发送请求失败');
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
      `确定要删除 ${formatDisplayName(user.nickname, user.username)} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteFriend(friendRelation.id);
              Alert.alert('成功', '已删除好友');
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

  // 发起聊天
  const handleStartChat = useCallback(async () => {
    if (!user || !currentUser) return;

    try {
      const response = await chatService.createSingleConversation(user.id);
      if (response.success && response.data) {
        navigation.navigate('Chat', { conversationId: response.data.id });
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '创建聊天失败');
    }
  }, [user, currentUser, navigation]);

  useEffect(() => {
    loadUserProfile();
    checkFriendStatus();
  }, [loadUserProfile, checkFriendStatus]);

  const displayName = user ? formatDisplayName(user.nickname, user.username) : '加载中...';
  const isFriend = !!friendRelation;
  const isOwnProfile = currentUser?.id === userId;

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#1D2129" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>个人资料</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#1D2129" />
          </TouchableOpacity>
        </View>

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
            <Text style={styles.userUsername}>ID: {user.id}</Text>
          </View>
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              {isFriend ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleStartChat}>
                  <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>发消息</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddFriend}>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>添加好友</Text>
                </TouchableOpacity>
              )}
              {isFriend && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleDeleteFriend}>
                  <Ionicons name="person-remove-outline" size={18} color="#1D2129" />
                  <Text style={styles.secondaryButtonText}>删除好友</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 详细信息 */}
        <View style={styles.infoCard}>
          {/* 个性签名 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>个性签名</Text>
            <Text style={styles.sectionValue}>
              {user.bio || '这个人很懒，什么都没写~'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* 详细信息列表 */}
          <View style={styles.detailSection}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>用户名</Text>
              <Text style={styles.detailValue}>@{user.username}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>昵称</Text>
              <Text style={styles.detailValue}>{user.nickname || displayName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>状态</Text>
              <Text style={[styles.detailValue, user.status === 'online' && styles.onlineStatus]}>
                {user.status === 'online' ? '在线' : '离线'}
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    marginTop: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 32,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: SPACING.lg,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: BORDER_RADIUS.md,
    height: 44,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: BORDER_RADIUS.md,
    height: 44,
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 24,
    marginTop: SPACING.lg,
  },
  infoSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sectionValue: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginVertical: 20,
  },
  detailSection: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  detailValue: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  onlineStatus: {
    color: '#10b981',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
