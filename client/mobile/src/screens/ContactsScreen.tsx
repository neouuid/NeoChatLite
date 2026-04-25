// 联系人页面
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import type { User, Friend, RootStackParamList } from 'neochat-shared/src/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TabType = 'friends' | 'requests' | 'blocked';

type ContactsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
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
        setSearchResults(response.data.items);
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
      `确定要添加${formatDisplayName(targetUser.nickname, targetUser.username)} 为好友吗？`,
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

  // 删除好友
  const handleDeleteFriend = useCallback((friend: Friend) => {
    const targetUser = friend.friend;
    if (!targetUser) return;

    Alert.alert(
      '删除好友',
      `确定要删除${formatDisplayName(targetUser.nickname, targetUser.username)} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteFriend(friend.id);
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

  // 接受好友请求
  const handleAcceptRequest = useCallback((requestId: string) => {
    Alert.alert(
      '接受请求',
      '确定要接受这个好友请求吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await chatService.acceptFriendRequest(requestId);
              Alert.alert('成功', '已添加好友');
              loadFriends();
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
            }
          },
        },
      ]
    );
  }, [loadFriends]);

  // 拒绝好友请求
  const handleRejectRequest = useCallback((requestId: string) => {
    Alert.alert(
      '拒绝请求',
      '确定要拒绝这个好友请求吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.rejectFriendRequest(requestId);
              Alert.alert('成功', '已拒绝请求');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
            }
          },
        },
      ]
    );
  }, []);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    }
  }, [activeTab, loadFriends]);

  // 渲染好友项
  const renderFriendItem = (friend: Friend) => {
    const friendUser = friend.friend;
    if (!friendUser) return null;

    return (
      <TouchableOpacity
        key={friend.id}
        style={styles.contactItem}
        onPress={() => {
          navigation.navigate('ViewProfile', { userId: friendUser.id });
        }}
      >
        <Avatar
          uri={friendUser.avatar}
          nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
          size="md"
          style={styles.contactAvatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {formatDisplayName(friendUser.nickname, friendUser.username)}
          </Text>
          {friendUser.status && (
            <Text style={styles.contactStatus}>
              {friendUser.status === 'online' ? '在线' : '离线'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.contactAction}
          onPress={() => handleDeleteFriend(friend)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.dark.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // 渲染搜索结果项
  const renderSearchResultItem = (searchUser: User) => {
    const isFriend = friends.some((f) => f.friend?.id === searchUser.id);

    return (
      <TouchableOpacity
        key={searchUser.id}
        style={styles.contactItem}
        onPress={() => {
          navigation.navigate('ViewProfile', { userId: searchUser.id });
        }}
      >
        <Avatar
          uri={searchUser.avatar}
          nickname={formatDisplayName(searchUser.nickname, searchUser.username)}
          size="md"
          style={styles.contactAvatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {formatDisplayName(searchUser.nickname, searchUser.username)}
          </Text>
        </View>
        {!isFriend && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddFriend(searchUser)}
          >
            <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {isFriend && (
          <Text style={styles.alreadyFriendText}>已添加</Text>
        )}
      </TouchableOpacity>
    );
  };

  const tabs = [
    { key: 'friends' as const, label: '好友' },
    { key: 'requests' as const, label: '新的朋友' },
    { key: 'blocked' as const, label: '黑名单' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 搜索栏 */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.dark.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索用户"
            placeholderTextColor={COLORS.dark.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {searchQuery.trim() ? (
        /* 搜索结果 */
        <ScrollView style={styles.scrollView}>
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>搜索结果</Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>未找到相关用户</Text>
              </View>
            ) : (
              searchResults.map(renderSearchResultItem)
            )}
          </View>
        </ScrollView>
      ) : (
        <>
          {/* 标签栏 */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.tabActive,
                ]}
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
              </TouchableOpacity>
            ))}
          </View>

          {/* 内容 */}
          <ScrollView style={styles.scrollView}>
            {activeTab === 'friends' && (
              <View style={styles.contentSection}>
                {friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={COLORS.dark.text.tertiary} />
                    <Text style={styles.emptyTitle}>还没有好友</Text>
                    <Text style={styles.emptySubtext}>搜索用户并添加好友吧</Text>
                  </View>
                ) : (
                  friends.map(renderFriendItem)
                )}
              </View>
            )}

            {activeTab === 'requests' && (
              <View style={styles.contentSection}>
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={48} color={COLORS.dark.text.tertiary} />
                  <Text style={styles.emptyTitle}>暂无好友请求</Text>
                </View>
              </View>
            )}

            {activeTab === 'blocked' && (
              <View style={styles.contentSection}>
                <View style={styles.emptyState}>
                  <Ionicons name="close-circle-outline" size={48} color={COLORS.dark.text.tertiary} />
                  <Text style={styles.emptyTitle}>黑名单为空</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  contentSection: {
    paddingVertical: SPACING.xs,
  },
  resultsSection: {
    paddingVertical: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  contactAvatar: {
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  contactStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  contactAction: {
    padding: SPACING.sm,
  },
  addButton: {
    padding: SPACING.sm,
  },
  alreadyFriendText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
