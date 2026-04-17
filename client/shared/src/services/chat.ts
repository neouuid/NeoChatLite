import { api } from './api';
import {
  Conversation,
  Message,
  User,
  Friend,
  Group,
  Favorite,
  CallRecord,
  PaginatedResponse,
  Mention,
} from '../types';

export class ChatService {
  // Conversations
  static async getUserConversations(): Promise<{ success: boolean; data?: Conversation[]; message?: string }> {
    return await api.get<Conversation[]>('/chat/conversations');
  }

  static async getConversation(id: string): Promise<{ success: boolean; data?: Conversation; message?: string }> {
    return await api.get<Conversation>(`/chat/conversation/${id}`);
  }

  static async createSingleConversation(userId: string): Promise<{ success: boolean; data?: Conversation; message?: string }> {
    return await api.post<Conversation>('/chat/conversation/single', { user_id: userId });
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
  static async getConversationMessages(
    conversationId: string,
    before?: string,
    limit: number = 50
  ): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    const params: any = { limit };
    if (before) {
      params.before = before;
    }
    return await api.get<Message[]>(`/chat/conversation/${conversationId}/messages`, { params });
  }

  static async sendMessage(
    data: {
      conversation_id: string;
      type: 'text' | 'image' | 'file' | 'system';
      content: string;
      media_url?: string;
      file_name?: string;
      file_size?: number;
      reply_to_id?: string;
    }
  ): Promise<{ success: boolean; data?: Message; message?: string }> {
    return await api.post<Message>('/chat/message', data);
  }

  static async editMessage(
    messageId: string,
    content: string
  ): Promise<{ success: boolean; data?: Message; message?: string }> {
    return await api.put<Message>(`/chat/message/${messageId}`, { content });
  }

  static async deleteMessage(messageId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/chat/message/${messageId}`);
  }

  static async markConversationAsRead(conversationId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/chat/conversation/${conversationId}/read`);
  }

  // Friends
  static async getFriends(): Promise<{ success: boolean; data?: Friend[]; message?: string }> {
    return await api.get<Friend[]>('/friend/list');
  }

  static async getFriendRequests(): Promise<{ success: boolean; data?: Friend[]; message?: string }> {
    return await api.get<Friend[]>('/friend/requests');
  }

  static async sendFriendRequest(userId: string): Promise<{ success: boolean; data?: Friend; message?: string }> {
    return await api.post<Friend>('/friend/request', { user_id: userId });
  }

  static async acceptFriendRequest(requestId: string): Promise<{ success: boolean; data?: Friend; message?: string }> {
    return await api.post<Friend>(`/friend/request/${requestId}/accept`);
  }

  static async rejectFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/friend/request/${requestId}/reject`);
  }

  static async cancelFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/friend/request/${requestId}/cancel`);
  }

  static async deleteFriend(friendId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/friend/${friendId}`);
  }

  static async updateFriendAlias(friendId: string, alias: string): Promise<{ success: boolean; message?: string }> {
    return await api.put(`/friend/${friendId}/alias`, { alias });
  }

  // Blocklist
  static async getBlocklist(): Promise<{ success: boolean; data?: User[]; message?: string }> {
    return await api.get<User[]>('/block/list');
  }

  static async blockUser(userId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post('/block/', { user_id: userId });
  }

  static async unblockUser(userId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/block/${userId}`);
  }

  // Groups
  static async createGroup(data: {
    name: string;
    description?: string;
    member_ids: string[];
    avatar?: string;
  }): Promise<{ success: boolean; data?: Group; message?: string }> {
    return await api.post<Group>('/group/', data);
  }

  static async getGroup(groupId: string): Promise<{ success: boolean; data?: Group; message?: string }> {
    return await api.get<Group>(`/group/${groupId}`);
  }

  static async updateGroup(groupId: string, data: Partial<Group>): Promise<{ success: boolean; data?: Group; message?: string }> {
    return await api.put<Group>(`/group/${groupId}`, data);
  }

  static async disbandGroup(groupId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/group/${groupId}`);
  }

  static async leaveGroup(groupId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/group/${groupId}/leave`);
  }

  static async getGroupMembers(groupId: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    return await api.get(`/group/${groupId}/members`);
  }

  static async addGroupMember(groupId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/group/${groupId}/members`, { user_id: userId });
  }

  static async removeGroupMember(groupId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/group/${groupId}/members/${userId}`);
  }

  static async updateMemberRole(groupId: string, userId: string, role: string): Promise<{ success: boolean; message?: string }> {
    return await api.put(`/group/${groupId}/members/${userId}/role`, { role });
  }

  // Users
  static async searchUsers(query: string): Promise<{ success: boolean; data?: { items: User[]; total: number; has_more: boolean }; message?: string }> {
    return await api.get('/user/search', { params: { keyword: query } });
  }

  static async getUser(userId: string): Promise<{ success: boolean; data?: User; message?: string }> {
    return await api.get<User>(`/user/${userId}`);
  }

  static async getProfile(): Promise<{ success: boolean; data?: User; message?: string }> {
    return await api.get<User>('/user/profile');
  }

  static async updateProfile(data: Partial<User>): Promise<{ success: boolean; data?: User; message?: string }> {
    return await api.put<User>('/user/profile', data);
  }

  // Favorites
  static async getUserFavorites(): Promise<{ success: boolean; data?: Favorite[]; message?: string }> {
    return await api.get<Favorite[]>('/chat/favorites');
  }

  static async addFavorite(messageId: string, note?: string): Promise<{ success: boolean; data?: Favorite; message?: string }> {
    return await api.post<Favorite>('/chat/favorite', { message_id: messageId, note });
  }

  static async removeFavorite(favoriteId: string): Promise<{ success: boolean; message?: string }> {
    return await api.delete(`/chat/favorite/${favoriteId}`);
  }

  // File Upload
  static async uploadFile(
    file: File,
    type: 'image' | 'file' = 'file',
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; data?: { url: string; file_name: string; file_size: number; mime_type: string }; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // 直接使用 axios 实例来处理 form-data
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // @ts-ignore - onUploadProgress 是 axios 的特性
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response;
  }

  // Message Forward
  static async forwardMessage(
    messageId: string,
    conversationIds: string[],
    additionalText?: string
  ): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    return await api.post<Message[]>('/chat/messages/forward', {
      message_id: messageId,
      conversation_ids: conversationIds,
      additional_text: additionalText,
    });
  }

  // Calls
  static async initiateCall(
    calleeId: string,
    callType: 'video' | 'voice',
    conversationId?: string
  ): Promise<{ success: boolean; data?: CallRecord; message?: string }> {
    return await api.post<CallRecord>('/call/initiate', {
      callee_id: calleeId,
      type: callType,
      conversation_id: conversationId,
    });
  }

  static async acceptCall(
    callId: string
  ): Promise<{ success: boolean; data?: CallRecord; message?: string }> {
    return await api.post<CallRecord>(`/call/${callId}/accept`);
  }

  static async rejectCall(
    callId: string
  ): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/call/${callId}/reject`);
  }

  static async endCall(
    callId: string
  ): Promise<{ success: boolean; data?: CallRecord; message?: string }> {
    return await api.post<CallRecord>(`/call/${callId}/end`);
  }

  static async getCallRecord(
    callId: string
  ): Promise<{ success: boolean; data?: CallRecord; message?: string }> {
    return await api.get<CallRecord>(`/call/${callId}`);
  }

  static async getUserCallRecords(
    limit: number = 50
  ): Promise<{ success: boolean; data?: CallRecord[]; message?: string }> {
    return await api.get<CallRecord[]>('/call/s', { params: { limit } });
  }

  // Search
  static async searchMessages(
    query: string,
    limit: number = 50
  ): Promise<{ success: boolean; data?: Message[]; message?: string }> {
    return await api.get<Message[]>('/chat/search/messages', { params: { q: query, limit } });
  }

  static async searchGroups(
    query: string,
    limit: number = 50
  ): Promise<{ success: boolean; data?: Group[]; message?: string }> {
    return await api.get<Group[]>('/chat/search/groups', { params: { q: query, limit } });
  }

  // Mentions
  static async getUserMentions(
    limit: number = 50
  ): Promise<{ success: boolean; data?: Mention[]; message?: string }> {
    return await api.get<Mention[]>('/chat/mentions', { params: { limit } });
  }

  static async getUnreadMentionCount(): Promise<{ success: boolean; data?: { count: number }; message?: string }> {
    return await api.get<{ count: number }>('/chat/mentions/unread-count');
  }

  static async markMentionAsRead(mentionId: string): Promise<{ success: boolean; message?: string }> {
    return await api.post(`/chat/mention/${mentionId}/read`);
  }

  static async markAllMentionsAsRead(): Promise<{ success: boolean; message?: string }> {
    return await api.post('/chat/mentions/read-all');
  }
}

export default ChatService;
