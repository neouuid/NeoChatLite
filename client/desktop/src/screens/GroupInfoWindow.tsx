// 桌面端群组信息页�?

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

interface GroupInfoWindowProps {
  groupId: string;
  conversationId?: string;
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const GroupInfoWindow: React.FC<GroupInfoWindowProps> = ({
  groupId,
  conversationId,
  onBack,
  onNavigate,
}) => {
  const { conversations, removeConversation } = useChatStore();

  const [muted, setMuted] = useState(false);
  const [stickToTop, setStickToTop] = useState(false);

  // �?store 中获取会话数�?
  const conversation = useMemo(() =>
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
    description: conversation?.description || '欢迎加入技术交流群！请大家文明发言，共同维护良好的交流环境�?,
    owner_id: '',
    member_count: conversation?.members?.length || 0,
    max_members: 200,
    created_at: conversation?.created_at || new Date().toISOString(),
  }), [conversation, groupId]);

  // 查看群组成员
  const handleViewAllMembers = () => {
    onNavigate?.('GroupMembers', { conversationId: conversationId || groupId });
  };

  // 添加成员
  const handleAddMembers = () => {
    onNavigate?.('AddGroupMembers', { conversationId: conversationId || groupId });
  };

  // 退出群�?
  const handleLeaveGroup = () => {
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
                { text: '确定', onPress: onBack },
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
    onNavigate?.('ViewProfile', { userId: member.id });
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

  // 渲染成员�?
  const renderMemberItem = ({ item }: { item: typeof members[0] }) => {
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

  // 渲染设置�?
  const renderSettingItem = (
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
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-left" size={20} color="#1D2129" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>群聊信息</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="more-vertical" size={20} color="#1D2129" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 群组基本信息 */}
        <View style={styles.infoCard}>
          <View style={styles.groupAvatar}>
            <Ionicons name="people" size={48} color="#ffffff" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{groupInfo.name}</Text>
            <Text style={styles.groupMeta}>
              {groupInfo.member_count} �?· 2 位管理员
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name="chatbubbles-outline" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 群组公告和成�?*/}
        <View style={styles.detailCard}>
          {/* 群组公告 */}
          <View style={styles.noticeSection}>
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeLabel}>群公�?/Text>
              <Ionicons name="chevron-forward" size={16} color="#86909C" />
            </View>
            <Text style={styles.noticeText}>{groupInfo.description}</Text>
          </View>

          <View style={styles.divider} />

          {/* 群成�?*/}
          <View style={styles.membersSection}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersLabel}>群成�?/Text>
              <TouchableOpacity style={styles.moreButton} onPress={handleViewAllMembers}>
                <Text style={styles.moreButtonText}>全部</Text>
                <Ionicons name="chevron-forward" size={16} color="#86909C" />
              </TouchableOpacity>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 32,
    marginHorizontal: 24,
    marginTop: SPACING.lg,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  groupMeta: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 24,
    marginHorizontal: 24,
    marginTop: SPACING.lg,
  },
  noticeSection: {
    gap: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeLabel: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  noticeText: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginVertical: 20,
  },
  membersSection: {
    gap: 12,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersLabel: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreButtonText: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  membersListCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  memberStatus: {
    color: '#86909C',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  roleTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
  },
  roleTagOwner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  roleTagText: {
    color: '#6366f1',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  roleTagTextOwner: {
    color: '#f59e0b',
  },
  memberSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 40 + SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  settingTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: SPACING.lg,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d2d44',
    padding: 2,
  },
  switchActive: {
    backgroundColor: 'rgba(91, 124, 255, 0.5)',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b8bb3',
  },
  switchThumbActive: {
    backgroundColor: '#5b7cff',
    transform: [{ translateX: 20 }],
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
