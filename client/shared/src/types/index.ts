// TypeScript type definitions for NeoChat

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  created_at: string;
  updated_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  alias?: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  friend?: User;
}

export interface Conversation {
  id: string;
  type: 'single' | 'group';
  name?: string;
  avatar?: string;
  last_message?: string;
  last_msg_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'owner';
  nickname?: string;
  last_read_at?: string;
  unread_count: number;
  muted: boolean;
  joined_at: string;
  user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  media_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
  reply_to?: Message;
  // 消息已读统计（群聊使用）
  read_count?: number;
  total_count?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  message_id: string;
  note?: string;
  created_at: string;
  message?: Message;
}

export interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  conversation_id?: string;
  type: 'video' | 'voice';
  status: 'calling' | 'in_progress' | 'completed' | 'missed' | 'rejected' | 'cancelled';
  started_at?: string;
  answered_at?: string;
  ended_at?: string;
  duration: number;
  created_at: string;
  updated_at: string;
  caller?: User;
  callee?: User;
}

// Auth types
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  nickname: string;
  phone?: string;
  email?: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Chat: { conversationId: string };
  GroupChat: { conversationId: string };
  Profile: undefined;
  ViewProfile: { userId: string };
  FriendManage: undefined;
  AddFriend: undefined;
  Blocklist: undefined;
  GroupInfo: { groupId: string };
  GroupMembers: { conversationId: string };
  AddGroupMembers: { conversationId: string };
  CreateGroup: undefined;
  ImageViewer: { url: string };
  FileViewer: { url: string; name: string };
  Search: undefined;
  ChatSettings: { conversationId: string };
  Settings: undefined;
  NotificationSettings: undefined;
  Theme: undefined;
  ChatBackground: undefined;
  ChatBackup: undefined;
  DataClear: undefined;
  About: undefined;
  Favorites: undefined;
  Forward: { messageId: string };
  VideoCall: { conversationId: string; userId?: string };
  VoiceCall: { conversationId: string; userId?: string };
  AccountSecurity: undefined;
};
