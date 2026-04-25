// 消息列表组件

import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User, Conversation } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { formatChatTime, formatDisplayName, parseMessageText, ParsedMention } from '../utils';
import { Avatar } from './Avatar';
import { CachedImage } from './CachedImage';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  conversation?: Conversation;
  onLoadMore?: () => void;
  onMessagePress?: (message: Message) => void;
  onMessageLongPress?: (message: Message) => void;
  onAvatarPress?: (user: User) => void;
  onImagePress?: (message: Message) => void;
  onFilePress?: (message: Message) => void;
  isLoadingMore?: boolean;
  highlightedMessageId?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  conversation,
  onLoadMore,
  onMessagePress,
  onMessageLongPress,
  onAvatarPress,
  onImagePress,
  onFilePress,
  isLoadingMore,
  highlightedMessageId,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const isGroupChat = conversation?.type === 'group';

  // 当高亮消息 ID 变化时，滚动到该消息
  useEffect(() => {
    if (highlightedMessageId && messages.length > 0) {
      const index = messages.findIndex(m => m.id === highlightedMessageId);
      if (index !== -1 && flatListRef.current) {
        // 使用 setTimeout 确保 FlatList 已经渲染
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // 使消息位于屏幕中间
          });
        }, 100);
      }
    }
  }, [highlightedMessageId, messages]);

  // Memoized key extractor for stable keys
  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Memoized render item with stable dependencies
  const renderMessageItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === currentUserId;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);
    const showSenderName = isGroupChat && !isOwn && (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);
    const isLastOwnMessage = isOwn && (index === 0 || messages[index - 1]?.sender_id !== currentUserId);
    const isHighlighted = item.id === highlightedMessageId;

    return (
      <MemoizedMessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        showSenderName={showSenderName}
        showReadStatus={isOwn && isLastOwnMessage}
        isGroupChat={isGroupChat}
        isHighlighted={isHighlighted}
        members={conversation?.members}
        onPress={onMessagePress}
        onLongPress={onMessageLongPress}
        onAvatarPress={onAvatarPress}
        onImagePress={onImagePress}
        onFilePress={onFilePress}
      />
    );
  }, [currentUserId, messages, isGroupChat, conversation?.members, highlightedMessageId, onMessagePress, onMessageLongPress, onAvatarPress, onImagePress, onFilePress]);

  // 渲染加载更多指示器
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }, [isLoadingMore]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderMessageItem}
      inverted
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      // 性能优化属性
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={20}
      updateCellsBatchingPeriod={50}
    />
  );
};

// 消息气泡子组件
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  showReadStatus?: boolean;
  isGroupChat?: boolean;
  isHighlighted?: boolean;
  members?: Conversation['members'];
  onPress?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
  onAvatarPress?: (user: User) => void;
  onImagePress?: (message: Message) => void;
  onFilePress?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  showReadStatus = false,
  isGroupChat = false,
  isHighlighted = false,
  members,
  onPress,
  onLongPress,
  onAvatarPress,
  onImagePress,
  onFilePress,
}) => {
  const handlePress = () => onPress?.(message);
  const handleLongPress = () => onLongPress?.(message);
  const handleAvatarPress = () => message.sender && onAvatarPress?.(message.sender);
  const handleImagePress = () => onImagePress?.(message);
  const handleFilePress = () => onFilePress?.(message);

  // 渲染带提及的文本
  const renderMentionText = (text: string) => {
    const parts = parseMessageText(text, members);

    return parts.map((part: ParsedMention, index: number) => {
      if (part.type === 'mention') {
        return (
          <Text
            key={index}
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText,
              styles.mentionText,
            ]}
          >
            @{part.username || 'user'}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {part.content}
        </Text>
      );
    });
  };

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'document-text-outline';
    if (['doc', 'docx'].includes(ext)) return 'document-text-outline';
    if (['xls', 'xlsx'].includes(ext)) return 'grid-outline';
    if (['ppt', 'pptx'].includes(ext)) return 'easel-outline';
    if (['zip', 'rar', '7z'].includes(ext)) return 'folder-outline';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image-outline';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'play-circle-outline';
    if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) return 'musical-notes-outline';
    return 'document-outline';
  };

  // 获取文件大小显示
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 根据消息类型渲染内容
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={styles.messageTextContainer}>
            {renderMentionText(message.content)}
          </Text>
        );
      case 'image':
        return (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePress}
            activeOpacity={0.8}
          >
            {message.media_url ? (
              <CachedImage
                uri={message.media_url}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={COLORS.dark.text.tertiary} />
                <Text style={[
                  styles.messageText,
                  isOwn ? styles.ownMessageText : styles.otherMessageText,
                  styles.imagePlaceholderText,
                ]}>
                  图片
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      case 'file':
        return (
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={handleFilePress}
            activeOpacity={0.8}
          >
            <View style={styles.fileIconContainer}>
              <Ionicons
                name={getFileIcon(message.file_name || '') as any}
                size={32}
                color={isOwn ? '#ffffff' : COLORS.primary}
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[
                styles.fileName,
                isOwn ? styles.ownMessageText : styles.otherMessageText,
              ]} numberOfLines={1}>
                {message.file_name || '文件'}
              </Text>
              {message.file_size && (
                <Text style={[
                  styles.fileSize,
                  isOwn ? { color: 'rgba(255, 255, 255, 0.7)' } : { color: COLORS.dark.text.secondary },
                ]}>
                  {formatFileSize(message.file_size)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      case 'system':
        return (
          <Text style={styles.systemMessageText}>
            {message.content}
          </Text>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  // 系统消息特殊处理
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        {renderMessageContent()}
      </View>
    );
  }

  return (
    <View style={[
      styles.messageRow,
      isOwn ? styles.ownMessageRow : styles.otherMessageRow,
    ]}>
      {/* 头像（只在对方消息且需要显示时显示） */}
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {showAvatar ? (
            <TouchableOpacity onPress={handleAvatarPress} disabled={!onAvatarPress}>
              <Avatar
                uri={message.sender?.avatar}
                nickname={message.sender ? formatDisplayName(message.sender.nickname, message.sender.username) : '?'}
                size="sm"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      )}

      {/* 消息气泡 */}
      <View style={[
        styles.bubbleContainer,
        isOwn ? styles.ownBubbleContainer : styles.otherBubbleContainer,
      ]}>
        {/* 发送者名称（只在群聊中显示） */}
        {showSenderName && message.sender && (
          <Text style={styles.senderName}>
            {formatDisplayName(message.sender.nickname, message.sender.username)}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.bubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
            isHighlighted && styles.highlightedBubble,
            ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
          delayLongPress={500}
        >
          {renderMessageContent()}

          {/* 时间和状态 */}
          <View style={[
            styles.metaContainer,
            isOwn ? styles.ownMetaContainer : styles.otherMetaContainer,
          ]}>
            {message.is_edited && (
              <Text style={[
                styles.editedText,
                isOwn ? styles.ownTimeText : styles.otherTimeText,
              ]}>
                已编辑
              </Text>
            )}
            <Text style={[
              styles.timeText,
              isOwn ? styles.ownTimeText : styles.otherTimeText,
            ]}>
              {formatChatTime(message.created_at)}
            </Text>
            {showReadStatus && (
              <View style={styles.statusContainer}>
                {isGroupChat ? (
                  // 群聊：显示已读人数
                  <Text style={styles.readCountText}>
                    {message.read_count !== undefined ? `${message.read_count}人已读` : ''}
                  </Text>
                ) : (
                  // 单聊：显示已读/发送状态图标
                  <Ionicons
                    name={message.read_count && message.read_count > 0 ? 'checkmark-done' : 'checkmark'}
                    size={16}
                    color={message.read_count && message.read_count > 0 ? COLORS.primary : COLORS.dark.text.tertiary}
                    style={styles.statusIcon}
                  />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* 自己消息的右侧占位 */}
      {isOwn && <View style={styles.avatarPlaceholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    alignItems: 'flex-end',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 32,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  ownBubbleContainer: {
    alignItems: 'flex-end',
  },
  otherBubbleContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  bubble: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: BORDER_RADIUS.xs,
  },
  otherBubble: {
    backgroundColor: COLORS.dark.surface,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
  },
  highlightedBubble: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  messageTextContainer: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  mentionText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: COLORS.dark.text.primary,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  ownMetaContainer: {
    justifyContent: 'flex-end',
  },
  otherMetaContainer: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: COLORS.dark.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 2,
  },
  readCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  editedText: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  imageContainer: {
    minWidth: 150,
    minHeight: 150,
    maxWidth: 250,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  imagePlaceholderText: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
    gap: SPACING.md,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  fileSize: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  systemMessageText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    backgroundColor: COLORS.dark.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  footerContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});

// Memoized MessageBubble for better FlatList performance
const MemoizedMessageBubble = React.memo(MessageBubble, (prevProps, nextProps) => {
  // Only re-render if message content or relevant props changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.media_url === nextProps.message.media_url &&
    prevProps.message.is_edited === nextProps.message.is_edited &&
    prevProps.message.read_count === nextProps.message.read_count &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showSenderName === nextProps.showSenderName &&
    prevProps.showReadStatus === nextProps.showReadStatus &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});
