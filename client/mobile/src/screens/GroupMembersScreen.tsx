// 群成员列表页面

import React, { useState, useCallback } from 'react';
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
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';

type GroupMembersScreenRouteProp = {
  params: {
    conversationId: string;
  };
};

// Mock data - 实际应从 API 获取
const mockMembers: (ConversationMember & { user: User })[] = [
  {
    id: 'member1',
    conversation_id: 'conv1',
    user_id: 'user1',
    role: 'owner',
    joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user1',
      username: 'owner',
      nickname: '群主',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'member2',
    conversation_id: 'conv1',
    user_id: 'user2',
    role: 'admin',
    joined_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user2',
      username: 'admin1',
      nickname: '管理员1',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'member3',
    conversation_id: 'conv1',
    user_id: 'user3',
    role: 'admin',
    joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user3',
      username: 'admin2',
      nickname: '管理员2',
      status: 'offline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'member4',
    conversation_id: 'conv1',
    user_id: 'user4',
    role: 'member',
    joined_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user4',
      username: 'member1',
      nickname: '成员1',
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'member5',
    conversation_id: 'conv1',
    user_id: 'user5',
    role: 'member',
    joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user5',
      username: 'member2',
      nickname: '成员2',
      status: 'away',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'member6',
    conversation_id: 'conv1',
    user_id: 'user6',
    role: 'member',
    joined_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    muted: false,
    user: {
      id: 'user6',
      username: 'member3',
      nickname: '成员3',
      status: 'offline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

// 当前用户角色 - 实际应从 store 获取
const currentUserRole = 'owner';

export const GroupMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GroupMembersScreenRouteProp>();
  const { conversationId } = route.params;

  const [members, setMembers] = useState(mockMembers);
  const [searchText, setSearchText] = useState('');

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
        return '管理员';
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

  // 检查是否可以管理成员
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  // 检查是否可以移除成员
  const canRemoveMember = (member: typeof mockMembers[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    if (currentUserRole === 'admin') {
      return member.role === 'member';
    }
    return false;
  };

  // 检查是否可以修改角色
  const canChangeRole = (member: typeof mockMembers[0]) => {
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    return false;
  };

  // 显示成员操作菜单
  const showMemberActions = useCallback((member: typeof mockMembers[0]) => {
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
          title: '设为管理员',
          onPress: () => handleSetAdmin(member),
        });
      } else if (member.role === 'admin') {
        actions.push({
          title: '取消管理员',
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

  // 设为管理员
  const handleSetAdmin = useCallback((member: typeof mockMembers[0]) => {
    Alert.alert(
      '设为管理员',
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 设为管理员吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            setMembers((prev) =>
              prev.map((m) =>
                m.id === member.id ? { ...m, role: 'admin' } : m
              )
            );
          },
        },
      ]
    );
  }, []);

  // 取消管理员
  const handleRemoveAdmin = useCallback((member: typeof mockMembers[0]) => {
    Alert.alert(
      '取消管理员',
      `确定要取消 ${formatDisplayName(member.user.nickname, member.user.username)} 的管理员资格吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            setMembers((prev) =>
              prev.map((m) =>
                m.id === member.id ? { ...m, role: 'member' } : m
              )
            );
          },
        },
      ]
    );
  }, []);

  // 移除成员
  const handleRemoveMember = useCallback((member: typeof mockMembers[0]) => {
    Alert.alert(
      '移除成员',
      `确定要将 ${formatDisplayName(member.user.nickname, member.user.username)} 移出群组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: () => {
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          },
        },
      ]
    );
  }, []);

  // 添加成员
  const handleAddMembers = useCallback(() => {
    navigation.navigate('AddGroupMembers' as never, { conversationId } as never);
  }, [navigation, conversationId]);

  // 渲染成员项
  const renderMemberItem = useCallback(({ item }: { item: typeof mockMembers[0] }) => {
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
        <Text style={styles.headerTitle}>群成员 ({members.length})</Text>
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
