// 桌面端聊天列表面�?
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Conversation,
  useChatStore,
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from 'neochat-shared';

import { ConversationItem } from 'neochat-shared/src/components/ConversationItem';

interface ChatListPanelProps {
  selectedConversationId?: string;
  onSelectConversation?: (conversation: Conversation) => void;
}

export const ChatListPanel: React.FC<ChatListPanelProps> = ({
  selectedConversationId,
  onSelectConversation,
}) => {
  const { user } = useAuthStore();
  const {
    conversations,
    isLoading,
    setConversations,
    setLoading,
    setCurrentConversation,
  } = useChatStore();

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await chatService.getUserConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert('错误', '加载会话列表失败');
    } finally {
      setLoading(false);
    }
  }, [user, setConversations, setLoading]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 处理会话点击
  const handleConversationPress = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    onSelectConversation?.(conversation);
  };

  // 渲染会话�?  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.itemWrapper,
        item.id === selectedConversationId && styles.itemWrapperActive,
      ]}>
        <ConversationItem
          conversation={item}
          currentUserId={user?.id}
          onPress={() => handleConversationPress(item)}
        />
      </View>
    </TouchableOpacity>
  );

  // 会话列表为空时的渲染
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无会话</Text>
      <Text style={styles.emptySubtext}>开始聊天吧�?/Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>消息</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 搜索�?*/}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.dark.text.secondary}
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>搜索</Text>
      </View>

      {/* 会话列表 */}
      <View style={styles.listContainer}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: COLORS.dark.surface,
    flexDirection: 'column',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.dark.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addButton: {
    padding: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.background,
    borderRadius: 10,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingVertical: SPACING.xs,
  },
  itemWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  itemWrapperActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderLeftColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
});
