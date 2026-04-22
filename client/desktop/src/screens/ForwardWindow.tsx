// 桌面端转发页面

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

interface ForwardWindowProps {
  messageId: string;
  onClose?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ForwardWindow: React.FC<ForwardWindowProps> = ({
  messageId,
  onClose,
  onNavigate,
}) => {
  const { user: currentUser } = useAuthStore();

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
            onPress: () => onClose?.(),
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
            <Ionicons name="people-outline" size={24} color="#8080a0" />
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

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#1a1a2e" />
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
            placeholderTextColor="#8080a0"
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
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={
            activeTab === 'recent'
              ? recentConversations
              : friends
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (activeTab === 'recent') {
              return renderConversationItem(item as any);
            } else {
              return renderFriendItem(item as Friend);
            }
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingVertical: 16,
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
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.md,
  },
  confirmButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  messageSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  messageInputContainer: {
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
  },
  messageInput: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    textAlignVertical: 'top',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabActive: {
  },
  tabText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: '#5b7cff',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  itemSelected: {
    backgroundColor: 'rgba(91, 124, 255, 0.1)',
  },
  avatar: {
    marginRight: SPACING.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  lastMessage: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  status: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#5b7cff',
    borderColor: '#5b7cff',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 24 + 48 + SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
