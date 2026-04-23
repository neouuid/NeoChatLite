// 桌面端聊天面�?
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
  copyToClipboard,
} from 'neochat-shared';

import { pickImageFromGalleryWeb, pickFileWeb, MediaItemWeb } from '../utils/mediaWeb';

import { MessageList } from 'neochat-shared/src/components/MessageList';
import { ChatInput } from 'neochat-shared/src/components/ChatInput';

interface ChatPanelProps {
  conversation?: Conversation;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToForward?: (messageId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  conversation,
  onNavigateToProfile,
  onNavigateToForward,
}) => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    isSending,
    isLoadingMore,
    hasMoreMessages,
    highlightedMessageId,
    setMessages,
    addMessage,
    prependMessages,
    setLoading,
    setSending,
    setLoadingMore,
    setHasMoreMessages,
    setHighlightedMessageId,
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
        // 初始加载时，如果返回的消息数量少�?limit，则认为没有更多消息
        setHasMoreMessages(conversation.id, response.data.length >= 50);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [conversation, setMessages, setLoading, setHasMoreMessages]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      markAsRead();
      // 重置分页状�?      setHasMoreMessages(conversation.id, true);
    }
  }, [conversation?.id, loadMessages, setHasMoreMessages]);

  // 标记会话为已�?  const markAsRead = useCallback(async () => {
    if (!conversation) return;

    try {
      await chatService.markConversationAsRead(conversation.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [conversation]);

  // 获取会话标题
  const getConversationTitle = (): string => {
    if (!conversation) return '选择一个会�?;
    if (conversation.type === 'group') {
      return conversation.name || '群聊';
    }
    // 单聊：显示对方名�?    if (conversation.members && user) {
      const otherMember = conversation.members.find((m) => m.user_id !== user.id);
      if (otherMember?.user) {
        return formatDisplayName(otherMember.user.nickname, otherMember.user.username);
      }
    }
    return '聊天';
  };

  // 获取在线状�?成员数量显示
  const getConversationSubtitle = (): string => {
    if (!conversation) return '';

    if (conversation.type === 'group') {
      const memberCount = conversation.members?.length || 0;
      return `${memberCount} 名成员`;
    } else {
      // 单聊：显示对方在线状�?      if (conversation.members && user) {
        const otherMember = conversation.members.find((m) => m.user_id !== user.id);
        if (otherMember?.user) {
          return otherMember.user.status === 'online' ? '在线' : '离线';
        }
      }
    }
    return '';
  };

  // 发送消�?  const handleSendMessage = useCallback(async (content: string) => {
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
        Alert.alert('错误', response.message || '发送消息失�?);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('错误', '发送消息失�?);
    } finally {
      setSending(false);
      setReplyingTo(null);
    }
  }, [user, conversation, replyingTo, addMessage, setSending]);

  // 处理媒体上传
  const handleSendMedia = useCallback(async (item: MediaItemWeb, mediaType: 'image' | 'file') => {
    if (!user || !conversation) return;

    try {
      setSending(true);

      // 上传文件
      const uploadResult = await chatService.uploadFile(
        item.file!,
        item.filename
      );

      if (uploadResult.success && uploadResult.data) {
        // 发送消�?        const response = await chatService.sendMessage({
          conversation_id: conversation.id,
          type: mediaType,
          content: item.filename || '',
          media_url: uploadResult.data.url,
          file_name: item.filename,
          file_size: item.fileSize,
          reply_to_id: replyingTo?.id,
        });

        if (response.success && response.data) {
          addMessage(conversation.id, response.data);
        } else {
          Alert.alert('错误', response.message || '发送消息失�?);
        }
      } else {
        Alert.alert('错误', uploadResult.message || '上传文件失败');
      }
    } catch (error) {
      console.error('Failed to send media:', error);
      Alert.alert('错误', '发送失�?);
    } finally {
      setSending(false);
      setReplyingTo(null);
    }
  }, [user, conversation, replyingTo, addMessage, setSending]);

  // 发送图�?  const handleSendImage = useCallback(async () => {
    try {
      const result = await pickImageFromGalleryWeb();
      if (result) {
        await handleSendMedia(result, 'image');
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  }, [handleSendMedia]);

  // 发送文�?  const handleSendFile = useCallback(async () => {
    try {
      const result = await pickFileWeb();
      if (result) {
        await handleSendMedia(result, 'file');
      }
    } catch (error) {
      console.error('Failed to pick file:', error);
    }
  }, [handleSendMedia]);

  // 加载更多消息（分页）
  const handleLoadMore = useCallback(async () => {
    if (!conversation) return;

    const currentMessages = messages[conversation.id] || [];
    const loading = isLoadingMore[conversation.id] || false;
    const hasMore = hasMoreMessages[conversation.id] ?? true;

    if (loading || !hasMore || currentMessages.length === 0) {
      return;
    }

    try {
      setLoadingMore(conversation.id, true);
      const oldestMessage = currentMessages[0];
      const response = await chatService.getConversationMessages(
        conversation.id,
        oldestMessage.id,
        50
      );

      if (response.success && response.data) {
        if (response.data.length > 0) {
          prependMessages(conversation.id, response.data);
          // 如果返回的消息少�?limit，则没有更多�?          setHasMoreMessages(conversation.id, response.data.length >= 50);
        } else {
          setHasMoreMessages(conversation.id, false);
        }
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(conversation.id, false);
    }
  }, [
    conversation,
    messages,
    isLoadingMore,
    hasMoreMessages,
    prependMessages,
    setLoadingMore,
    setHasMoreMessages,
  ]);

  // 消息点击
  const handleMessagePress = useCallback((message: Message) => {
    // 显示消息操作菜单
    const options = ['复制', '转发', '取消'];
    const cancelIndex = options.length - 1;

    Alert.alert('消息操作', '请选择操作', options.map((text, index) => ({
      text,
      onPress: async () => {
        if (index === 0) {
          // 复制消息
          const success = await copyToClipboard(message.content);
          Alert.alert(success ? '已复�? : '复制失败', success ? '消息已复制到剪贴�? : '复制消息失败，请重试');
        } else if (index === 1) {
          // 转发消息
          if (onNavigateToForward) {
            onNavigateToForward(message.id);
          } else {
            Alert.alert('提示', '转发功能需要父组件集成');
          }
        }
      },
      style: index === cancelIndex ? 'cancel' : 'default',
    })));
  }, [onNavigateToForward]);

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
    // 导航到用户资料页�?    if (onNavigateToProfile) {
      onNavigateToProfile(clickedUser.id);
    } else {
      console.log('View user profile:', clickedUser.id);
    }
  }, [onNavigateToProfile]);

  // 取消回复
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // 清除高亮消息 ID�?秒后�?  React.useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, setHighlightedMessageId]);

  // 如果没有选择会话，显示空状�?  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.dark.text.tertiary} />
          <Text style={styles.emptyTitle}>选择一个会�?/Text>
          <Text style={styles.emptySubtext}>开始聊天吧�?/Text>
        </View>
      </View>
    );
  }

  const conversationMessages = messages[conversation.id] || [];
  const conversationLoadingMore = isLoadingMore[conversation.id] || false;
  const subtitle = getConversationSubtitle();

  // 提取会话成员（排除自己）
  const chatMembers = conversation.members
    ?.filter((m) => m.user && m.user_id !== user?.id)
    .map((m) => m.user!) || [];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{getConversationTitle()}</Text>
          {subtitle !== '' && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
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
          conversation={conversation}
          onLoadMore={handleLoadMore}
          onMessagePress={handleMessagePress}
          onMessageLongPress={handleMessageLongPress}
          onAvatarPress={handleAvatarPress}
          isLoadingMore={conversationLoadingMore}
          highlightedMessageId={highlightedMessageId}
        />
      </View>

      {/* 输入�?*/}
      <View style={styles.inputContainer}>
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          onSendFile={handleSendFile}
          isSending={isSending}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          members={chatMembers}
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
  headerSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
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
