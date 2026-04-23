// 桌面端创建群组页�?

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
import type { User, Friend, Conversation } from 'neochat-shared/src/types';

interface CreateGroupWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const CreateGroupWindow: React.FC<CreateGroupWindowProps> = ({
  onBack,
  onNavigate,
}) => {
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
      Alert.alert('提示', '请输入群组名�?);
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('提示', '请至少选择一位好�?);
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
              // 导航到群聊页�?
              onNavigate?.('Chat', { conversationId: conversation.id });
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

  // 移除已选好�?
  const removeSelectedFriend = (friendId: string) => {
    setSelectedFriends((prev) => prev.filter((id) => id !== friendId));
  };

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // 渲染已选好�?
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
        <View style={styles.selectedAvatar}>
          <Avatar
            uri={friendUser.avatar}
            nickname={formatDisplayName(friendUser.nickname, friendUser.username)}
            size="sm"
          />
        </View>
        <Ionicons
          name="close-circle"
          size={18}
          color="#8080a0"
          style={styles.removeIcon}
        />
      </TouchableOpacity>
    );
  };

  // 渲染好友�?
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
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-left" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建群组</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 头像和群组信�?*/}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>�?/Text>
          </View>
          <Text style={styles.changeAvatarText}>点击更换头像</Text>
        </View>

        {/* 群组信息表单 */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>群组名称</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="请输入群组名�?
                placeholderTextColor="#a0a0c0"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={30}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>群组描述</Text>
            <View style={[styles.inputWrapper, styles.textareaWrapper]}>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="请输入群组描述（可选）"
                placeholderTextColor="#a0a0c0"
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                maxLength={100}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* 选择成员 */}
        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersLabel}>选择成员</Text>
            <Text style={styles.selectedCount}>已�?{selectedFriends.length} �?/Text>
          </View>

          {/* 已选成�?*/}
          {selectedFriends.length > 0 && (
            <View style={styles.selectedList}>
              {selectedFriends.map(renderSelectedFriend)}
            </View>
          )}

          {/* 好友列表 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载�?..</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color="#8080a0"
              />
              <Text style={styles.emptyTitle}>还没有好�?/Text>
              <Text style={styles.emptySubtext}>先添加好友吧</Text>
            </View>
          ) : (
            <View style={styles.friendsContainer}>
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

      {/* 底部创建按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (selectedFriends.length === 0 || !groupName.trim()) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={selectedFriends.length === 0 || !groupName.trim() || isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? '创建�?..' : '创建群组'}
          </Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
  },
  changeAvatarText: {
    color: '#5b7cff',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  inputWrapper: {
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
    justifyContent: 'center',
  },
  textareaWrapper: {
    height: 80,
    paddingVertical: 12,
  },
  input: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  textarea: {
    height: 56,
    textAlignVertical: 'top',
  },
  membersSection: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    flex: 1,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersLabel: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  selectedCount: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedFriendItem: {
    position: 'relative',
  },
  selectedAvatar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  removeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F7F8FA',
    borderRadius: 9,
  },
  friendsContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  friendStatus: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#5b7cff',
    borderColor: '#5b7cff',
  },
  friendSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 12 + 40 + SPACING.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.lg,
    height: 48,
  },
  createButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
