// 主聊天界面 - 会话列表

import React, { useEffect, useCallback } from 'react';
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
} from '@neochat/shared';

import { ConversationItem } from '@neochat/shared/src/components/ConversationItem';
import type { RootStackParamList } from '@neochat/shared';

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

  // 处理会话点击
  const handleConversationPress = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    navigation.navigate('Chat', { conversationId: conversation.id });
  };

  // 渲染会话项
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  );

  // 会话列表为空时的渲染
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无会话</Text>
      <Text style={styles.emptySubtext}>开始聊天吧！</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadConversations}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

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
