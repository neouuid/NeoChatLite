// 提及选择器组件

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants';
import { Avatar } from './Avatar';
import { formatDisplayName } from '../utils';

interface MentionPickerProps {
  members: User[];
  query: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  visible: boolean;
}

export const MentionPicker: React.FC<MentionPickerProps> = ({
  members,
  query,
  onSelect,
  visible,
}) => {
  if (!visible || members.length === 0) {
    return null;
  }

  // 过滤成员
  const filteredMembers = members.filter((member) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      member.nickname.toLowerCase().includes(lowerQuery) ||
      member.username.toLowerCase().includes(lowerQuery)
    );
  });

  if (filteredMembers.length === 0) {
    return null;
  }

  const renderMemberItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Avatar
        uri={item.avatar}
        nickname={formatDisplayName(item.nickname, item.username)}
        size="sm"
        style={styles.avatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {formatDisplayName(item.nickname, item.username)}
        </Text>
        <Text style={styles.memberUsername} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
      <Ionicons
        name="at-outline"
        size={20}
        color={COLORS.primary}
        style={styles.atIcon}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>选择要提及的成员</Text>
      </View>
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.dark.border,
    maxHeight: 200,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  headerTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  list: {
    maxHeight: 160,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  memberUsername: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  atIcon: {
    marginLeft: SPACING.sm,
  },
});
