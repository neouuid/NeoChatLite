// 会话列表项组件

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Conversation } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { formatRelativeTime, formatDisplayName } from '../utils';
import { Avatar } from './Avatar';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  // 获取显示名称（单聊时显示对方名称，群聊时显示群名）
  const getDisplayName = (): string => {
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
  };

  // 获取头像（单聊时显示对方头像，群聊时显示群头像）
  const getAvatarUri = (): string | undefined => {
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
  };

  const displayName = getDisplayName();
  const avatarUri = getAvatarUri();
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
