// 提及列表页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useChatStore,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  formatDisplayName,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import type { User, Message, RootStackParamList } from '@neochat/shared/src/types';
import type { NavigationProp } from '@react-navigation/native';

// 临时 mock 数据 - 待后端 API 完善后替换
const mockMentions: Array<{
  id: string;
  message_id: string;
  user_id: string;
  has_read: boolean;
  created_at: string;
  message?: Message & { sender?: User; conversation?: any };
}> = [];

export const MentionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { setHighlightedMessageId, ensureMessageLoaded } = useChatStore();

  const [mentions, setMentions] = useState(mockMentions);
  const [isLoading, setIsLoading] = useState(false);

  // 加载提及列表
  const loadMentions = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: 调用后端 API 获取提及列表
      // 临时使用空数据
      setMentions([]);
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
  const handleMentionPress = useCallback(async (mention: any) => {
    if (mention.message) {
      // 设置高亮消息 ID
      setHighlightedMessageId(mention.message.id);
      // 确保消息已加载
      await ensureMessageLoaded(mention.message.conversation_id, mention.message.id);
      // 跳转到聊天页面
      navigation.navigate('Chat', { conversationId: mention.message.conversation_id });
    }
  }, [navigation, setHighlightedMessageId, ensureMessageLoaded]);

  // 标记所有为已读
  const handleMarkAllRead = useCallback(async () => {
    try {
      // TODO: 调用后端 API 标记所有为已读
      Alert.alert('成功', '已标记所有提及为已读');
    } catch (error) {
      console.error('Failed to mark all read:', error);
      Alert.alert('错误', '操作失败');
    }
  }, []);

  // 格式化日期
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

  // 渲染提及项
  const renderMentionItem = ({ item }: { item: typeof mockMentions[0] }) => {
    const message = item.message;
    const sender = message?.sender;
    const displayName = sender
      ? formatDisplayName(sender.nickname, sender.username)
      : '未知用户';

    return (
      <TouchableOpacity
        style={[styles.mentionItem, !item.has_read && styles.mentionItemUnread]}
        onPress={() => handleMentionPress(item)}
      >
        {sender && (
          <Avatar
            uri={sender.avatar}
            nickname={displayName}
            size="md"
            style={styles.mentionAvatar}
          />
        )}
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
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="at-outline" size={64} color={COLORS.dark.text.tertiary} />
      <Text style={styles.emptyTitle}>暂无提及</Text>
      <Text style={styles.emptySubtext}>当有人在聊天中提到你时，会在这里显示</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
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
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={mentions}
          renderItem={renderMentionItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={mentions.length === 0 && styles.emptyListContent}
        />
      )}

      {/* 底部安全区域 */}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  markAllButton: {
    padding: SPACING.xs,
  },
  markAllButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  list: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  mentionItemUnread: {
    backgroundColor: `${COLORS.primary}08`,
  },
  mentionAvatar: {
    marginRight: SPACING.md,
  },
  mentionContent: {
    flex: 1,
  },
  mentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  mentionTitle: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  mentionTime: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  mentionMessage: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    right: SPACING.lg,
    top: '50%',
    marginTop: -4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
