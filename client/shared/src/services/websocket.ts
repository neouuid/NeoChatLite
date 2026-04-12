import { Message, Conversation, User } from '../types';
import { WS_BASE_URL } from '../constants';

// WebSocket message types (matching backend)
type WSMessageType =
  | 'new_message'
  | 'message_read'
  | 'message_edited'
  | 'message_deleted'
  | 'typing'
  | 'stop_typing'
  | 'online_status'
  | 'error'
  | 'ping'
  | 'pong'
  // WebRTC signaling types
  | 'signal_offer'
  | 'signal_answer'
  | 'signal_ice'
  | 'call_invite'
  | 'call_accept'
  | 'call_reject'
  | 'call_hangup'
  | 'call_ended';

// WebSocket message structure (matching backend)
interface WSMessage {
  type: WSMessageType;
  data: any;
  from_id: string;
  conv_id?: string;
}

type MessageHandler = (data: any, fromId: string, convId?: string) => void;

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
  private errorHandlers: Set<(error: any) => void> = new Set();

  constructor(url: string = WS_BASE_URL) {
    this.url = url;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      try {
        // Note: In a real app, we'd use a proper auth header or token in the URL
        // For now, we'll connect without token (the backend handler gets user from context)
        this.ws = new WebSocket(this.url);

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

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          this.errorHandlers.forEach((handler) => handler(event));
          reject(event);
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
      handlers.forEach((handler) => handler(message.data, message.from_id, message.conv_id));
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: WSMessageType, data: any, convId?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        conv_id: convId,
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  // Convenience methods
  sendTyping(conversationId: string, isTyping: boolean) {
    this.send(isTyping ? 'typing' : 'stop_typing', {}, conversationId);
  }

  sendPing() {
    this.send('ping', {});
  }

  // WebRTC signaling methods
  sendSignalOffer(toUserId: string, sdp: string) {
    this.send('signal_offer', { to_user_id: toUserId, sdp });
  }

  sendSignalAnswer(toUserId: string, sdp: string) {
    this.send('signal_answer', { to_user_id: toUserId, sdp });
  }

  sendSignalIce(toUserId: string, candidate: string, sdpMid?: string, sdpMlineIndex?: number) {
    this.send('signal_ice', {
      to_user_id: toUserId,
      candidate,
      sdp_mid: sdpMid,
      sdp_mline_index: sdpMlineIndex,
    });
  }

  sendCallInvite(calleeId: string, callType: 'video' | 'voice', conversationId?: string) {
    this.send('call_invite', {
      callee_id: calleeId,
      call_type: callType,
      conversation_id: conversationId,
    });
  }

  sendCallAccept(callerId: string) {
    this.send('call_accept', { caller_id: callerId });
  }

  sendCallReject(callerId: string) {
    this.send('call_reject', { caller_id: callerId });
  }

  sendCallHangup(peerId: string) {
    this.send('call_hangup', { peer_id: peerId });
  }

  // Event handlers
  on(event: 'connected' | 'disconnected' | 'error' | WSMessageType, handler: any) {
    if (event === 'connected') {
      this.connectionHandlers.add(handler);
    } else if (event === 'disconnected') {
      this.disconnectHandlers.add(handler);
    } else if (event === 'error') {
      this.errorHandlers.add(handler);
    } else {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);
    }
  }

  off(event: 'connected' | 'disconnected' | 'error' | WSMessageType, handler: any) {
    if (event === 'connected') {
      this.connectionHandlers.delete(handler);
    } else if (event === 'disconnected') {
      this.disconnectHandlers.delete(handler);
    } else if (event === 'error') {
      this.errorHandlers.delete(handler);
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
