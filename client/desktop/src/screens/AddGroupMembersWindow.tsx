import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  formatDisplayName,
  type User,
  type Friend,
  useAuthStore,
  useChatStore,
  ChatService,
} from 'neochat-shared';

interface AddGroupMembersWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  conversationId?: string;
}

export const AddGroupMembersWindow: React.FC<AddGroupMembersWindowProps> = ({
  onBack,
  onNavigate,
  conversationId: propConversationId,
}) => {
  const { user: currentUser } = useAuthStore();
  const { conversations } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<(Friend & { friend: User })[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [friendsRes, membersRes] = await Promise.all([
        ChatService.getFriends(),
        propConversationId ? ChatService.getGroupMembers(propConversationId) : Promise.resolve({ success: true, data: [] }),
      ]);

      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data);
      }

      if (membersRes.success && membersRes.data) {
        const memberIds = new Set<string>(membersRes.data.map((m: any) => (m.user_id || m.id) as string));
        setExistingMemberIds(memberIds);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, propConversationId]);

  // 从 store 中获取会话数据
  const conversation = useCallback(() =>
    propConversationId ? conversations.find(c => c.id === propConversationId) : undefined,
  [conversations, propConversationId]);

  // 初始化数据
  useEffect(() => {
    // 如果 store 中已有会话成员，优先使用
    const conv = propConversationId ? conversations.find(c => c.id === propConversationId) : undefined;
    if (conv?.members) {
      const memberIds = new Set<string>(conv.members.map(m => m.user_id));
      setExistingMemberIds(memberIds);
    }

    loadData();
  }, [loadData, propConversationId, conversations]);

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
  const handleConfirmAdd = useCallback(async () => {
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
          onPress: async () => {
            setIsAdding(true);
            try {
              const convId = propConversationId || '1';
              // 逐个添加成员
              const userIds = Array.from(selectedIds);
              let successCount = 0;

              for (const userId of userIds) {
                const response = await ChatService.addGroupMember(convId, userId);
                if (response.success) {
                  successCount++;
                }
              }

              if (successCount > 0) {
                Alert.alert('添加成功', `已添加 ${successCount} 位成员`, [
                  { text: '确定', onPress: () => onBack?.() },
                ]);
              } else {
                Alert.alert('添加失败', '添加成员时出错');
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
  }, [selectedIds, propConversationId, onBack]);

  const availableCount = filteredFriends.filter((f) => !existingMemberIds.has(f.friend.id)).length;
  const canSelectAll = availableCount > 0;
  const isAllSelected = selectedIds.size === availableCount && availableCount > 0;

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1D2129" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加成员</Text>
        <TouchableOpacity
          style={[styles.confirmButton, (selectedIds.size === 0 || isAdding) && styles.confirmButtonDisabled]}
          onPress={handleConfirmAdd}
          disabled={selectedIds.size === 0 || isAdding}
        >
          <Text style={[styles.confirmButtonText, (selectedIds.size === 0 || isAdding) && styles.confirmButtonTextDisabled]}>
            {isAdding ? '添加中...' : selectedIds.size > 0 ? `确定 (${selectedIds.size})` : '确定'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#86909c" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索好友"
            placeholderTextColor="#86909c"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#86909c" />
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

      <ScrollView style={styles.scrollView}>
        {/* 好友列表 */}
        <View style={styles.section}>
          {filteredFriends.map((item) => {
            const user = item.friend;
            const isSelected = selectedIds.has(user.id);
            const isInGroup = existingMemberIds.has(user.id);
            const initials = formatDisplayName(user.nickname, user.username).substring(0, 1);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.friendItem, isInGroup && styles.friendItemDisabled]}
                onPress={() => !isInGroup && toggleSelect(user.id)}
                disabled={isInGroup}
              >
                <View style={styles.friendLeft}>
                  {isInGroup ? (
                    <View style={styles.checkboxDisabled}>
                      <Ionicons name="checkmark" size={16} color="#86909c" />
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
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{initials}</Text>
                  </View>
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
          })}
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
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#6366f1',
  },
  confirmButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  confirmButtonTextDisabled: {
    color: '#86909c',
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  selectAllText: {
    marginLeft: 8,
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
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
    borderColor: '#86909c',
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  checkboxDisabled: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: '#86909c',
    backgroundColor: '#F7F8FA',
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  friendAvatarText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  friendStatus: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 4,
  },
  inGroupText: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 4,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
