// WebSocket 相关 hooks

import { useCallback, useEffect, useRef, useState } from 'react';
import { websocket } from '../services';
import type { Message, Conversation } from '../types';

interface WebSocketOptions {
  onMessage?: (message: Message) => void;
  onTyping?: (data: { conversation_id: string; user_id: string; is_typing: boolean }) => void;
  onMessageRead?: (data: {
    conversation_id: string;
    message_id: string;
    user_id: string;
    read_at: string;
  }) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onFriendRequest?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const optionsRef = useRef(options);

  // 更新 options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // 连接 WebSocket
  const connect = useCallback(async (token?: string) => {
    setIsConnecting(true);
    try {
      if (token) {
        websocket.setAccessToken(token);
      }
      await websocket.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('WebSocket connect error:', error);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    websocket.disconnect();
    setIsConnected(false);
  }, []);

  // 发送消息
  const sendMessage = useCallback((conversationId: string, content: string, type: string = 'text') => {
    websocket.sendMessage(conversationId, content, type);
  }, []);

  // 发送输入状态
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    websocket.sendTyping(conversationId, isTyping);
  }, []);

  // 标记已读
  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    websocket.markAsRead(conversationId, messageId);
  }, []);

  // 设置事件监听
  useEffect(() => {
    const handlers = {
      onMessage: (data: any) => {
        optionsRef.current.onMessage?.(data);
      },
      onTyping: (data: any) => {
        optionsRef.current.onTyping?.(data);
      },
      onMessageRead: (data: any) => {
        optionsRef.current.onMessageRead?.(data);
      },
      onConversationUpdated: (data: any) => {
        optionsRef.current.onConversationUpdated?.(data);
      },
      onUserOnline: (data: any) => {
        optionsRef.current.onUserOnline?.(data.user_id);
      },
      onUserOffline: (data: any) => {
        optionsRef.current.onUserOffline?.(data.user_id);
      },
      onFriendRequest: (data: any) => {
        optionsRef.current.onFriendRequest?.(data);
      },
      onConnected: () => {
        setIsConnected(true);
        optionsRef.current.onConnected?.();
      },
      onDisconnected: () => {
        setIsConnected(false);
        optionsRef.current.onDisconnected?.();
      },
    };

    // 注册事件
    websocket.on('message', handlers.onMessage);
    websocket.on('typing', handlers.onTyping);
    websocket.on('message_read', handlers.onMessageRead);
    websocket.on('conversation_updated', handlers.onConversationUpdated);
    websocket.on('user_online', handlers.onUserOnline);
    websocket.on('user_offline', handlers.onUserOffline);
    websocket.on('friend_request', handlers.onFriendRequest);
    websocket.on('connected', handlers.onConnected);
    websocket.on('disconnected', handlers.onDisconnected);

    return () => {
      // 清理事件监听
      websocket.off('message', handlers.onMessage);
      websocket.off('typing', handlers.onTyping);
      websocket.off('message_read', handlers.onMessageRead);
      websocket.off('conversation_updated', handlers.onConversationUpdated);
      websocket.off('user_online', handlers.onUserOnline);
      websocket.off('user_offline', handlers.onUserOffline);
      websocket.off('friend_request', handlers.onFriendRequest);
      websocket.off('connected', handlers.onConnected);
      websocket.off('disconnected', handlers.onDisconnected);
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    markAsRead,
  };
}
