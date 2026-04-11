// 聊天相关 hooks

import { useCallback } from 'react';
import { useChatStore, useAuthStore, ChatService } from '../index';
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

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const convs = await ChatService.getConversations();
      setConversations(convs);
      return convs;
    } catch (error) {
      console.error('Fetch conversations error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setConversations, setLoading]);

  // 创建会话
  const createConversation = useCallback(
    async (data: { type: 'single' | 'group'; user_ids?: string[]; name?: string }) => {
      setLoading(true);
      try {
        const conv = await ChatService.createConversation(data);
        addConversation(conv);
        return conv;
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
      // TODO: 获取消息历史
    },
    [setCurrentConversation]
  );

  // 获取消息列表
  const fetchMessages = useCallback(
    async (conversationId: string, page: number = 1, pageSize: number = 50) => {
      setLoading(true);
      try {
        const result = await ChatService.getMessages(conversationId, page, pageSize);
        setMessages(conversationId, result.items);
        return result;
      } catch (error) {
        console.error('Fetch messages error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setMessages, setLoading]
  );

  // 发送消息
  const sendMessage = useCallback(
    async (
      conversationId: string,
      data: {
        type: 'text' | 'image' | 'file';
        content: string;
        media_url?: string;
        reply_to_id?: string;
      }
    ) => {
      setSending(true);
      try {
        const message = await ChatService.sendMessage(conversationId, data);
        addMessage(conversationId, message);
        return message;
      } catch (error) {
        console.error('Send message error:', error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [addMessage, setSending]
  );

  // 标记已读
  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await ChatService.markAsRead(conversationId);
        updateConversation(conversationId, { unread_count: 0 });
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    },
    [updateConversation]
  );

  // 删除消息
  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        await ChatService.deleteMessage(conversationId, messageId);
        removeMessage(conversationId, messageId);
      } catch (error) {
        console.error('Delete message error:', error);
        throw error;
      }
    },
    [removeMessage]
  );

  // 转发消息
  const forwardMessage = useCallback(
    async (messageId: string, conversationIds: string[]) => {
      try {
        await ChatService.forwardMessage(messageId, conversationIds);
      } catch (error) {
        console.error('Forward message error:', error);
        throw error;
      }
    },
    []
  );

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    fetchConversations,
    createConversation,
    selectConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    forwardMessage,
    updateConversation,
    removeConversation,
    clearChat,
  };
}
