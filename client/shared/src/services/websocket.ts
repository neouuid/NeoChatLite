import { Message, Conversation } from '../types';

const DEFAULT_WS_URL = 'ws://localhost:8080/ws';

type WSMessageType =
  | 'message'
  | 'message_read'
  | 'conversation_updated'
  | 'typing'
  | 'user_online'
  | 'user_offline'
  | 'friend_request'
  | 'friend_accepted';

interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: string;
}

type MessageHandler = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private accessToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isManualClose = false;
  private handlers: Map<WSMessageType, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<() => void> = new Set();
  private disconnectHandlers: Set<() => void> = new Set();

  constructor(url: string = DEFAULT_WS_URL) {
    this.url = url;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      try {
        const url = this.accessToken
          ? `${this.url}?token=${this.accessToken}`
          : this.url;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.disconnectHandlers.forEach((handler) => handler());

          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  private handleMessage(message: WSMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.ws?.close();
    this.ws = null;
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type: type as WSMessageType,
        data,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  // Convenience methods
  sendMessage(conversationId: string, content: string, type: string = 'text') {
    this.send('message', { conversation_id: conversationId, content, type });
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    this.send('typing', { conversation_id: conversationId, is_typing: isTyping });
  }

  markAsRead(conversationId: string, messageId: string) {
    this.send('message_read', { conversation_id: conversationId, message_id: messageId });
  }

  // Event handlers
  on(event: 'connected' | 'disconnected' | WSMessageType, handler: MessageHandler) {
    if (event === 'connected') {
      this.connectionHandlers.add(handler);
    } else if (event === 'disconnected') {
      this.disconnectHandlers.add(handler);
    } else {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);
    }
  }

  off(event: 'connected' | 'disconnected' | WSMessageType, handler: MessageHandler) {
    if (event === 'connected') {
      this.connectionHandlers.delete(handler);
    } else if (event === 'disconnected') {
      this.disconnectHandlers.delete(handler);
    } else {
      this.handlers.get(event)?.delete(handler);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocket = new WebSocketClient();
export default websocket;
