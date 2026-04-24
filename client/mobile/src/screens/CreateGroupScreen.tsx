// 创建群组页面

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User, Friend, RootStackParamList, Conversation } from 'neochat-shared/src/types';
import type { NavigationProp } from '@react-navigation/native';

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user: currentUser } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 加载好友列表
  const loadFriends = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await chatService.getFriends();
      if (response.success && response.data) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
      Alert.alert('错误', '加载好友列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // 切换选中好友
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // 创建群组
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('提示', '请输入群组名称');
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('提示', '请至少选择一位好友');
      return;
    }

    setIsCreating(true);
    try {
      const response = await chatService.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        member_ids: selectedFriends,
      });

      if (response.success && response.data) {
        const conversation = response.data as Conversation;
        Alert.alert('成功', '群组创建成功', [
          {
            text: '确定',
            onPress: () => {
              // 导航到群聊页面
              navigation.navigate('GroupChat', { conversationId: conversation.id });
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '创建群组失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 移除已选好友
  const removeSelectedFriend = (friendId: string) => {
    setSelectedFriends((prev) => prev.filter((id) => id !== friendId));
  };

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // 渲染已选好友
  const renderSelectedFriend = (friendId: string) => {
    const friend = friends.find((f) => f.friend?.id === friendId);
    const friendUser = friend?.friend;
    if (!friendUser) return null;

    return (
      <TouchableOpacity
        key={friendId}
        style={styles.selectedFriendItem}
        onPress={() => removeSelectedFriend(friendId)}
      >
        <Avatar
          uri={friendUser.avatar}
          nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
          size="sm"
        />
        <Ionicons
          name="close-circle"
          size={18}
          color={COLORS.dark.text.secondary}
          style={styles.removeIcon}
        />
      </TouchableOpacity>
    );
  };

  // 渲染好友项
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const friendUser = item.friend;
    if (!friendUser) return null;

    const isSelected = selectedFriends.includes(friendUser.id);

    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => toggleFriendSelection(friendUser.id)}
      >
        <View style={styles.friendItemLeft}>
          <Avatar
            uri={friendUser.avatar}
            nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
            size="md"
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName} numberOfLines={1}>
              {formatDisplayName(friendUser.nickname, friendUser.username)}
            </Text>
            {friendUser.status && (
              <Text style={styles.friendStatus}>
                {friendUser.status === 'online' ? '在线' : '离线'}
              </Text>
            )}
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>创建群组</Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            (selectedFriends.length === 0 || !groupName.trim()) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={selectedFriends.length === 0 || !groupName.trim() || isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? '创建中...' : '创建'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 群组信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>群组信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>群组名称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入群组名称"
                placeholderTextColor={COLORS.dark.text.tertiary}
                value={groupName}
                onChangeText={setGroupName}
                maxLength={30}
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>群组描述</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="请输入群组描述（可选）"
                placeholderTextColor={COLORS.dark.text.tertiary}
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                maxLength={100}
              />
            </View>
          </View>
        </View>

        {/* 已选成员 */}
        {selectedFriends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              已选成员({selectedFriends.length})
            </Text>
            <View style={styles.selectedList}>
              {selectedFriends.map(renderSelectedFriend)}
            </View>
          </View>
        )}

        {/* 好友列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择好友</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={COLORS.dark.text.tertiary}
              />
              <Text style={styles.emptyTitle}>还没有好友</Text>
              <Text style={styles.emptySubtext}>先添加好友吧</Text>
            </View>
          ) : (
            <View style={styles.friendsCard}>
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.friendSeparator} />}
              />
            </View>
          )}
        </View>

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
  createButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.dark.border,
  },
  createButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  inputRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginHorizontal: SPACING.lg,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  selectedFriendItem: {
    position: 'relative',
  },
  removeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.dark.background,
    borderRadius: 9,
  },
  friendsCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  friendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    marginRight: SPACING.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  friendStatus: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  friendSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 40 + SPACING.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
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
  bottomSpacer: {
    height: SPACING.xl,
  },
});
