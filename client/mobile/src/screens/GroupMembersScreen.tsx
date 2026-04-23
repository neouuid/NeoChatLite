// 群成员列表页�?
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  type ConversationMember,
  type User,
  useChatStore,
  useAuthStore,
  ChatService,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';

type GroupMembersScreenRouteProp = {
  params: {
    conversationId: string;
  };
};

export const GroupMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GroupMembersScreenRouteProp>();
  const { conversationId } = route.params;
  const { conversations, removeMemberFromConversation, updateMemberRoleInConversation } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const [searchText, setSearchText] = useState('');

  // �?store 中获取会话数�?  const conversation = useMemo(() =>
    conversations.find(c => c.id === conversationId),
    [conversations, conversationId]
  );

  // 从会话成员中提取用户信息，并添加角色
  const members = useMemo((): (ConversationMember & { user: User; role: 'owner' | 'admin' | 'member' })[] => {
    if (!conversation?.members) return [];
    return conversation.members.map((m, index) => ({
      id: m.id || `${conversationId}-${m.user_id}`,
      conversation_id: conversationId,
      user_id: m.user_id,
      role: index === 0 ? 'owner' : index < 3 ? 'admin' : 'member',
      joined_at: m.joined_at || new Date().toISOString(),
      unread_count: m.unread_count || 0,
      muted: m.muted || false,
      user: m.user || {
        id: m.user_id,
        username: 'unknown',
        nickname: '未知用户',
        status: 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));
  }, [conversation, conversationId]);

  // 当前用户角色 - 根据在成员列表中的位置推�?  const currentUserRole = useMemo((): 'owner' | 'admin' | 'member' => {
    if (!currentUser || !conversation?.members) return 'member';
    const currentMemberIndex = conversation.members.findIndex(
      m => m.user_id === currentUser.id
    );
    if (currentMemberIndex === 0) return 'owner';
    if (currentMemberIndex < 3) return 'admin';
    return 'member';
  }, [currentUser, conversation]);

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
        return COLORS.warning;
      case 'admin':
        return COLORS.primary;
      default:
        return COLORS.dark.text.tertiary;
    }
  };

  // 检查是否可以管理成�?  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // 检查是否可以移除成�?  const canRemoveMember = (member: typeof members[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    if (currentUserRole === 'admin') {
      return member.role === 'member';
    }
    return false;
  };

  // 检查是否可以修改角�?  const canChangeRole = (member: typeof members[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    return false;
  };

  // 显示成员操作菜单
  const showMemberActions = useCallback((member: typeof members[0]) => {
    const actions = [];

    // 查看资料
    actions.push({
      title: '查看资料',
      onPress: () => handleViewProfile(member.user),
    });

    // 角色管理
    if (canChangeRole(member)) {
      if (member.role === 'member') {
        actions.push({
          title: '设为管理�?,
          onPress: () => handleSetAdmin(member),
        });
      } else if (member.role === 'admin') {
        actions.push({
          title: '取消管理�?,
          onPress: () => handleRemoveAdmin(member),
        });
      }
    }

    // 移除成员
    if (canRemoveMember(member)) {
      actions.push({
        title: '移除成员',
        style: 'destructive' as const,
        onPress: () => handleRemoveMember(member),
      });
    }

    actions.push({ title: '取消', style: 'cancel' as const });

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: actions.map((a) => a.title),
          cancelButtonIndex: actions.findIndex((a) => a.style === 'cancel'),
          destructiveButtonIndex: actions.findIndex((a) => a.style === 'destructive'),
        },
        (buttonIndex) => {
          if (buttonIndex !== undefined && actions[buttonIndex]?.style !== 'cancel') {
            actions[buttonIndex]?.onPress();
          }
        }
      );
    } else {
      // Android: 使用 Alert
      const options = actions.filter((a) => a.style !== 'cancel');
      Alert.alert(
        formatDisplayName(member.user.nickname, member.user.username),
        '',
        [
          ...options.map((opt) => ({
            text: opt.title,
            style: opt.style,
            onPress: opt.onPress,
          })),
          { text: '取消', style: 'cancel' },
        ]
      );
    }
  }, [canChangeRole, canRemoveMember]);

  // 查看用户资料
  const handleViewProfile = useCallback((user: User) => {
    navigation.navigate('ViewProfile' as never, { userId: user.id } as never);
  }, [navigation]);

  // 设为管理�?  const handleSetAdmin = useCallback((member: typeof members[0]) => {
    Alert.alert(
      '设为管理�?,
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 设为管理员吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const result = await ChatService.updateMemberRole(conversationId, member.user_id, 'admin');
            if (result.success) {
              updateMemberRoleInConversation(conversationId, member.user_id, 'admin');
              Alert.alert('成功', '已设为管理员');
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [conversationId, updateMemberRoleInConversation]);

  // 取消管理�?  const handleRemoveAdmin = useCallback((member: typeof members[0]) => {
    Alert.alert(
      '取消管理�?,
      `确定要取�?${formatDisplayName(member.user.nickname, member.user.username)} 的管理员资格吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const result = await ChatService.updateMemberRole(conversationId, member.user_id, 'member');
            if (result.success) {
              updateMemberRoleInConversation(conversationId, member.user_id, 'member');
              Alert.alert('成功', '已取消管理员');
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [conversationId, updateMemberRoleInConversation]);

  // 移除成员
  const handleRemoveMember = useCallback((member: typeof members[0]) => {
    Alert.alert(
      '移除成员',
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 移出群组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            const result = await ChatService.removeGroupMember(conversationId, member.user_id);
            if (result.success) {
              removeMemberFromConversation(conversationId, member.user_id);
              Alert.alert('成功', '已移除成�?);
            } else {
              Alert.alert('失败', result.message || '操作失败');
            }
          },
        },
      ]
    );
  }, [conversationId, removeMemberFromConversation]);

  // 添加成员
  const handleAddMembers = useCallback(() => {
    navigation.navigate('AddGroupMembers' as never, { conversationId } as never);
  }, [navigation, conversationId]);

  // 渲染成员�?  const renderMemberItem = useCallback(({ item }: { item: typeof members[0] }) => {
    const roleLabel = getRoleLabel(item.role);
    const roleColor = getRoleColor(item.role);

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => handleViewProfile(item.user)}
        onLongPress={() => (canManage ? showMemberActions(item) : undefined)}
        delayLongPress={500}
      >
        <Avatar
          uri={item.user.avatar}
          nickname={formatDisplayName(item.user.nickname, item.user.username)}
          size="md"
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {formatDisplayName(item.user.nickname, item.user.username)}
          </Text>
          <Text style={styles.memberStatus}>
            {item.user.status === 'online' ? '在线' : item.user.status === 'away' ? '离开' : '离线'}
          </Text>
        </View>
        <View style={styles.memberRight}>
          {roleLabel ? (
            <View style={[styles.roleTag, { backgroundColor: `${roleColor}20` }]}>
              <Text style={[styles.roleTagText, { color: roleColor }]}>
                {roleLabel}
              </Text>
            </View>
          ) : null}
          {canManage && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => showMemberActions(item)}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [canManage, showMemberActions, handleViewProfile]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>群成�?({members.length})</Text>
        {canManage ? (
          <TouchableOpacity style={styles.addButton} onPress={handleAddMembers}>
            <Ionicons name="person-add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* 成员列表 */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
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
  addButton: {
    padding: SPACING.xs,
  },
  headerRight: {
    width: 40,
  },
  list: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  memberAvatar: {
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  memberStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  roleTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleTagText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 48 + SPACING.md,
  },
});
