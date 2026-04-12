// 群组信息页面

import React, { useState } from 'react';
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
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';
import type { User } from '@neochat/shared/src/types';

type GroupInfoScreenRouteProp = {
  params: {
    groupId: string;
  };
};

// Mock data
const mockGroup = {
  id: 'group1',
  name: '开发讨论组',
  description: '这是一个用于讨论开发的群组',
  owner_id: 'user1',
  member_count: 12,
  max_members: 200,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockMembers: (User & { role: 'owner' | 'admin' | 'member' })[] = [
  {
    id: 'user1',
    username: 'owner',
    nickname: '群主',
    status: 'online',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'owner',
  },
  {
    id: 'user2',
    username: 'admin1',
    nickname: '管理员1',
    status: 'online',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'admin',
  },
  {
    id: 'user3',
    username: 'admin2',
    nickname: '管理员2',
    status: 'offline',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'admin',
  },
  {
    id: 'user4',
    username: 'member1',
    nickname: '成员1',
    status: 'online',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'member',
  },
  {
    id: 'user5',
    username: 'member2',
    nickname: '成员2',
    status: 'away',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'member',
  },
];

export const GroupInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GroupInfoScreenRouteProp>();
  const { groupId } = route.params;

  const [muted, setMuted] = useState(false);
  const [stickToTop, setStickToTop] = useState(false);

  const group = mockGroup;
  const members = mockMembers;

  // 查看群组成员
  const handleViewAllMembers = () => {
    // TODO: 导航到群成员列表页面
    console.log('View all members');
  };

  // 添加成员
  const handleAddMembers = () => {
    // TODO: 导航到添加成员页面
    console.log('Add members');
  };

  // 退出群组
  const handleLeaveGroup = () => {
    Alert.alert(
      '退出群组',
      '确定要退出该群组吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('已退出', '您已退出该群组', [
              { text: '确定', onPress: () => navigation.popToTop() },
            ]);
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
        return '管理员';
      default:
        return '';
    }
  };

  // 渲染成员项
  const renderMemberItem = ({ item }: { item: typeof mockMembers[0] }) => {
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

  // 渲染设置项
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
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {group.description}
              </Text>
            )}
          </View>
        </View>

        {/* 群成员 */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>群成员 ({group.member_count})</Text>
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

        {/* 群设置 */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            {renderSettingItem('消息免打扰', muted, setMuted)}
            <View style={styles.settingDivider} />
            {renderSettingItem('置顶聊天', stickToTop, setStickToTop)}
          </View>
        </View>

        {/* 群成员列表 */}
        <View style={styles.membersListSection}>
          <Text style={styles.sectionTitle}>群成员</Text>
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

        {/* 退出群组 */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.leaveButtonText}>退出群组</Text>
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
