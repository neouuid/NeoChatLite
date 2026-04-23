// 收藏页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useChatStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { Favorite, Message, User, RootStackParamList } from 'neochat-shared/src/types';
import type { NavigationProp } from '@react-navigation/native';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user: currentUser } = useAuthStore();
  const { setHighlightedMessageId, ensureMessageLoaded } = useChatStore();
  const [favorites, setFavorites] = useState<(Favorite & { message?: Message; user?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载收藏列表
  const loadFavorites = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await chatService.getUserFavorites();
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Alert.alert('错误', '加载收藏列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 取消收藏
  const handleRemoveFavorite = (favorite: Favorite) => {
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
              const response = await chatService.removeFavorite(favorite.id);
              if (response.success) {
                setFavorites((prev) => prev.filter((f) => f.id !== favorite.id));
                Alert.alert('成功', '已取消收�?);
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
    navigation.navigate('Forward', { messageId: favorite.message_id });
  };

  // 跳转到消息位�?  const handleGoToMessage = async (favorite: Favorite) => {
    // 获取消息所属的会话 ID 并导�?    const message = favorite.message;
    if (message) {
      // 设置高亮消息 ID
      setHighlightedMessageId(favorite.message_id);
      // 确保消息已加�?      await ensureMessageLoaded(message.conversation_id, favorite.message_id);
      // 根据会话类型导航到对应的聊天页面
      navigation.navigate('Chat', { conversationId: message.conversation_id });
    } else {
      Alert.alert('提示', '无法定位到消息位�?);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 格式化日�?  const formatDate = (dateStr: string) => {
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

  // 渲染收藏�?  const renderFavoriteItem = (favorite: Favorite & { message?: Message; user?: User }) => {
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的收藏</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载�?..</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerRight: {
    width: 40,
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
