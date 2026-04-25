// Chat Store 测试
/// <reference types="jest" />

import { useChatStore } from './useChatStore';
import type { Conversation, Message } from '../types';

  describe('useChatStore', () => {
    beforeEach(() => {
      // 每次测试前重置 store
      useChatStore.setState({
        conversations: [],
        currentConversation: null,
        messages: {},
        isLoading: false,
        isSending: false,
      });
  });

  describe('conversations', () => {
    it('应该设置会话列表', () => {
      const convs: Conversation[] = [
        {
          id: '1',
          type: 'single',
          name: '测试会话',
          created_by: 'user1' as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      useChatStore.getState().setConversations(convs);
      expect(useChatStore.getState().conversations).toEqual(convs);
    });

    it('应该添加会话', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '新会话',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().addConversation(conv);
      expect(useChatStore.getState().conversations).toHaveLength(1);
      expect(useChatStore.getState().conversations[0]).toEqual(conv);
    });

    it('应该更新会话', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '旧名称',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().setConversations([conv]);
      useChatStore.getState().updateConversation('1', { name: '新名称' });

      expect(useChatStore.getState().conversations[0].name).toBe('新名称');
    });

    it('应该删除会话', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '测试会话',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().setConversations([conv]);
      useChatStore.getState().removeConversation('1');

      expect(useChatStore.getState().conversations).toHaveLength(0);
    });
  });

  describe('currentConversation', () => {
    it('应该设置当前会话', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '当前会话',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().setCurrentConversation(conv);
      expect(useChatStore.getState().currentConversation).toEqual(conv);
    });

    it('应该清除当前会话', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '当前会话',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().setCurrentConversation(conv);
      useChatStore.getState().setCurrentConversation(null);

      expect(useChatStore.getState().currentConversation).toBeNull();
    });
  });

  describe('messages', () => {
    it('应该设置消息', () => {
      const msgs: Message[] = [
        {
          id: '1',
          conversation_id: 'conv1',
          sender_id: 'user1' as any,
          type: 'text',
          content: '测试消息',
          is_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      useChatStore.getState().setMessages('conv1', msgs);
      expect(useChatStore.getState().messages['conv1']).toEqual(msgs);
    });

    it('应该添加消息', () => {
      const msg: Message = {
        id: '1',
        conversation_id: 'conv1',
        sender_id: 'user1' as any,
        type: 'text',
        content: '新消息',
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().addMessage('conv1', msg);
      expect(useChatStore.getState().messages['conv1']).toHaveLength(1);
      expect(useChatStore.getState().messages['conv1'][0]).toEqual(msg);
    });
  });

  describe('loading states', () => {
    it('应该设置加载状态', () => {
      useChatStore.getState().setLoading(true);
      expect(useChatStore.getState().isLoading).toBe(true);

      useChatStore.getState().setLoading(false);
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('应该设置发送状态', () => {
      useChatStore.getState().setSending(true);
      expect(useChatStore.getState().isSending).toBe(true);

      useChatStore.getState().setSending(false);
      expect(useChatStore.getState().isSending).toBe(false);
    });
  });

  describe('clearChat', () => {
    it('应该清除所有聊天数据', () => {
      const conv: Conversation = {
        id: '1',
        type: 'single',
        name: '测试会话',
        created_by: 'user1' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      useChatStore.getState().setConversations([conv]);
      useChatStore.getState().setCurrentConversation(conv);
      useChatStore.getState().setMessages('1', []);
      useChatStore.getState().setLoading(true);

      useChatStore.getState().clearChat();

      expect(useChatStore.getState().conversations).toEqual([]);
      expect(useChatStore.getState().currentConversation).toBeNull();
      expect(useChatStore.getState().messages).toEqual({});
    });
  });

  describe('内存优化', () => {
    it('应该限制会话数量', () => {
      const convs: Conversation[] = [];
      for (let i = 0; i < 150; i++) {
        convs.push({
          id: `${i}`,
          type: 'single',
          name: `会话 ${i}`,
          created_by: 'user1' as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      useChatStore.getState().setConversations(convs);
      expect(useChatStore.getState().conversations.length).toBeLessThanOrEqual(100);
    });

    it('应该限制每个会话的消息数量', () => {
      const msgs: Message[] = [];
      for (let i = 0; i < 300; i++) {
        msgs.push({
          id: `${i}`,
          conversation_id: 'conv1',
          sender_id: 'user1' as any,
          type: 'text',
          content: `消息 ${i}`,
          is_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      useChatStore.getState().setMessages('conv1', msgs);
      expect(useChatStore.getState().messages['conv1'].length).toBeLessThanOrEqual(200);
    });
  });
});
