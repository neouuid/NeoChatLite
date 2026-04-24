// 主聊天界面 - 会话列表

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import type { RootStackParamList } from 'neochat-shared';

type MainChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const MainChatScreen: React.FC = () => {
  const navigation = useNavigation<MainChatScreenNavigationProp>();
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

  // 处理会话点击 - memoized
  const handleConversationPress = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    navigation.navigate('Chat', { conversationId: conversation.id });
  }, [setCurrentConversation, navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  // Memoized render item
  const renderConversationItem = useCallback(({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      currentUserId={user?.id}
      onPress={() => handleConversationPress(item)}
    />
  ), [user?.id, handleConversationPress]);

  // Memoized empty component
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无会话</Text>
      <Text style={styles.emptySubtext}>开始聊天吧</Text>
    </View>
  ), []);

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={loadConversations}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  ), [isLoading, loadConversations]);

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={keyExtractor}
        renderItem={renderConversationItem}
        refreshControl={refreshControl}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        // 性能优化属性
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

// Memoized ConversationItem for better performance
const MemoizedConversationItem = React.memo(ConversationItem, (prevProps, nextProps) => {
  // Only re-render if conversation changed significantly
  const prevConv = prevProps.conversation;
  const nextConv = nextProps.conversation;
  return (
    prevConv.id === nextConv.id &&
    prevConv.last_message === nextConv.last_message &&
    prevConv.last_msg_at === nextConv.last_msg_at &&
    prevConv.unread_count === nextConv.unread_count &&
    prevConv.name === nextConv.name &&
    prevConv.avatar === nextConv.avatar &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
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
