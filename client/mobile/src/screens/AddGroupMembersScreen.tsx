// 添加群成员页�?
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useAuthStore,
  chatService,
  type User,
  type Friend,
  type RootStackParamList,
} from 'neochat-shared';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';

type AddGroupMembersScreenRouteProp = {
  params: {
    conversationId: string;
  };
};

export const AddGroupMembersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddGroupMembers'>>();
  const { conversationId } = route.params;
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [friends, setFriends] = useState<(Friend & { friend: User })[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      // 并行加载好友列表和群组成�?      const [friendsRes, membersRes] = await Promise.all([
        chatService.getFriends(),
        chatService.getGroupMembers(conversationId),
      ]);

      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data as any);
      }
      if (membersRes.success && membersRes.data) {
        const memberIds = new Set<string>(membersRes.data.map((m: any) => (m.user_id || m.id) as string));
        setExistingMemberIds(memberIds);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, conversationId]);

  // 重试加载
  const handleRetry = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 过滤好友列表
  const filteredFriends = friends.filter((f) => {
    const matchesSearch = searchText.trim()
      ? f.friend.nickname.toLowerCase().includes(searchText.toLowerCase()) ||
        f.friend.username.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchesSearch;
  });

  // 切换选择
  const toggleSelect = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // 全�?取消全�?  const toggleSelectAll = useCallback(() => {
    const availableIds = filteredFriends
      .filter((f) => !existingMemberIds.has(f.friend.id))
      .map((f) => f.friend.id);

    if (selectedIds.size === availableIds.length) {
      // 取消全�?      setSelectedIds(new Set());
    } else {
      // 全�?      setSelectedIds(new Set(availableIds));
    }
  }, [filteredFriends, selectedIds]);

  // 确认添加
  const handleConfirmAdd = useCallback(async () => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert(
      '添加成员',
      `确定要添�?${selectedIds.size} 位成员到群组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            setIsAdding(true);
            try {
              // 逐个添加成员
              const userIds = Array.from(selectedIds);
              let successCount = 0;

              for (const userId of userIds) {
                const response = await chatService.addGroupMember(conversationId, userId);
                if (response.success) {
                  successCount++;
                }
              }

              if (successCount > 0) {
                Alert.alert('添加成功', `已添�?${successCount} 位成员`, [
                  { text: '确定', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('添加失败', '添加成员时出�?);
              }
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '添加失败');
            } finally {
              setIsAdding(false);
            }
          },
        },
      ]
    );
  }, [selectedIds, navigation, conversationId]);

  // 渲染好友�?  const renderFriendItem = useCallback(({ item }: { item: Friend & { friend: User } }) => {
    const user = item.friend;
    const isSelected = selectedIds.has(user.id);
    const isInGroup = existingMemberIds.has(user.id);

    return (
      <TouchableOpacity
        style={[styles.friendItem, isInGroup && styles.friendItemDisabled]}
        onPress={() => !isInGroup && toggleSelect(user.id)}
        disabled={isInGroup}
      >
        <View style={styles.friendLeft}>
          {isInGroup ? (
            <View style={styles.checkboxDisabled}>
              <Ionicons name="checkmark" size={16} color={COLORS.dark.text.tertiary} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => toggleSelect(user.id)}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          )}
          <Avatar
            uri={user.avatar}
            nickname={formatDisplayName(user.nickname, user.username)}
            size="md"
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName} numberOfLines={1}>
              {formatDisplayName(user.nickname, user.username)}
            </Text>
            {isInGroup ? (
              <Text style={styles.inGroupText}>已在群中</Text>
            ) : (
              <Text style={styles.friendStatus}>
                {user.status === 'online' ? '在线' : user.status === 'away' ? '离开' : '离线'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedIds, toggleSelect]);

  const availableCount = filteredFriends.filter((f) => !existingMemberIds.has(f.friend.id)).length;
  const canSelectAll = availableCount > 0;
  const isAllSelected = selectedIds.size === availableCount && availableCount > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加成员</Text>
          <View style={styles.confirmButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载�?..</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加成员</Text>
          <View style={styles.confirmButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>添加成员</Text>
        <TouchableOpacity
          style={[styles.confirmButton, (selectedIds.size === 0 || isAdding) && styles.confirmButtonDisabled]}
          onPress={handleConfirmAdd}
          disabled={selectedIds.size === 0 || isAdding}
        >
          <Text style={[styles.confirmButtonText, (selectedIds.size === 0 || isAdding) && styles.confirmButtonTextDisabled]}>
            {isAdding ? '添加�?..' : selectedIds.size > 0 ? `确定 (${selectedIds.size})` : '确定'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索�?*/}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.dark.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索好友"
            placeholderTextColor={COLORS.dark.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 全�?*/}
        {canSelectAll && (
          <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
              {isAllSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.selectAllText}>全�?/Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 好友列表 */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  confirmButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  confirmButtonTextDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  selectAllText: {
    marginLeft: SPACING.sm,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  list: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  friendItemDisabled: {
    opacity: 0.5,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.dark.text.tertiary,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkboxDisabled: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.dark.text.tertiary,
    backgroundColor: COLORS.dark.surface,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatar: {
    marginRight: SPACING.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  friendStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  inGroupText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 22 + SPACING.md + 48 + SPACING.md,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
