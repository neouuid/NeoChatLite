// 桌面端聊天设置页面

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  type RootStackParamList,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User, Conversation } from 'neochat-shared/src/types';

export const ChatSettingsWindow: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatSettings'>>();
  const { conversationId } = route.params;
  const { user: currentUser } = useAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stickToTop, setStickToTop] = useState(false);

  // 加载会话信息
  const loadConversation = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // 这里应该调用 API 加载会话详情
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 删除好友
  const handleDeleteFriend = () => {
    Alert.alert(
      '删除好友',
      '确定要删除这个好友吗？删除后将无法接收对方的消息。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('成功', '已删除好友');
              navigation.goBack();
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '删除失败');
            }
          },
        },
      ]
    );
  };

  // 清空聊天记录
  const handleClearChat = () => {
    Alert.alert(
      '清空聊天记录',
      '确定要清空这个聊天的所有消息吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('成功', '聊天记录已清空');
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '清空失败');
            }
          },
        },
      ]
    );
  };

  // 查看群组成员
  const handleViewMembers = () => {
    navigation.navigate('GroupMembers', { conversationId });
  };

  // 查看用户资料
  const handleViewProfile = (userId: string) => {
    navigation.navigate('ViewProfile', { userId });
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 会话信息 */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.avatarContainer}>
              <Avatar
                uri={undefined}
                nickname="用户"
                size="xl"
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>用户名</Text>
              <Text style={styles.userStatus}>在线</Text>
            </View>
          </View>
        </View>

        {/* 设置项 */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            {/* 消息免打扰 */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications-off-outline" size={20} color="#1a1a2e" />
                </View>
                <Text style={styles.settingTitle}>消息免打扰</Text>
              </View>
              <Switch
                value={muted}
                onValueChange={setMuted}
                trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                thumbColor={muted ? '#5b7cff' : '#8b8bb3'}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* 置顶聊天 */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="push-outline" size={20} color="#1a1a2e" />
                </View>
                <Text style={styles.settingTitle}>置顶聊天</Text>
              </View>
              <Switch
                value={stickToTop}
                onValueChange={setStickToTop}
                trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                thumbColor={stickToTop ? '#5b7cff' : '#8b8bb3'}
              />
            </View>
          </View>
        </View>

        {/* 操作项 */}
        <View style={styles.section}>
          <View style={styles.actionsCard}>
            {/* 查找聊天记录 */}
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="search-outline" size={20} color="#1a1a2e" />
                </View>
                <Text style={styles.actionTitle}>查找聊天记录</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8080a0" />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            {/* 清空聊天记录 */}
            <TouchableOpacity style={styles.actionItem} onPress={handleClearChat}>
              <View style={styles.actionLeft}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="trash-outline" size={20} color="#1a1a2e" />
                </View>
                <Text style={styles.actionTitle}>清空聊天记录</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8080a0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 危险操作 */}
        <View style={styles.section}>
          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteFriend}>
              <View style={styles.dangerLeft}>
                <View style={styles.dangerIconContainer}>
                  <Ionicons name="person-remove-outline" size={20} color={COLORS.error} />
                </View>
                <Text style={styles.dangerTitle}>删除好友</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  avatarContainer: {
    marginRight: SPACING.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  userStatus: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  dangerCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 24 + 40 + SPACING.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dangerTitle: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
