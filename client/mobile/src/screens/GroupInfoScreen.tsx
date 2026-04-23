// 群组信息页面

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useChatStore,
  ChatService,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User } from 'neochat-shared/src/types';

type GroupInfoScreenRouteProp = {
  params: {
    groupId: string;
    conversationId?: string;
  };
};

export const GroupInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GroupInfoScreenRouteProp>();
  const { groupId, conversationId } = route.params;
  const { conversations, removeConversation } = useChatStore();

  const [muted, setMuted] = useState(false);
  const [stickToTop, setStickToTop] = useState(false);

  // �?store 中获取会话数�?  const conversation = useMemo(() =>
    conversations.find(c => c.id === (conversationId || groupId)),
    [conversations, conversationId, groupId]
  );

  // 从会话成员中提取用户信息，并添加角色
  const members = useMemo((): (User & { role: 'owner' | 'admin' | 'member' })[] => {
    if (!conversation?.members) return [];
    return conversation.members.map((m, index) => ({
      ...(m.user || {
        id: m.user_id,
        username: 'unknown',
        nickname: '未知用户',
        status: 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      role: index === 0 ? 'owner' : index < 3 ? 'admin' : 'member',
    }));
  }, [conversation]);

  // 群组信息
  const groupInfo = useMemo(() => ({
    id: conversation?.id || groupId,
    name: conversation?.name || '群聊',
    description: '',
    owner_id: '',
    member_count: conversation?.members?.length || 0,
    max_members: 200,
    created_at: conversation?.created_at || new Date().toISOString(),
  }), [conversation, groupId]);

  // 查看群组成员
  const handleViewAllMembers = () => {
    navigation.navigate('GroupMembers' as never, { conversationId: conversationId || groupId } as never);
  };

  // 添加成员
  const handleAddMembers = () => {
    navigation.navigate('AddGroupMembers' as never, { conversationId: conversationId || groupId } as never);
  };

  // 退出群�?  const handleLeaveGroup = () => {
    Alert.alert(
      '退出群�?,
      '确定要退出该群组吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            const result = await ChatService.leaveGroup(conversationId || groupId);
            if (result.success) {
              removeConversation(conversationId || groupId);
              Alert.alert('已退�?, '您已退出该群组', [
                { text: '确定', onPress: () => navigation.popToTop() },
              ]);
            } else {
              Alert.alert('失败', result.message || '退出群组失�?);
            }
          },
        },
      ]
    );
  };

  // 查看成员资料
  const handleViewMemberProfile = (member: User) => {
    navigation.navigate('ViewProfile' as never, { userId: member.id } as never);
  };

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

  // 渲染成员�?  const renderMemberItem = ({ item }: { item: typeof members[0] }) => {
    const roleLabel = getRoleLabel(item.role);

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => handleViewMemberProfile(item)}
      >
        <Avatar
          uri={item.avatar}
          nickname={formatDisplayName(item.nickname, item.username)}
          size="md"
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {formatDisplayName(item.nickname, item.username)}
          </Text>
          {item.status && (
            <Text style={styles.memberStatus}>
              {item.status === 'online' ? '在线' : item.status === 'away' ? '离开' : '离线'}
            </Text>
          )}
        </View>
        {roleLabel ? (
          <View style={[styles.roleTag, item.role === 'owner' && styles.roleTagOwner]}>
            <Text style={[styles.roleTagText, item.role === 'owner' && styles.roleTagTextOwner]}>
              {roleLabel}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // 渲染设置�?  const renderSettingItem = (
    title: string,
    value: boolean,
    onToggle: (v: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingTitle}>{title}</Text>
      <TouchableOpacity onPress={() => onToggle(!value)}>
        <View
          style={[
            styles.switch,
            value && styles.switchActive,
          ]}
        >
          <View
            style={[
              styles.switchThumb,
              value && styles.switchThumbActive,
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>群聊信息</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 群组基本信息 */}
        <View style={styles.infoSection}>
          <View style={styles.groupAvatar}>
            <Ionicons name="people" size={48} color={COLORS.dark.text.secondary} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{groupInfo.name}</Text>
            {group.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {groupInfo.description}
              </Text>
            )}
          </View>
        </View>

        {/* 群成�?*/}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>群成�?({groupInfo.member_count})</Text>
            <TouchableOpacity style={styles.moreButton} onPress={handleViewAllMembers}>
              <Text style={styles.moreButtonText}>全部</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.membersList}>
            <TouchableOpacity style={styles.addMemberButton} onPress={handleAddMembers}>
              <View style={styles.addMemberIcon}>
                <Ionicons name="person-add-outline" size={24} color={COLORS.dark.text.secondary} />
              </View>
            </TouchableOpacity>
            <FlatList
              data={members.slice(0, 8)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberAvatarItem}
                  onPress={() => handleViewMemberProfile(item)}
                >
                  <Avatar
                    uri={item.avatar}
                    nickname={formatDisplayName(item.nickname, item.username)}
                    size="md"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
          </View>
        </View>

        {/* 群设�?*/}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            {renderSettingItem('消息免打�?, muted, setMuted)}
            <View style={styles.settingDivider} />
            {renderSettingItem('置顶聊天', stickToTop, setStickToTop)}
          </View>
        </View>

        {/* 群成员列�?*/}
        <View style={styles.membersListSection}>
          <Text style={styles.sectionTitle}>群成�?/Text>
          <View style={styles.membersListCard}>
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.memberSeparator} />}
            />
          </View>
        </View>

        {/* 退出群�?*/}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.leaveButtonText}>退出群�?/Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  groupAvatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  groupDescription: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  membersSection: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  moreButtonText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  membersList: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  addMemberButton: {
    width: 48,
    height: 48,
  },
  addMemberIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarItem: {
    width: 48,
    height: 48,
  },
  settingsSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  settingsCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  settingTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.border,
    padding: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.dark.text.primary,
  },
  switchThumbActive: {
    backgroundColor: '#fff',
    transform: [{ translateX: 20 }],
  },
  membersListSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  membersListCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.sm,
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
  roleTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleTagOwner: {
    backgroundColor: `${COLORS.warning}20`,
  },
  roleTagText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  roleTagTextOwner: {
    color: COLORS.warning,
  },
  memberSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 48 + SPACING.md,
  },
  dangerSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  leaveButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
