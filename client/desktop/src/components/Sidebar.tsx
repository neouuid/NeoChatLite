// 桌面端侧边栏

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  COLORS,
  SPACING,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';

type ActivePanel = 'chat' | 'contacts' | 'favorites';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
  onAvatarPress?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePanel, onPanelChange, onAvatarPress }) => {
  const { user } = useAuthStore();

  const displayName = user ? formatDisplayName(user.nickname, user.username) : '?';

  const handleTabPress = (tab: ActivePanel) => {
    onPanelChange(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* 用户头像 */}
        <TouchableOpacity style={styles.avatarContainer} onPress={onAvatarPress}>
          <Avatar
            uri={user?.avatar}
            nickname={displayName}
            size="md"
          />
        </TouchableOpacity>

        {/* 聊天图标 */}
        <TouchableOpacity
          style={[
            styles.iconContainer,
            activePanel === 'chat' && styles.iconContainerActive,
          ]}
          onPress={() => handleTabPress('chat')}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color={activePanel === 'chat' ? COLORS.primary : COLORS.dark.text.secondary}
          />
        </TouchableOpacity>

        {/* 联系人图标 */}
        <TouchableOpacity
          style={[
            styles.iconContainer,
            activePanel === 'contacts' && styles.iconContainerActive,
          ]}
          onPress={() => handleTabPress('contacts')}
        >
          <Ionicons
            name="people-outline"
            size={24}
            color={activePanel === 'contacts' ? COLORS.primary : COLORS.dark.text.secondary}
          />
        </TouchableOpacity>

        {/* 收藏图标 */}
        <TouchableOpacity
          style={[
            styles.iconContainer,
            activePanel === 'favorites' && styles.iconContainerActive,
          ]}
          onPress={() => handleTabPress('favorites')}
        >
          <Ionicons
            name="bookmark-outline"
            size={24}
            color={activePanel === 'favorites' ? COLORS.primary : COLORS.dark.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        {/* 设置图标 */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {}}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={COLORS.dark.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 72,
    backgroundColor: COLORS.dark.background,
    paddingVertical: SPACING.xl,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.dark.border,
  },
  topSection: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
});
