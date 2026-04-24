// 桌面端联系人页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
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

type TabType = 'friends' | 'requests' | 'blocked';

interface ContactsWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ContactsWindow: React.FC<ContactsWindowProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 加载好友列表
  const loadFriends = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await chatService.getFriends();
      if (response.success && response.data) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
      Alert.alert('错误', '加载好友列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 搜索用户
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await chatService.searchUsers(query);
      if (response.success && response.data) {
        setSearchResults(response.data.items || response.data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 添加好友
  const handleAddFriend = useCallback(async (targetUser: User) => {
    Alert.alert(
      '添加好友',
      `确定要添加 ${formatDisplayName(targetUser.nickname, targetUser.username)} 为好友吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await chatService.sendFriendRequest(targetUser.id);
              Alert.alert('成功', '好友请求已发送');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '发送请求失败');
            }
          },
        },
      ]
    );
  }, []);

  // 接受好友请求
  const handleAcceptFriend = useCallback(async (friendId: string) => {
    try {
      await chatService.acceptFriendRequest(friendId);
      Alert.alert('成功', '已添加好友');
      loadFriends();
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
    }
  }, [loadFriends]);

  // 拒绝好友请求
  const handleRejectFriend = useCallback(async (friendId: string) => {
    try {
      await chatService.rejectFriendRequest(friendId);
      Alert.alert('成功', '已拒绝');
      loadFriends();
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
    }
  }, [loadFriends]);

  // 删除好友
  const handleDeleteFriend = useCallback(async (friendId: string) => {
    Alert.alert(
      '删除好友',
      '确定要删除这个好友吗?',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteFriend(friendId);
              Alert.alert('成功', '已删除好友');
              loadFriends();
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '删除失败');
            }
          },
        },
      ]
    );
  }, [loadFriends]);

  // 查看用户资料
  const handleViewProfile = useCallback((userId: string) => {
    onNavigate?.('ViewProfile', { userId });
  }, [onNavigate]);

  // 发起聊天
  const handleStartChat = useCallback(async (userId: string) => {
    try {
      const response = await chatService.createSingleConversation(userId);
      if (response.success && response.data) {
        onNavigate?.('Chat', { conversationId: response.data.id });
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '创建聊天失败');
    }
  }, [onNavigate]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const tabs = [
    { key: 'friends' as const, label: '好友' },
    { key: 'requests' as const, label: '新的朋友' },
    { key: 'blocked' as const, label: '黑名单' },
  ];

  const filteredFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending');
  const blockedUsers = friends.filter(f => f.status === 'blocked');

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通讯录</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="person-add-outline" size={20} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8080a0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索手机号/用户名/昵称"
            placeholderTextColor="#8080a0"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#8080a0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 标签栏 */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 搜索结果视图 */}
      {searchQuery.trim() ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>搜索结果</Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#8080a0" />
                <Text style={styles.emptyTitle}>未找到相关用户</Text>
              </View>
            ) : (
              searchResults.map((resultUser) => {
                const isFriend = filteredFriends.some(f => f.friend?.id === resultUser.id);
                return (
                  <View key={resultUser.id} style={styles.searchResultItem}>
                    <TouchableOpacity
                      style={styles.userInfoContainer}
                      onPress={() => handleViewProfile(resultUser.id)}
                    >
                      <Avatar
                        uri={resultUser.avatar}
                        nickname={formatDisplayName(resultUser.nickname, resultUser.username)}
                        size="md"
                        style={styles.avatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {formatDisplayName(resultUser.nickname, resultUser.username)}
                        </Text>
                        {resultUser.username && (
                          <Text style={styles.userUsername}>@{resultUser.username}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    {!isFriend ? (
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={() => handleAddFriend(resultUser)}
                      >
                        <Text style={styles.addFriendText}>添加</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.alreadyFriend}>
                        <Text style={styles.alreadyFriendText}>已添加</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      ) : (
        /* 标签内容视图 */
        <ScrollView style={styles.scrollView}>
          {activeTab === 'friends' && (
            <View style={styles.friendsContainer}>
              {filteredFriends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="#8080a0" />
                  <Text style={styles.emptyTitle}>还没有好友</Text>
                  <Text style={styles.emptySubtext}>搜索添加好友</Text>
                </View>
              ) : (
                filteredFriends.map((friend) => {
                  const friendUser = friend.friend;
                  if (!friendUser) return null;

                  return (
                    <View key={friend.id} style={styles.friendItem}>
                      <TouchableOpacity
                        style={styles.friendInfoContainer}
                        onPress={() => handleViewProfile(friendUser.id)}
                      >
                        <Avatar
                          uri={friendUser.avatar}
                          nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
                          size="md"
                          style={styles.avatar}
                        />
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>
                            {formatDisplayName(friendUser.nickname, friendUser.username)}
                          </Text>
                          {friendUser.status && (
                            <Text style={styles.friendStatus}>
                              {friendUser.status === 'online' ? '在线' : '离线'}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.friendActions}>
                        <TouchableOpacity
                          style={styles.chatButton}
                          onPress={() => handleStartChat(friendUser.id)}
                        >
                          <Ionicons name="chatbubbles-outline" size={18} color="#5b7cff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'requests' && (
            <View style={styles.requestsContainer}>
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={64} color="#8080a0" />
                  <Text style={styles.emptyTitle}>没有新的好友请求</Text>
                </View>
              ) : (
                pendingRequests.map((friend) => {
                  const friendUser = friend.friend;
                  if (!friendUser) return null;

                  return (
                    <View key={friend.id} style={styles.requestItem}>
                      <Avatar
                        uri={friendUser.avatar}
                        nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
                        size="md"
                        style={styles.avatar}
                      />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>
                          {formatDisplayName(friendUser.nickname, friendUser.username)}
                        </Text>
                        <Text style={styles.requestText}>请求添加你为好友</Text>
                      </View>
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectFriend(friend.id)}
                        >
                          <Text style={styles.rejectText}>拒绝</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptFriend(friend.id)}
                        >
                          <Text style={styles.acceptText}>接受</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'blocked' && (
            <View style={styles.blockedContainer}>
              {blockedUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="close-circle-outline" size={64} color="#8080a0" />
                  <Text style={styles.emptyTitle}>黑名单为空</Text>
                </View>
              ) : (
                blockedUsers.map((friend) => {
                  const friendUser = friend.friend;
                  if (!friendUser) return null;

                  return (
                    <View key={friend.id} style={styles.blockedItem}>
                      <Avatar
                        uri={friendUser.avatar}
                        nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
                        size="md"
                        style={styles.avatar}
                      />
                      <View style={styles.blockedInfo}>
                        <Text style={styles.blockedName}>
                          {formatDisplayName(friendUser.nickname, friendUser.username)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* 底部安全区域 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: '#5b7cff',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -20 }],
    width: 40,
    height: 3,
    backgroundColor: '#5b7cff',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  searchResultsContainer: {
    paddingTop: 16,
  },
  friendsContainer: {},
  requestsContainer: {},
  blockedContainer: {},
  sectionTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  userUsername: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  addFriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.md,
  },
  addFriendText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  alreadyFriend: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alreadyFriendText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  friendInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  friendStatus: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(91, 124, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  requestText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
  },
  rejectText: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.md,
  },
  acceptText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
