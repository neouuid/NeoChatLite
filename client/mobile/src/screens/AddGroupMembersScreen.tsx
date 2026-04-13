// 添加群成员页面

import React, { useState, useCallback } from 'react';
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
  type User,
  type Friend,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';

type AddGroupMembersScreenRouteProp = {
  params: {
    conversationId: string;
  };
};

// Mock data - 实际应从 API 获取
const mockFriends: (Friend & { friend: User })[] = [
  {
    id: 'friend1',
    user_id: 'me',
    friend_id: 'friend_user1',
    status: 'accepted',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    friend: {
      id: 'friend_user1',
      username: 'alice',
      nickname: '爱丽丝',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'friend2',
    user_id: 'me',
    friend_id: 'friend_user2',
    status: 'accepted',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    friend: {
      id: 'friend_user2',
      username: 'bob',
      nickname: '鲍勃',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'friend3',
    user_id: 'me',
    friend_id: 'friend_user3',
    status: 'accepted',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    friend: {
      id: 'friend_user3',
      username: 'charlie',
      nickname: '查理',
      status: 'offline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'friend4',
    user_id: 'me',
    friend_id: 'friend_user4',
    status: 'accepted',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    friend: {
      id: 'friend_user4',
      username: 'david',
      nickname: '大卫',
      status: 'away',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'friend5',
    user_id: 'me',
    friend_id: 'friend_user5',
    status: 'accepted',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    friend: {
      id: 'friend_user5',
      username: 'eve',
      nickname: '伊芙',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

// 已在群中的成员 ID - 实际应从 API 获取
const existingMemberIds = new Set(['friend_user2']);

export const AddGroupMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AddGroupMembersScreenRouteProp>();
  const { conversationId } = route.params;

  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 过滤好友列表
  const filteredFriends = mockFriends.filter((f) => {
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

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    const availableIds = filteredFriends
      .filter((f) => !existingMemberIds.has(f.friend.id))
      .map((f) => f.friend.id);

    if (selectedIds.size === availableIds.length) {
      // 取消全选
      setSelectedIds(new Set());
    } else {
      // 全选
      setSelectedIds(new Set(availableIds));
    }
  }, [filteredFriends, selectedIds]);

  // 确认添加
  const handleConfirmAdd = useCallback(() => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert(
      '添加成员',
      `确定要添加 ${selectedIds.size} 位成员到群组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            // TODO: 调用 API 添加成员
            Alert.alert('添加成功', `已添加 ${selectedIds.size} 位成员`, [
              { text: '确定', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  }, [selectedIds, navigation]);

  // 渲染好友项
  const renderFriendItem = useCallback(({ item }: { item: typeof mockFriends[0] }) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加成员</Text>
        <TouchableOpacity
          style={[styles.confirmButton, selectedIds.size === 0 && styles.confirmButtonDisabled]}
          onPress={handleConfirmAdd}
          disabled={selectedIds.size === 0}
        >
          <Text style={[styles.confirmButtonText, selectedIds.size === 0 && styles.confirmButtonTextDisabled]}>
            {selectedIds.size > 0 ? `确定 (${selectedIds.size})` : '确定'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索框 */}
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

        {/* 全选 */}
        {canSelectAll && (
          <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
              {isAllSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
            <Text style={styles.selectAllText}>全选</Text>
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
});
