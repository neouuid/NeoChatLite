import { create } from 'zustand';
import { Conversation, Message } from '../types';

// 内存优化常量
const MAX_MESSAGES_PER_CONVERSATION = 200; // 每个会话最多保留 200 条消息
const MAX_CONVERSATIONS = 100; // 最多保留 100 个会话

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  isSending: boolean;
  // 分页加载状态
  isLoadingMore: Record<string, boolean>;
  hasMoreMessages: Record<string, boolean>;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  clearChat: () => void;
  // 内存优化 actions
  trimMessages: (conversationId: string, maxCount?: number) => void;
  clearOldConversations: () => void;
  // 分页加载 actions
  setLoadingMore: (conversationId: string, loading: boolean) => void;
  setHasMoreMessages: (conversationId: string, hasMore: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  isLoading: false,
  isSending: false,
  isLoadingMore: {},
  hasMoreMessages: {},

  setConversations: (conversations: Conversation[]) => {
    // 内存优化：限制会话数量
    const trimmedConversations = conversations.slice(0, MAX_CONVERSATIONS);
    set({ conversations: trimmedConversations });
  },

  addConversation: (conversation: Conversation) => {
    set((state) => {
      const newConversations = [conversation, ...state.conversations];
      // 内存优化：限制会话数量
      const trimmedConversations = newConversations.slice(0, MAX_CONVERSATIONS);
      return { conversations: trimmedConversations };
    });
  },

  updateConversation: (id: string, updates: Partial<Conversation>) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    }));
  },

  removeConversation: (id: string) => {
    set((state) => {
      // 同时删除该会话的消息以释放内存
      const newMessages = { ...state.messages };
      delete newMessages[id];

      return {
        conversations: state.conversations.filter((conv) => conv.id !== id),
        currentConversation:
          state.currentConversation?.id === id ? null : state.currentConversation,
        messages: newMessages,
      };
    });
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation });
  },

  setMessages: (conversationId: string, messages: Message[]) => {
    // 内存优化：限制消息数量
    const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: trimmedMessages,
      },
    }));
  },

  addMessage: (conversationId: string, message: Message) => {
    set((state) => {
      const currentMsgs = state.messages[conversationId] || [];
      const newMsgs = [...currentMsgs, message];
      // 内存优化：自动裁剪旧消息
      const trimmedMsgs = newMsgs.slice(-MAX_MESSAGES_PER_CONVERSATION);

      return {
        messages: {
          ...state.messages,
          [conversationId]: trimmedMsgs,
        },
      };
    });
    // Also update conversation last message
    get().updateConversation(conversationId, {
      last_message: message.type === 'text' ? message.content : `[${message.type}]`,
      last_msg_at: message.created_at,
    });
  },

  prependMessages: (conversationId: string, messages: Message[]) => {
    set((state) => {
      const currentMsgs = state.messages[conversationId] || [];
      const newMsgs = [...messages, ...currentMsgs];
      // 内存优化：限制总消息数量
      const trimmedMsgs = newMsgs.slice(-MAX_MESSAGES_PER_CONVERSATION);

      return {
        messages: {
          ...state.messages,
          [conversationId]: trimmedMsgs,
        },
      };
    });
  },

  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    }));
  },

  removeMessage: (conversationId: string, messageId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg.id !== messageId
        ),
      },
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSending: (sending: boolean) => {
    set({ isSending: sending });
  },

  clearChat: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: {},
    });
  },

  // 内存优化：裁剪指定会话的消息
  trimMessages: (conversationId: string, maxCount: number = MAX_MESSAGES_PER_CONVERSATION) => {
    set((state) => {
      const currentMsgs = state.messages[conversationId] || [];
      if (currentMsgs.length <= maxCount) return state;

      return {
        messages: {
          ...state.messages,
          [conversationId]: currentMsgs.slice(-maxCount),
        },
      };
    });
  },

  // 内存优化：清理不在会话列表中的旧消息
  clearOldConversations: () => {
    set((state) => {
      const validConversationIds = new Set(state.conversations.map(c => c.id));
      const newMessages: Record<string, Message[]> = {};

      // 只保留有效会话的消息
      Object.keys(state.messages).forEach(id => {
        if (validConversationIds.has(id)) {
          newMessages[id] = state.messages[id];
        }
      });

      return { messages: newMessages };
    });
  },

  // 分页加载：设置加载更多状态
  setLoadingMore: (conversationId: string, loading: boolean) => {
    set((state) => ({
      isLoadingMore: {
        ...state.isLoadingMore,
        [conversationId]: loading,
      },
    }));
  },

  // 分页加载：设置是否有更多消息
  setHasMoreMessages: (conversationId: string, hasMore: boolean) => {
    set((state) => ({
      hasMoreMessages: {
        ...state.hasMoreMessages,
        [conversationId]: hasMore,
      },
    }));
  },
}));
