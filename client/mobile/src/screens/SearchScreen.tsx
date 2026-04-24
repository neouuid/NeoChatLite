// 搜索页面

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  chatService,
  useChatStore,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { User, Message, Conversation, RootStackParamList } from 'neochat-shared/src/types';
import type { NavigationProp } from '@react-navigation/native';

type SearchType = 'all' | 'contacts' | 'messages' | 'groups';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setHighlightedMessageId, ensureMessageLoaded } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    contacts: [] as User[],
    messages: [] as (Message & { conversation?: Conversation; sender?: User })[],
    groups: [] as any[],
  });

  const searchTypes: { key: SearchType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'contacts', label: '联系人' },
    { key: 'groups', label: '群组' },
    { key: 'messages', label: '聊天记录' },
  ];

  // 执行搜索
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults({ contacts: [], messages: [], groups: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // 并行调用所有搜索 API
      const [usersResponse, messagesResponse, groupsResponse] = await Promise.all([
        chatService.searchUsers(query),
        chatService.searchMessages(query),
        chatService.searchGroups(query),
      ]);

      setSearchResults({
        contacts: usersResponse.success && usersResponse.data ? usersResponse.data.items : [],
        messages: messagesResponse.success && messagesResponse.data ? messagesResponse.data : [],
        groups: groupsResponse.success && groupsResponse.data ? groupsResponse.data : [],
      });
    } catch (error) {
      console.error('Search error:', error);
      // 出错时返回空结果
      setSearchResults({ contacts: [], messages: [], groups: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 点击联系人
  const handleContactPress = (contact: User) => {
    navigation.navigate('ViewProfile' as never, { userId: contact.id } as never);
  };

  // 点击消息
  const handleMessagePress = async (message: Message) => {
    // 设置高亮消息 ID
    setHighlightedMessageId(message.id);
    // 确保消息已加载
    await ensureMessageLoaded(message.conversation_id, message.id);
    // 跳转到聊天页面
    navigation.navigate('Chat', { conversationId: message.conversation_id });
  };

  // 点击群组
  const handleGroupPress = (group: any) => {
    // 跳转到群聊页面
    navigation.navigate('GroupChat', { conversationId: group.id });
  };

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
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 渲染联系人项
  const renderContactItem = (contact: User) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.resultItem}
      onPress={() => handleContactPress(contact)}
    >
      <Avatar
        uri={contact.avatar}
        nickname={formatDisplayName(contact.nickname, contact.username)}
        size="md"
        style={styles.resultAvatar}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {formatDisplayName(contact.nickname, contact.username)}
        </Text>
        {contact.status && (
          <Text style={styles.resultSubtitle}>
            {contact.status === 'online' ? '在线' : '离线'}
          </Text>
        )}
      </View>
      <Text style={styles.resultTypeLabel}>联系人</Text>
    </TouchableOpacity>
  );

  // 渲染消息项
  const renderMessageItem = (message: Message & { sender?: User }) => {
    const sender = message.sender;
    const displayName = sender
      ? formatDisplayName(sender.nickname, sender.username)
      : '未知用户';

    return (
      <TouchableOpacity
        key={message.id}
        style={styles.resultItem}
        onPress={() => handleMessagePress(message)}
      >
        {sender && (
          <Avatar
            uri={sender.avatar}
            nickname={displayName}
            size="md"
            style={styles.resultAvatar}
          />
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {message.content}
          </Text>
        </View>
        <View style={styles.resultRight}>
          <Text style={styles.resultTime}>{formatDate(message.created_at)}</Text>
          <Text style={styles.resultTypeLabel}>聊天记录</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染群组项
  const renderGroupItem = (group: any) => (
    <TouchableOpacity
      key={group.id}
      style={styles.resultItem}
      onPress={() => handleGroupPress(group)}
    >
      <View style={[styles.resultAvatar, styles.groupAvatar]}>
        <Ionicons name="people-outline" size={24} color={COLORS.dark.text.secondary} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.resultSubtitle}>
          {group.member_count} 名成员
        </Text>
      </View>
      <Text style={styles.resultTypeLabel}>群组</Text>
    </TouchableOpacity>
  );

  // 渲染搜索结果
  const renderSearchResults = () => {
    const hasResults =
      searchResults.contacts.length > 0 ||
      searchResults.messages.length > 0 ||
      searchResults.groups.length > 0;

    if (!hasResults && searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={COLORS.dark.text.tertiary} />
          <Text style={styles.emptyTitle}>未找到结果</Text>
          <Text style={styles.emptySubtext}>试试其他关键词吧</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {(searchType === 'all' || searchType === 'contacts') &&
          searchResults.contacts.length > 0 && (
            <View style={styles.resultSection}>
              {searchType === 'all' && (
                <Text style={styles.sectionTitle}>联系人</Text>
              )}
              {searchResults.contacts.map(renderContactItem)}
            </View>
          )}

        {(searchType === 'all' || searchType === 'groups') &&
          searchResults.groups.length > 0 && (
            <View style={styles.resultSection}>
              {searchType === 'all' && (
                <Text style={styles.sectionTitle}>群组</Text>
              )}
              {searchResults.groups.map(renderGroupItem)}
            </View>
          )}

        {(searchType === 'all' || searchType === 'messages') &&
          searchResults.messages.length > 0 && (
            <View style={styles.resultSection}>
              {searchType === 'all' && (
                <Text style={styles.sectionTitle}>聊天记录</Text>
              )}
              {searchResults.messages.map(renderMessageItem)}
            </View>
          )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部搜索栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.dark.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索"
            placeholderTextColor={COLORS.dark.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.trim() && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索类型标签 */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {searchTypes.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, searchType === tab.key && styles.tabActive]}
              onPress={() => setSearchType(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  searchType === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>搜索中...</Text>
          </View>
        ) : !searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={COLORS.dark.text.tertiary} />
            <Text style={styles.emptyTitle}>搜索</Text>
            <Text style={styles.emptySubtext}>搜索联系人、群组、聊天记录</Text>
          </View>
        ) : (
          renderSearchResults()
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  tabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  tabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
  resultsContainer: {
    paddingVertical: SPACING.xs,
  },
  resultSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  resultAvatar: {
    marginRight: SPACING.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  resultSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultTime: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  resultTypeLabel: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
