// 桌面端收藏页�?

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  useChatStore,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { FavoriteMessage, User, Message } from 'neochat-shared/src/types';

interface FavoritesWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  onForward?: (messageId: string) => void;
}

export const FavoritesWindow: React.FC<FavoritesWindowProps> = ({
  onBack,
  onNavigate,
  onForward,
}) => {
  const { user: currentUser } = useAuthStore();
  const { setHighlightedMessageId, ensureMessageLoaded } = useChatStore();

  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载收藏列表
  const loadFavorites = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await chatService.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Alert.alert('错误', '加载收藏失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 取消收藏
  const handleRemoveFavorite = useCallback(async (favoriteId: string) => {
    Alert.alert(
      '取消收藏',
      '确定要取消收藏这条消息吗�?,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.removeFavorite(favoriteId);
              setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '取消收藏失败');
            }
          },
        },
      ]
    );
  }, []);

  // 跳转到消�?
  const handleGoToMessage = useCallback(async (favorite: FavoriteMessage) => {
    if (!favorite.message) return;

    // 设置高亮消息 ID
    setHighlightedMessageId(favorite.message.id);
    // 确保消息已加�?
    await ensureMessageLoaded(favorite.message.conversation_id, favorite.message.id);
    // 跳转到聊天页�?
    onNavigate?.('Chat', { conversationId: favorite.message.conversation_id });
  }, [setHighlightedMessageId, ensureMessageLoaded, onNavigate]);

  // 转发消息
  const handleForwardMessage = useCallback((messageId: string) => {
    onForward?.(messageId);
  }, [onForward]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 渲染收藏�?
  const renderFavoriteItem = ({ item }: { item: FavoriteMessage }) => {
    const message = item.message;
    const sender = item.sender;
    const displayName = sender
      ? formatDisplayName(sender.nickname, sender.username)
      : '未知用户';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleGoToMessage(item)}
      >
        {sender && (
          <Avatar
            uri={sender.avatar}
            nickname={displayName}
            size="md"
            style={styles.avatar}
          />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          {message && (
            <Text style={styles.messageText} numberOfLines={3}>
              {message.content}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => message && handleForwardMessage(message.id)}
          >
            <Ionicons name="return-up-forward-outline" size={18} color="#8080a0" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveFavorite(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>收藏</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 内容 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载�?..</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#8080a0" />
          <Text style={styles.emptyTitle}>还没有收�?/Text>
          <Text style={styles.emptySubtext}>收藏的消息会显示在这�?/Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptySubtext: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  time: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  messageText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: SPACING.md,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 24 + 48 + SPACING.md,
  },
});
