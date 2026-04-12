// WebSocket 相关 hooks

import { useCallback, useEffect, useRef, useState } from 'react';
import { websocket } from '../services';
import type { Message, User } from '../types';

interface WebSocketOptions {
  onNewMessage?: (message: Message, fromId: string, convId: string) => void;
  onMessageRead?: (data: any, fromId: string, convId?: string) => void;
  onMessageEdited?: (data: any, fromId: string, convId?: string) => void;
  onMessageDeleted?: (data: any, fromId: string, convId?: string) => void;
  onTyping?: (data: any, fromId: string, convId?: string) => void;
  onStopTyping?: (data: any, fromId: string, convId?: string) => void;
  onOnlineStatus?: (data: { user_id: string; online: boolean }, fromId: string) => void;
  onFriendRequest?: (data: { user_id: string; username: string; avatar?: string }, fromId: string) => void;
  onFriendAccepted?: (data: { user_id: string; username: string; avatar?: string }, fromId: string) => void;
  onError?: (error: any) => void;
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

  // 发送输入状态
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    websocket.sendTyping(conversationId, isTyping);
  }, []);

  // 发送 ping
  const sendPing = useCallback(() => {
    websocket.sendPing();
  }, []);

  // 设置事件监听
  useEffect(() => {
    const handlers = {
      onNewMessage: (data: Message, fromId: string, convId?: string) => {
        if (convId) {
          optionsRef.current.onNewMessage?.(data, fromId, convId);
        }
      },
      onMessageRead: (data: any, fromId: string, convId?: string) => {
        optionsRef.current.onMessageRead?.(data, fromId, convId);
      },
      onMessageEdited: (data: any, fromId: string, convId?: string) => {
        optionsRef.current.onMessageEdited?.(data, fromId, convId);
      },
      onMessageDeleted: (data: any, fromId: string, convId?: string) => {
        optionsRef.current.onMessageDeleted?.(data, fromId, convId);
      },
      onTyping: (data: any, fromId: string, convId?: string) => {
        optionsRef.current.onTyping?.(data, fromId, convId);
      },
      onStopTyping: (data: any, fromId: string, convId?: string) => {
        optionsRef.current.onStopTyping?.(data, fromId, convId);
      },
      onOnlineStatus: (data: { user_id: string; online: boolean }, fromId: string) => {
        optionsRef.current.onOnlineStatus?.(data, fromId);
      },
      onFriendRequest: (data: { user_id: string; username: string; avatar?: string }, fromId: string) => {
        optionsRef.current.onFriendRequest?.(data, fromId);
      },
      onFriendAccepted: (data: { user_id: string; username: string; avatar?: string }, fromId: string) => {
        optionsRef.current.onFriendAccepted?.(data, fromId);
      },
      onError: (error: any) => {
        optionsRef.current.onError?.(error);
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
    websocket.on('new_message', handlers.onNewMessage);
    websocket.on('message_read', handlers.onMessageRead);
    websocket.on('message_edited', handlers.onMessageEdited);
    websocket.on('message_deleted', handlers.onMessageDeleted);
    websocket.on('typing', handlers.onTyping);
    websocket.on('stop_typing', handlers.onStopTyping);
    websocket.on('online_status', handlers.onOnlineStatus);
    websocket.on('friend_request', handlers.onFriendRequest);
    websocket.on('friend_accepted', handlers.onFriendAccepted);
    websocket.on('error', handlers.onError);
    websocket.on('connected', handlers.onConnected);
    websocket.on('disconnected', handlers.onDisconnected);

    return () => {
      // 清理事件监听
      websocket.off('new_message', handlers.onNewMessage);
      websocket.off('message_read', handlers.onMessageRead);
      websocket.off('message_edited', handlers.onMessageEdited);
      websocket.off('message_deleted', handlers.onMessageDeleted);
      websocket.off('typing', handlers.onTyping);
      websocket.off('stop_typing', handlers.onStopTyping);
      websocket.off('online_status', handlers.onOnlineStatus);
      websocket.off('friend_request', handlers.onFriendRequest);
      websocket.off('friend_accepted', handlers.onFriendAccepted);
      websocket.off('error', handlers.onError);
      websocket.off('connected', handlers.onConnected);
      websocket.off('disconnected', handlers.onDisconnected);
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendTyping,
    sendPing,
  };
}
