// 桌面端聊天面板

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Conversation,
  Message,
  useChatStore,
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  formatDisplayName,
} from '@neochat/shared';

import { MessageList } from '@neochat/shared/src/components/MessageList';
import { ChatInput } from '@neochat/shared/src/components/ChatInput';

interface ChatPanelProps {
  conversation?: Conversation;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ conversation }) => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    isSending,
    setMessages,
    addMessage,
    setLoading,
    setSending,
  } = useChatStore();

  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender: string } | null>(null);

  // 获取消息列表
  const loadMessages = useCallback(async () => {
    if (!conversation) return;

    try {
      setLoading(true);
      const response = await chatService.getConversationMessages(conversation.id);
      if (response.success && response.data) {
        setMessages(conversation.id, response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [conversation, setMessages, setLoading]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      markAsRead();
    }
  }, [conversation?.id, loadMessages]);

  // 标记会话为已读
  const markAsRead = useCallback(async () => {
    if (!conversation) return;

    try {
      await chatService.markConversationAsRead(conversation.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [conversation]);

  // 获取会话标题
  const getConversationTitle = (): string => {
    if (!conversation) return '选择一个会话';
    if (conversation.type === 'group') {
      return conversation.name || '群聊';
    }
    // 单聊：显示对方名称
    if (conversation.members && user) {
      const otherMember = conversation.members.find((m) => m.user_id !== user.id);
      if (otherMember?.user) {
        return formatDisplayName(otherMember.user.nickname, otherMember.user.username);
      }
    }
    return '聊天';
  };

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !conversation) return;

    try {
      setSending(true);
      const response = await chatService.sendMessage({
        conversation_id: conversation.id,
        type: 'text',
        content,
        reply_to_id: replyingTo?.id,
      });

      if (response.success && response.data) {
        addMessage(conversation.id, response.data);
      } else {
        Alert.alert('错误', response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('错误', '发送消息失败');
    } finally {
      setSending(false);
      setReplyingTo(null);
    }
  }, [user, conversation, replyingTo, addMessage, setSending]);

  // 加载更多消息
  const handleLoadMore = useCallback(() => {
    // TODO: 实现分页加载
  }, []);

  // 消息点击
  const handleMessagePress = useCallback((message: Message) => {
    // TODO: 实现消息点击操作（复制、转发等）
  }, []);

  // 消息长按
  const handleMessageLongPress = useCallback((message: Message) => {
    // 设置回复
    if (message.sender) {
      setReplyingTo({
        id: message.id,
        content: message.content,
        sender: formatDisplayName(message.sender.nickname, message.sender.username),
      });
    }
  }, []);

  // 头像点击
  const handleAvatarPress = useCallback((clickedUser: any) => {
    // TODO: 导航到用户资料页面
    console.log('View user profile:', clickedUser.id);
  }, []);

  // 取消回复
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // 如果没有选择会话，显示空状态
  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.dark.text.tertiary} />
          <Text style={styles.emptyTitle}>选择一个会话</Text>
          <Text style={styles.emptySubtext}>开始聊天吧！</Text>
        </View>
      </View>
    );
  }

  const conversationMessages = messages[conversation.id] || [];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{getConversationTitle()}</Text>
          {/* TODO: 显示在线状态/成员数量 */}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={22} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam-outline" size={22} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={22} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 消息列表 */}
      <View style={styles.messagesContainer}>
        <MessageList
          messages={conversationMessages}
          currentUserId={user?.id}
          onLoadMore={handleLoadMore}
          onMessagePress={handleMessagePress}
          onMessageLongPress={handleMessageLongPress}
          onAvatarPress={handleAvatarPress}
          isLoadingMore={isLoading}
        />
      </View>

      {/* 输入框 */}
      <View style={styles.inputContainer}>
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendImage={() => {}}
          onSendFile={() => {}}
          isSending={isSending}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    flexDirection: 'column',
  },
  header: {
    height: 72,
    backgroundColor: COLORS.dark.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.dark.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
