// 会话列表项组件

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Conversation } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { formatRelativeTime, formatDisplayName } from '../utils';
import { Avatar } from './Avatar';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const ConversationItemComponent: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  // Memoized display name
  const displayName = useMemo((): string => {
    if (conversation.type === 'group') {
      return conversation.name || '群聊';
    }
    // 单聊：找到对方用户并显示名称
    if (conversation.members && conversation.members.length > 0) {
      // TODO: 需要根据当前用户ID过滤，找到对方用户
      const member = conversation.members[0];
      if (member.user) {
        return formatDisplayName(member.user.nickname, member.user.username);
      }
    }
    return '聊天';
  }, [conversation]);

  // Memoized avatar URI
  const avatarUri = useMemo((): string | undefined => {
    if (conversation.type === 'group') {
      return conversation.avatar;
    }
    // 单聊：找到对方用户并显示头像
    if (conversation.members && conversation.members.length > 0) {
      const member = conversation.members[0];
      if (member.user) {
        return member.user.avatar;
      }
    }
    return undefined;
  }, [conversation]);

  const unreadCount = conversation.unread_count || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        uri={avatarUri}
        nickname={displayName}
        size="md"
        style={styles.avatar}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {conversation.last_msg_at && (
            <Text style={styles.time}>
              {formatRelativeTime(conversation.last_msg_at)}
            </Text>
          )}
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.message} numberOfLines={1}>
            {conversation.last_message || '暂无消息'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.dark.background,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    flex: 1,
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  time: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginLeft: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

// Export memoized version as the default export
export const ConversationItem = React.memo(ConversationItemComponent, (prevProps, nextProps) => {
  // Only re-render if conversation changed significantly
  const prevConv = prevProps.conversation;
  const nextConv = nextProps.conversation;
  return (
    prevConv.id === nextConv.id &&
    prevConv.last_message === nextConv.last_message &&
    prevConv.last_msg_at === nextConv.last_msg_at &&
    prevConv.unread_count === nextConv.unread_count &&
    prevConv.name === nextConv.name &&
    prevConv.avatar === nextConv.avatar
  );
});
