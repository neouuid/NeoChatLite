// 桌面端收藏面板

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';
import type { Favorite, Message, User } from '@neochat/shared/src/types';

interface FavoritesPanelProps {
  onSelectMessage?: (favorite: Favorite & { message?: Message }) => void;
  onForwardMessage?: (favorite: Favorite) => void;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  onSelectMessage,
  onForwardMessage,
}) => {
  const { user: currentUser } = useAuthStore();
  const [favorites, setFavorites] = useState<(Favorite & { message?: Message; user?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载收藏列表
  const loadFavorites = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await chatService.getUserFavorites();
      if (response.success && response.data) {
        setFavorites(response.data as any);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 取消收藏
  const handleRemoveFavorite = (favorite: Favorite) => {
    Alert.alert(
      '取消收藏',
      '确定要取消收藏这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await chatService.removeFavorite(favorite.id);
              if (response.success) {
                setFavorites((prev) => prev.filter((f) => f.id !== favorite.id));
              } else {
                Alert.alert('错误', response.message || '操作失败');
              }
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '操作失败');
            }
          },
        },
      ]
    );
  };

  // 转发消息
  const handleForward = (favorite: Favorite) => {
    if (onForwardMessage) {
      onForwardMessage(favorite);
    }
  };

  // 跳转到消息位置
  const handleGoToMessage = (favorite: Favorite & { message?: Message }) => {
    onSelectMessage?.(favorite);
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 渲染收藏项
  const renderFavoriteItem = (favorite: Favorite & { message?: Message; user?: User }) => {
    const message = favorite.message;
    const sender = message?.sender;
    const displayName = sender
      ? formatDisplayName(sender.nickname, sender.username)
      : '未知用户';

    return (
      <View key={favorite.id} style={styles.favoriteItem}>
        <TouchableOpacity
          style={styles.favoriteContent}
          onPress={() => handleGoToMessage(favorite)}
          activeOpacity={0.7}
        >
          {sender && (
            <Avatar
              uri={sender.avatar}
              nickname={displayName}
              size="sm"
              style={styles.senderAvatar}
            />
          )}
          <View style={styles.favoriteInfo}>
            <View style={styles.favoriteHeader}>
              <Text style={styles.senderName}>{displayName}</Text>
              <Text style={styles.favoriteTime}>{formatDate(favorite.created_at)}</Text>
            </View>
            {message && (
              <Text style={styles.messageContent} numberOfLines={2}>
                {message.content}
              </Text>
            )}
            {favorite.note && (
              <View style={styles.noteContainer}>
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={COLORS.dark.text.tertiary}
                  style={styles.noteIcon}
                />
                <Text style={styles.noteText}>{favorite.note}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.favoriteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleForward(favorite)}
          >
            <Ionicons name="arrow-redo-outline" size={20} color={COLORS.dark.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveFavorite(favorite)}
          >
            <Ionicons name="bookmark-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的收藏</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={COLORS.dark.text.tertiary} />
            <Text style={styles.emptyTitle}>暂无收藏</Text>
            <Text style={styles.emptySubtext}>长按消息可以添加收藏</Text>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favorites.map((favorite) => (
              <React.Fragment key={favorite.id}>
                {renderFavoriteItem(favorite)}
                <View style={styles.separator} />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.dark.border,
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  headerTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  loadingText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyState: {
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
  },
  favoritesList: {
    paddingVertical: SPACING.xs,
  },
  favoriteItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  favoriteContent: {
    flexDirection: 'row',
    flex: 1,
  },
  senderAvatar: {
    marginRight: SPACING.md,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  senderName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  favoriteTime: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  messageContent: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.dark.border,
  },
  noteIcon: {
    marginRight: SPACING.xs,
  },
  noteText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    flex: 1,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginLeft: SPACING.md + 40,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 40 + SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
