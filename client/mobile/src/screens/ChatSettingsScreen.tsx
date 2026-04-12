// 聊天设置页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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
import type { User, Conversation } from '@neochat/shared/src/types';

type ChatSettingsScreenRouteProp = {
  params: {
    conversationId: string;
  };
};

// Mock data - 实际应该从 store 或 API 获取
const mockConversation: Conversation = {
  id: '1',
  type: 'single',
  name: '测试好友',
  created_by: 'user1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockFriend: User = {
  id: '2',
  username: 'testuser',
  nickname: '测试好友',
  status: 'online',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ChatSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ChatSettingsScreenRouteProp>();
  const { conversationId } = route.params;

  const [muted, setMuted] = useState(false);
  const [stickToTop, setStickToTop] = useState(false);

  const displayName = mockConversation.name
    ? mockConversation.name
    : formatDisplayName(mockFriend.nickname, mockFriend.username);

  // 清空聊天记录
  const handleClearChat = () => {
    Alert.alert(
      '清空聊天记录',
      '确定要清空与该好友的聊天记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('成功', '聊天记录已清空');
          },
        },
      ]
    );
  };

  // 删除好友
  const handleDeleteFriend = () => {
    Alert.alert(
      '删除好友',
      `确定要删除 ${displayName} 吗？删除后将清空聊天记录。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('成功', '已删除好友');
            navigation.popToTop();
          },
        },
      ]
    );
  };

  // 举报
  const handleReport = () => {
    Alert.alert(
      '举报',
      '请选择举报原因',
      [
        { text: '取消', style: 'cancel' },
        { text: '垃圾消息', onPress: () => Alert.alert('感谢反馈', '我们会尽快处理') },
        { text: '骚扰', onPress: () => Alert.alert('感谢反馈', '我们会尽快处理') },
        { text: '其他', onPress: () => Alert.alert('感谢反馈', '我们会尽快处理') },
      ]
    );
  };

  const infoItems = [
    {
      id: 'avatar',
      type: 'profile' as const,
    },
  ];

  const settingsItems = [
    {
      id: 'mute',
      title: '消息免打扰',
      type: 'toggle' as const,
      value: muted,
      onToggle: setMuted,
    },
    {
      id: 'stick',
      title: '置顶聊天',
      type: 'toggle' as const,
      value: stickToTop,
      onToggle: setStickToTop,
    },
  ];

  const operationItems = [
    {
      id: 'background',
      title: '设置聊天背景',
      icon: 'image-outline',
      type: 'navigate' as const,
    },
    {
      id: 'search',
      title: '查找聊天记录',
      icon: 'search-outline',
      type: 'navigate' as const,
    },
    {
      id: 'clear',
      title: '清空聊天记录',
      icon: 'trash-outline',
      type: 'action' as const,
      onPress: handleClearChat,
      isDanger: true,
    },
  ];

  const dangerItems = [
    {
      id: 'report',
      title: '举报',
      icon: 'flag-outline',
      type: 'action' as const,
      onPress: handleReport,
      isDanger: true,
    },
    {
      id: 'delete',
      title: '删除好友',
      icon: 'person-remove-outline',
      type: 'action' as const,
      onPress: handleDeleteFriend,
      isDanger: true,
    },
  ];

  const renderProfileItem = () => (
    <View key="profile" style={styles.profileItem}>
      <Avatar
        uri={mockFriend.avatar}
        nickname={displayName}
        size="xl"
        style={styles.profileAvatar}
      />
      <View style={styles.profileInfo}>
        <Text style={styles.profileName} numberOfLines={1}>
          {displayName}
        </Text>
        {mockFriend.username && (
          <Text style={styles.profileUsername}>@{mockFriend.username}</Text>
        )}
        {mockFriend.status && (
          <Text style={styles.profileStatus}>
            {mockFriend.status === 'online' ? '在线' : '离线'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderToggleItem = (item: any) => (
    <View key={item.id} style={styles.menuItem}>
      <Text style={styles.menuItemTitle}>{item.title}</Text>
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        trackColor={{ false: COLORS.dark.border, true: `${COLORS.primary}80` }}
        thumbColor={item.value ? COLORS.primary : COLORS.dark.text.tertiary}
      />
    </View>
  );

  const renderNavigateItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={item.icon as any}
          size={22}
          color={item.isDanger ? COLORS.error : COLORS.dark.text.primary}
        />
        <Text
          style={[
            styles.menuItemTitle,
            styles.menuItemTitleWithIcon,
            item.isDanger && styles.menuItemTitleDanger,
          ]}
        >
          {item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
    </TouchableOpacity>
  );

  const renderActionItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={item.icon as any}
          size={22}
          color={item.isDanger ? COLORS.error : COLORS.dark.text.primary}
        />
        <Text
          style={[
            styles.menuItemTitle,
            styles.menuItemTitleWithIcon,
            item.isDanger && styles.menuItemTitleDanger,
          ]}
        >
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string | null, items: any[]) => (
    <View style={styles.menuSection} key={title || 'info'}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.type === 'profile' && renderProfileItem()}
            {item.type === 'toggle' && renderToggleItem(item)}
            {item.type === 'navigate' && renderNavigateItem(item)}
            {item.type === 'action' && renderActionItem(item)}
            {index < items.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天详情</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {renderSection(null, infoItems)}
        {renderSection('设置', settingsItems)}
        {renderSection('操作', operationItems)}
        {renderSection(null, dangerItems)}

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
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  menuCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  profileAvatar: {
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  profileUsername: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  profileStatus: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuItemTitleWithIcon: {
    marginLeft: SPACING.md,
  },
  menuItemTitleDanger: {
    color: COLORS.error,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
