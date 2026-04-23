import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  type ConversationMember,
  type User,
  useChatStore,
  useAuthStore,
  ChatService,
} from 'neochat-shared';

interface GroupMembersWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  conversationId?: string;
}

export const GroupMembersWindow: React.FC<GroupMembersWindowProps> = ({
  onBack,
  onNavigate,
  conversationId: propConversationId,
}) => {
  const { conversations, removeMemberFromConversation, updateMemberRoleInConversation } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<(ConversationMember & { user: User; role: 'owner' | 'admin' | 'member' })[]>([]);

  // �?store 中获取会话数�?
  const conversation = useMemo(() =>
    propConversationId ? conversations.find(c => c.id === propConversationId) : undefined,
    [conversations, propConversationId]
  );

  // 加载成员数据
  const loadMembers = useCallback(async () => {
    if (!propConversationId) return;

    setIsLoading(true);
    try {
      const response = await ChatService.getGroupMembers(propConversationId);
      if (response.success && response.data) {
        // 将服务端数据转换为组件需要的格式
        const processedMembers = response.data.map((member, index) => ({
          ...member,
          role: index === 0 ? 'owner' : index < 3 ? 'admin' : 'member' as const,
        }));
        setMembers(processedMembers);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('错误', '加载成员列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [propConversationId]);

  // 如果 store 中已有会话成员，优先使用 store 数据
  useEffect(() => {
    if (conversation?.members && conversation.members.length > 0) {
      const processedMembers = conversation.members.map((member, index) => ({
        ...member,
        role: index === 0 ? 'owner' : index < 3 ? 'admin' : 'member' as const,
      }));
      setMembers(processedMembers);
    } else {
      loadMembers();
    }
  }, [conversation, loadMembers]);

  // 确定当前用户角色
  const currentUserRole = useMemo((): 'owner' | 'admin' | 'member' => {
    if (!currentUser) return 'member';
    const currentMember = members.find(m => m.user_id === currentUser.id);
    if (currentMember) return currentMember.role;
    return 'member';
  }, [members, currentUser]);

  // 过滤成员
  const filteredMembers = searchText.trim()
    ? members.filter((m) =>
        m.user.nickname.toLowerCase().includes(searchText.toLowerCase()) ||
        m.user.username.toLowerCase().includes(searchText.toLowerCase())
      )
    : members;

  // 获取角色标签
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return '群主';
      case 'admin':
        return '管理�?;
      default:
        return '';
    }
  };

  // 获取角色标签颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#f59e0b';
      case 'admin':
        return '#6366f1';
      default:
        return '#86909c';
    }
  };

  // 检查是否可以管理成�?
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // 检查是否可以移除成�?
  const canRemoveMember = (member: typeof members[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    if (currentUserRole === 'admin') {
      return member.role === 'member';
    }
    return false;
  };

  // 检查是否可以修改角�?
  const canChangeRole = (member: typeof members[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    return false;
  };

  // 查看用户资料
  const handleViewProfile = useCallback((user: User) => {
    onNavigate?.('ViewProfile', { userId: user.id });
  }, [onNavigate]);

  // 设为管理�?
  const handleSetAdmin = useCallback((member: typeof members[0]) => {
    const convId = propConversationId || '1';
    Alert.alert(
      '设为管理�?,
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 设为管理员吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const result = await ChatService.updateMemberRole(convId, member.user_id, 'admin');
            if (result.success) {
              updateMemberRoleInConversation(convId, member.user_id, 'admin');
              Alert.alert('成功', '已设为管理员');
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [propConversationId, updateMemberRoleInConversation]);

  // 取消管理�?
  const handleRemoveAdmin = useCallback((member: typeof members[0]) => {
    const convId = propConversationId || '1';
    Alert.alert(
      '取消管理�?,
      `确定要取�?${formatDisplayName(member.user.nickname, member.user.username)} 的管理员资格吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const result = await ChatService.updateMemberRole(convId, member.user_id, 'member');
            if (result.success) {
              updateMemberRoleInConversation(convId, member.user_id, 'member');
              Alert.alert('成功', '已取消管理员');
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [propConversationId, updateMemberRoleInConversation]);

  // 移除成员
  const handleRemoveMember = useCallback((member: typeof members[0]) => {
    const convId = propConversationId || '1';
    Alert.alert(
      '移除成员',
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 移出群组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            const result = await ChatService.removeGroupMember(convId, member.user_id);
            if (result.success) {
              removeMemberFromConversation(convId, member.user_id);
              Alert.alert('成功', '已移除成�?);
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [propConversationId, removeMemberFromConversation]);

  // 显示成员操作菜单
  const showMemberActions = useCallback((member: typeof members[0]) => {
    const buttons = [];

    // 查看资料
    buttons.push({
      text: '查看资料',
      onPress: () => handleViewProfile(member.user),
    });

    // 角色管理
    if (canChangeRole(member)) {
      if (member.role === 'member') {
        buttons.push({
          text: '设为管理�?,
          onPress: () => handleSetAdmin(member),
        });
      } else if (member.role === 'admin') {
        buttons.push({
          text: '取消管理�?,
          onPress: () => handleRemoveAdmin(member),
        });
      }
    }

    // 移除成员
    if (canRemoveMember(member)) {
      buttons.push({
        text: '移除成员',
        style: 'destructive' as const,
        onPress: () => handleRemoveMember(member),
      });
    }

    Alert.alert(
      formatDisplayName(member.user.nickname, member.user.username),
      '',
      [
        ...buttons,
        { text: '取消', style: 'cancel' },
      ]
    );
  }, [canChangeRole, canRemoveMember, handleViewProfile, handleSetAdmin, handleRemoveAdmin, handleRemoveMember]);

  // 添加成员
  const handleAddMembers = useCallback(() => {
    onNavigate?.('AddGroupMembers', { conversationId: propConversationId || '1' });
  }, [onNavigate, propConversationId]);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1D2129" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>群成�?({members.length})</Text>
        {canManage ? (
          <TouchableOpacity style={styles.addButton} onPress={handleAddMembers}>
            <Ionicons name="person-add" size={20} color="#6366f1" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* 搜索�?*/}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#86909c" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索成员"
            placeholderTextColor="#86909c"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 成员列表 */}
        <View style={styles.section}>
          {filteredMembers.map((item, index) => {
            const roleLabel = getRoleLabel(item.role);
            const roleColor = getRoleColor(item.role);
            const initials = formatDisplayName(item.user.nickname, item.user.username).substring(0, 1);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.memberItem}
                onPress={() => handleViewProfile(item.user)}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{initials}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {formatDisplayName(item.user.nickname, item.user.username)}
                    </Text>
                    {roleLabel ? (
                      <View style={[styles.roleTag, { backgroundColor: `${roleColor}20` }]}>
                        <Text style={[styles.roleTagText, { color: roleColor }]}>
                          {roleLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberStatus}>
                    {item.user.status === 'online' ? '在线' : item.user.status === 'away' ? '离开' : '离线'}
                  </Text>
                </View>
                {canManage && (
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => showMemberActions(item)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#86909c" />
                  </TouchableOpacity>
                )}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#1D2129',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  memberStatus: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 4,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleTagText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreButton: {
    padding: 8,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
