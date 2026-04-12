// 聊天详情页面

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Conversation,
  Message,
  useChatStore,
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  formatDisplayName,
  useMediaPicker,
  useMediaUpload,
  type MediaItem,
} from '@neochat/shared';

import { MessageList } from '@neochat/shared/src/components/MessageList';
import { ChatInput } from '@neochat/shared/src/components/ChatInput';
import type { RootStackParamList } from '@neochat/shared';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type RouteParams = { conversationId: string };

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute();
  const { conversationId } = route.params as RouteParams;

  const { user } = useAuthStore();
  const {
    currentConversation,
    messages,
    isLoading,
    isSending,
    setCurrentConversation,
    setMessages,
    addMessage,
    setLoading,
    setSending,
  } = useChatStore();

  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender: string } | null>(null);

  // 媒体上传 hook
  const { isUploading, uploadImage, uploadFile } = useMediaUpload({
    onUploadStart: () => {
      setSending(true);
    },
    onUploadComplete: async (result) => {
      // 发送媒体消息
      await sendMediaMessage(result);
    },
    onUploadError: (error) => {
      setSending(false);
      Alert.alert('上传失败', error.message);
    },
  });

  // 发送媒体消息
  const sendMediaMessage = useCallback(async (result: any) => {
    if (!user) return;

    try {
      const response = await chatService.sendMessage({
        conversation_id: conversationId,
        type: result.type === 'image' ? 'image' : 'file',
        content: '',
        media_url: result.url,
        file_name: result.filename,
        file_size: result.fileSize,
        reply_to_id: replyingTo?.id,
      });

      if (response.success && response.data) {
        addMessage(conversationId, response.data);
      } else {
        Alert.alert('错误', response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('Failed to send media message:', error);
      Alert.alert('错误', '发送消息失败');
    } finally {
      setSending(false);
      setReplyingTo(null);
    }
  }, [user, conversationId, replyingTo, addMessage, setSending]);

  // 媒体选择 hook
  const { pickImage, pickFile } = useMediaPicker({
    onImageSelected: async (item: MediaItem) => {
      if (item.uri) {
        await uploadImage(item.uri, item.filename);
      }
    },
    onFileSelected: async (item: MediaItem) => {
      if (item.uri && item.filename) {
        await uploadFile(item.uri, item.filename, item.mimeType || 'application/octet-stream');
      }
    },
    onError: (error) => {
      Alert.alert('选择失败', error.message);
    },
  });

  // 处理选择图片
  const handleSendImage = useCallback(async () => {
    await pickImage();
  }, [pickImage]);

  // 处理选择文件
  const handleSendFile = useCallback(async () => {
    await pickFile();
  }, [pickFile]);

  // 处理图片点击
  const handleImagePress = useCallback((message: Message) => {
    if (message.media_url) {
      navigation.navigate('ImageViewer' as never, { url: message.media_url } as never);
    }
  }, [navigation]);

  // 处理文件点击
  const handleFilePress = useCallback((message: Message) => {
    if (message.media_url && message.file_name) {
      navigation.navigate('FileViewer' as never, {
        url: message.media_url,
        name: message.file_name,
      } as never);
    }
  }, [navigation]);

  // 获取会话信息
  const loadConversation = useCallback(async () => {
    try {
      const response = await chatService.getConversation(conversationId);
      if (response.success && response.data) {
        setCurrentConversation(response.data);
        // 设置导航栏标题
        navigation.setOptions({
          title: getConversationTitle(response.data),
        });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      Alert.alert('错误', '加载会话信息失败');
    }
  }, [conversationId, setCurrentConversation, navigation]);

  // 获取消息列表
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversationMessages(conversationId);
      if (response.success && response.data) {
        setMessages(conversationId, response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [conversationId, setMessages, setLoading]);

  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [loadConversation, loadMessages]);

  // 获取会话标题
  const getConversationTitle = (conv: Conversation): string => {
    if (conv.type === 'group') {
      return conv.name || '群聊';
    }
    // 单聊：显示对方名称
    if (conv.members && user) {
      const otherMember = conv.members.find((m) => m.user_id !== user.id);
      if (otherMember?.user) {
        return formatDisplayName(otherMember.user.nickname, otherMember.user.username);
      }
    }
    return '聊天';
  };

  // 标记会话为已读
  const markAsRead = useCallback(async () => {
    try {
      await chatService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [conversationId]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user) return;

    try {
      setSending(true);
      const response = await chatService.sendMessage({
        conversation_id: conversationId,
        type: 'text',
        content,
        reply_to_id: replyingTo?.id,
      });

      if (response.success && response.data) {
        addMessage(conversationId, response.data);
      } else {
        Alert.alert('错误', response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('错误', '发送消息失败');
    } finally {
      setSending(false);
      setReplyingTo(null);
    }
  }, [user, conversationId, replyingTo, addMessage, setSending]);

  // 加载更多消息
  const handleLoadMore = useCallback(() => {
    // TODO: 实现分页加载
  }, []);

  // 消息点击
  const handleMessagePress = useCallback((message: Message) => {
    // TODO: 实现消息点击操作（复制、转发等）
  }, []);

  // 消息长按
  const handleMessageLongPress = useCallback((message: Message) => {
    // 设置回复
    if (message.sender) {
      setReplyingTo({
        id: message.id,
        content: message.content,
        sender: formatDisplayName(message.sender.nickname, message.sender.username),
      });
    }
  }, []);

  // 头像点击
  const handleAvatarPress = useCallback((clickedUser: any) => {
    // TODO: 导航到用户资料页面
    console.log('View user profile:', clickedUser.id);
  }, []);

  // 取消回复
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const conversationMessages = messages[conversationId] || [];

  return (
    <View style={styles.container}>
      {/* 消息列表 */}
      <View style={styles.messageListContainer}>
        <MessageList
          messages={conversationMessages}
          currentUserId={user?.id}
          onLoadMore={handleLoadMore}
          onMessagePress={handleMessagePress}
          onMessageLongPress={handleMessageLongPress}
          onAvatarPress={handleAvatarPress}
          onImagePress={handleImagePress}
          onFilePress={handleFilePress}
          isLoadingMore={isLoading}
        />
      </View>

      {/* 输入框 */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        isSending={isSending || isUploading}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  messageListContainer: {
    flex: 1,
  },
});
