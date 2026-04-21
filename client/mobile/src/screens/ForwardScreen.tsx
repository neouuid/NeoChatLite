// 转发页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';
import type { User, Friend, Conversation } from '@neochat/shared/src/types';

type ForwardType = 'recent' | 'friends' | 'groups';
type ForwardScreenRouteProp = {
  params: {
    messageId: string;
  };
};

export const ForwardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ForwardScreenRouteProp>();
  const { user: currentUser } = useAuthStore();
  const { messageId } = route.params;

  const [activeTab, setActiveTab] = useState<ForwardType>('recent');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [forwardText, setForwardText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentConversations, setRecentConversations] = useState<(Conversation & { friend?: User })[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const tabs = [
    { key: 'recent' as const, label: '最近聊天' },
    { key: 'friends' as const, label: '好友' },
    { key: 'groups' as const, label: '群组' },
  ];

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      // 并行加载数据
      const [convRes, friendsRes] = await Promise.all([
        chatService.getUserConversations(),
        chatService.getFriends(),
      ]);

      if (convRes.success && convRes.data) {
        setRecentConversations(convRes.data as any);
      }
      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data);
      }
      // 群组数据可以通过会话过滤获得
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 切换选择
  const toggleSelection = (id: string) => {
    setSelectedTargets((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 发送转发
  const handleForward = async () => {
    if (selectedTargets.length === 0) {
      Alert.alert('提示', '请选择转发目标');
      return;
    }

    setIsForwarding(true);
    try {
      const response = await chatService.forwardMessage(
        messageId,
        selectedTargets,
        forwardText
      );

      if (response.success) {
        Alert.alert('成功', '消息已转发', [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('错误', response.message || '转发失败');
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '转发失败');
    } finally {
      setIsForwarding(false);
    }
  };

  // 重试加载
  const handleRetry = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 渲染会话项
  const renderConversationItem = (conversation: Conversation & { friend?: User }) => {
    const friend = conversation.friend;
    const displayName = conversation.name
      ? conversation.name
      : friend
      ? formatDisplayName(friend.nickname, friend.username)
      : '未知用户';
    const isSelected = selectedTargets.includes(conversation.id);

    return (
      <TouchableOpacity
        key={conversation.id}
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => toggleSelection(conversation.id)}
      >
        {friend ? (
          <Avatar
            uri={friend.avatar}
            nickname={displayName}
            size="md"
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.groupAvatar]}>
            <Ionicons name="people-outline" size={24} color={COLORS.dark.text.secondary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {conversation.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {conversation.last_message}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染好友项
  const renderFriendItem = (friend: Friend) => {
    const friendUser = friend.friend;
    if (!friendUser) return null;

    const displayName = formatDisplayName(friendUser.nickname, friendUser.username);
    const isSelected = selectedTargets.includes(friendUser.id);

    return (
      <TouchableOpacity
        key={friend.id}
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => toggleSelection(friendUser.id)}
      >
        <Avatar
          uri={friendUser.avatar}
          nickname={displayName}
          size="md"
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.status}>
            {friendUser.status === 'online' ? '在线' : '离线'}
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染群组项
  const renderGroupItem = (group: any) => {
    const isSelected = selectedTargets.includes(group.id);

    return (
      <TouchableOpacity
        key={group.id}
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => toggleSelection(group.id)}
      >
        <View style={[styles.avatar, styles.groupAvatar]}>
          <Ionicons name="people-outline" size={24} color={COLORS.dark.text.secondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.status}>
            {group.member_count} 名成员
          </Text>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>转发消息</Text>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedTargets.length === 0 && styles.confirmButtonDisabled,
          ]}
          onPress={handleForward}
          disabled={selectedTargets.length === 0 || isForwarding}
        >
          <Text style={styles.confirmButtonText}>
            {isForwarding ? '发送中...' : `发送(${selectedTargets.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 转发留言 */}
      <View style={styles.messageSection}>
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="添加留言（可选）"
            placeholderTextColor={COLORS.dark.text.tertiary}
            value={forwardText}
            onChangeText={setForwardText}
            multiline
            maxLength={200}
          />
        </View>
      </View>

      {/* 标签页 */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={
            activeTab === 'recent'
              ? recentConversations
              : activeTab === 'friends'
              ? friends
              : groups
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (activeTab === 'recent') {
              return renderConversationItem(item as any);
            } else if (activeTab === 'friends') {
              return renderFriendItem(item as Friend);
            } else {
              return renderGroupItem(item);
            }
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 底部安全区域 */}
      <View style={styles.bottomSpacer} />
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
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.dark.border,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  messageSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  messageInputContainer: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 80,
  },
  messageInput: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    textAlignVertical: 'top',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
    gap: SPACING.xl,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  lastMessage: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  status: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 48 + SPACING.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  loadingText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
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
  bottomSpacer: {
    height: SPACING.xl,
  },
});
