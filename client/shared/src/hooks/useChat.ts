// 聊天相关 hooks

import { useCallback, useEffect } from 'react';
import { useChatStore, useAuthStore, chatService, websocket, useWebSocket } from '../index';
import type { Conversation, Message } from '../types';

export function useChat() {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
    setCurrentConversation,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setLoading,
    setSending,
    clearChat,
  } = useChatStore();

  const { user } = useAuthStore();

  // WebSocket hook for real-time updates
  const { isConnected, connect, sendTyping } = useWebSocket({
    onNewMessage: (message: Message, fromId: string, convId: string) => {
      if (fromId !== user?.id) {
        addMessage(convId, message);
        // Update conversation last message
        updateConversation(convId, {
          last_message: message.content,
          last_msg_at: message.created_at,
        });
      }
    },
  });

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (user && !isConnected) {
      connect().catch(console.error);
    }
  }, [user, isConnected, connect]);

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const response = await chatService.getUserConversations();
      if (response.success && response.data) {
        setConversations(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch conversations error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, setConversations, setLoading]);

  // 创建单聊会话
  const createSingleConversation = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        const response = await chatService.createSingleConversation(userId);
        if (response.success && response.data) {
          addConversation(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to create conversation');
      } catch (error) {
        console.error('Create conversation error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [addConversation, setLoading]
  );

  // 选择会话
  const selectConversation = useCallback(
    async (conversation: Conversation) => {
      setCurrentConversation(conversation);
      // 标记为已读
      if (conversation.unread_count && conversation.unread_count > 0) {
        await markAsRead(conversation.id);
      }
      // 加载消息
      await fetchMessages(conversation.id);
    },
    [setCurrentConversation]
  );

  // 获取消息列表
  const fetchMessages = useCallback(
    async (conversationId: string, before?: string) => {
      if (!user) return [];

      setLoading(true);
      try {
        const response = await chatService.getConversationMessages(conversationId, before);
        if (response.success && response.data) {
          setMessages(conversationId, response.data);
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Fetch messages error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, setMessages, setLoading]
  );

  // 发送消息
  const sendMessage = useCallback(
    async (
      data: {
        conversation_id: string;
        type: 'text' | 'image' | 'file';
        content: string;
        media_url?: string;
        reply_to_id?: string;
      }
    ) => {
      if (!user) return undefined;

      setSending(true);
      try {
        const response = await chatService.sendMessage(data);
        if (response.success && response.data) {
          addMessage(data.conversation_id, response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to send message');
      } catch (error) {
        console.error('Send message error:', error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [user, addMessage, setSending]
  );

  // 标记已读
  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await chatService.markConversationAsRead(conversationId);
        updateConversation(conversationId, { unread_count: 0 });
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    },
    [updateConversation]
  );

  // 编辑消息
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!currentConversation) return undefined;

      try {
        const response = await chatService.editMessage(messageId, content);
        if (response.success && response.data) {
          updateMessage(currentConversation.id, messageId, {
            content,
            is_edited: true,
          });
          return response.data;
        }
        throw new Error(response.message || 'Failed to edit message');
      } catch (error) {
        console.error('Edit message error:', error);
        throw error;
      }
    },
    [currentConversation, updateMessage]
  );

  // 删除消息
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentConversation) return;

      try {
        await chatService.deleteMessage(messageId);
        removeMessage(currentConversation.id, messageId);
      } catch (error) {
        console.error('Delete message error:', error);
        throw error;
      }
    },
    [currentConversation, removeMessage]
  );

  // 发送输入状态
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (currentConversation && isConnected) {
        sendTyping(currentConversation.id, isTyping);
      }
    },
    [currentConversation, isConnected, sendTyping]
  );

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    isConnected,
    fetchConversations,
    createSingleConversation,
    selectConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    setTyping,
    updateConversation,
    removeConversation,
    clearChat,
  };
}
