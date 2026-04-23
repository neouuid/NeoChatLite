import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useChatStore,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  formatDisplayName,
  ChatService,
} from 'neochat-shared';
import type { User, Message, Mention } from 'neochat-shared/src/types';

interface MentionsWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const MentionsWindow: React.FC<MentionsWindowProps> = ({
  onBack,
  onNavigate,
}) => {
  const { user } = useAuthStore();
  const { setHighlightedMessageId, ensureMessageLoaded } = useChatStore();

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载提及数据
  const loadMentions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ChatService.getUserMentions(50);
      if (response.success && response.data) {
        setMentions(response.data);
      } else {
        setMentions([]);
      }
    } catch (error) {
      console.error('Failed to load mentions:', error);
      Alert.alert('错误', '加载提及列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentions();
  }, [loadMentions]);

  // 点击提及
  const handleMentionPress = useCallback(async (mention: Mention) => {
    if (mention.message) {
      // 标记为已�?
      try {
        await ChatService.markMentionAsRead(mention.id);
        // 更新本地状�?
        setMentions(prev => prev.map(m =>
          m.id === mention.id ? { ...m, has_read: true } : m
        ));
      } catch (error) {
        console.error('Failed to mark mention as read:', error);
      }

      // 设置高亮消息 ID
      setHighlightedMessageId(mention.message.id);
      // 确保消息已加�?
      await ensureMessageLoaded(mention.message.conversation_id, mention.message.id);
      // 跳转到聊天页�?
      onNavigate?.('Chat', { conversationId: mention.message.conversation_id });
    }
  }, [setHighlightedMessageId, ensureMessageLoaded, onNavigate]);

  // 标记所有为已读
  const handleMarkAllRead = useCallback(async () => {
    try {
      const result = await ChatService.markAllMentionsAsRead();
      if (result.success) {
        // 更新本地状�?
        setMentions(prev => prev.map(m => ({ ...m, has_read: true })));
        Alert.alert('成功', '已标记所有提及为已读');
      } else {
        Alert.alert('错误', result.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to mark all read:', error);
      Alert.alert('错误', '操作失败');
    }
  }, []);

  // 格式化日�?
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1D2129" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的提及</Text>
        {mentions.some(m => !m.has_read) && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllButtonText}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载�?..</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {mentions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="at-outline" size={64} color="#86909c" />
              <Text style={styles.emptyTitle}>暂无提及</Text>
              <Text style={styles.emptySubtext}>当有人在聊天中提到你时，会在这里显示</Text>
            </View>
          ) : (
            <View style={styles.section}>
              {mentions.map((item) => {
                const message = item.message;
                const sender = message?.sender;
                const displayName = sender
                  ? formatDisplayName(sender.nickname, sender.username)
                  : '未知用户';
                const initials = sender ? formatDisplayName(sender.nickname, sender.username).substring(0, 1) : '?';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.mentionItem, !item.has_read && styles.mentionItemUnread]}
                    onPress={() => handleMentionPress(item)}
                  >
                    <View style={styles.mentionAvatar}>
                      <Text style={styles.mentionAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.mentionContent}>
                      <View style={styles.mentionHeader}>
                        <Text style={styles.mentionTitle} numberOfLines={1}>
                          {displayName} 提到了你
                        </Text>
                        <Text style={styles.mentionTime}>{formatDate(item.created_at)}</Text>
                      </View>
                      {message && (
                        <Text style={styles.mentionMessage} numberOfLines={2}>
                          {message.content}
                        </Text>
                      )}
                    </View>
                    {!item.has_read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 底部安全区域 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllButtonText: {
    color: '#6366f1',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    position: 'relative',
  },
  mentionItemUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  mentionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  mentionAvatarText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mentionContent: {
    flex: 1,
  },
  mentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mentionTitle: {
    flex: 1,
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  mentionTime: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  mentionMessage: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: '#86909c',
    fontSize: TYPOGRAPHY.sizes.md,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
