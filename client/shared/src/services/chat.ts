import { api } from './api';
import {
  Conversation,
  Message,
  User,
  Friend,
  Group,
  Favorite,
  PaginatedResponse,
} from '../types';

export class ChatService {
  // Conversations
  static async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/chat/conversations');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get conversations');
  }

  static async getConversation(id: string): Promise<Conversation> {
    const response = await api.get<Conversation>(`/chat/conversations/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get conversation');
  }

  static async createConversation(data: {
    type: 'single' | 'group';
    user_ids?: string[];
    name?: string;
  }): Promise<Conversation> {
    const response = await api.post<Conversation>('/chat/conversations', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create conversation');
  }

  static async updateConversation(
    id: string,
    data: Partial<Conversation>
  ): Promise<Conversation> {
    const response = await api.put<Conversation>(`/chat/conversations/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update conversation');
  }

  static async deleteConversation(id: string): Promise<void> {
    const response = await api.delete(`/chat/conversations/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete conversation');
    }
  }

  // Messages
  static async getMessages(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Message>> {
    const response = await api.get<PaginatedResponse<Message>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page, page_size: pageSize },
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get messages');
  }

  static async sendMessage(
    conversationId: string,
    data: {
      type: 'text' | 'image' | 'file';
      content: string;
      media_url?: string;
      reply_to_id?: string;
    }
  ): Promise<Message> {
    const response = await api.post<Message>(
      `/chat/conversations/${conversationId}/messages`,
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to send message');
  }

  static async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const response = await api.delete(
      `/chat/conversations/${conversationId}/messages/${messageId}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete message');
    }
  }

  static async markAsRead(conversationId: string): Promise<void> {
    const response = await api.post(`/chat/conversations/${conversationId}/read`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark as read');
    }
  }

  // Friends
  static async getFriends(): Promise<Friend[]> {
    const response = await api.get<Friend[]>('/friends');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get friends');
  }

  static async getFriendRequests(): Promise<Friend[]> {
    const response = await api.get<Friend[]>('/friends/requests');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get friend requests');
  }

  static async sendFriendRequest(userId: string): Promise<Friend> {
    const response = await api.post<Friend>('/friends/requests', { user_id: userId });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to send friend request');
  }

  static async acceptFriendRequest(requestId: string): Promise<Friend> {
    const response = await api.post<Friend>(`/friends/requests/${requestId}/accept`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to accept friend request');
  }

  static async rejectFriendRequest(requestId: string): Promise<void> {
    const response = await api.post(`/friends/requests/${requestId}/reject`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to reject friend request');
    }
  }

  static async removeFriend(friendId: string): Promise<void> {
    const response = await api.delete(`/friends/${friendId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to remove friend');
    }
  }

  // Blocklist
  static async getBlocklist(): Promise<User[]> {
    const response = await api.get<User[]>('/blocklist');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get blocklist');
  }

  static async blockUser(userId: string, reason?: string): Promise<void> {
    const response = await api.post('/blocklist', { user_id: userId, reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to block user');
    }
  }

  static async unblockUser(userId: string): Promise<void> {
    const response = await api.delete(`/blocklist/${userId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to unblock user');
    }
  }

  // Groups
  static async createGroup(data: {
    name: string;
    description?: string;
    user_ids: string[];
    avatar?: string;
  }): Promise<Group> {
    const response = await api.post<Group>('/groups', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create group');
  }

  static async getGroup(groupId: string): Promise<Group> {
    const response = await api.get<Group>(`/groups/${groupId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get group');
  }

  static async updateGroup(groupId: string, data: Partial<Group>): Promise<Group> {
    const response = await api.put<Group>(`/groups/${groupId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update group');
  }

  static async leaveGroup(groupId: string): Promise<void> {
    const response = await api.post(`/groups/${groupId}/leave`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to leave group');
    }
  }

  // Users
  static async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<User[]>('/users/search', { params: { q: query } });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to search users');
  }

  static async getUser(userId: string): Promise<User> {
    const response = await api.get<User>(`/users/${userId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user');
  }

  // Favorites
  static async getFavorites(): Promise<Favorite[]> {
    const response = await api.get<Favorite[]>('/favorites');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get favorites');
  }

  static async addFavorite(messageId: string, note?: string): Promise<Favorite> {
    const response = await api.post<Favorite>('/favorites', { message_id: messageId, note });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to add favorite');
  }

  static async removeFavorite(favoriteId: string): Promise<void> {
    const response = await api.delete(`/favorites/${favoriteId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to remove favorite');
    }
  }

  // Forward message
  static async forwardMessage(messageId: string, conversationIds: string[]): Promise<void> {
    const response = await api.post('/chat/messages/forward', {
      message_id: messageId,
      conversation_ids: conversationIds,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to forward message');
    }
  }
}

export default ChatService;
