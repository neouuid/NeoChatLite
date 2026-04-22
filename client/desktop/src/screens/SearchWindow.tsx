// 桌面端搜索页面

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
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  chatService,
  useChatStore,
} from '@neochat/shared';

import { Avatar } from '@neochat/shared/src/components/Avatar';
import { formatDisplayName } from '@neochat/shared/src/utils';
import type { User, Message, Conversation } from '@neochat/shared/src/types';

type SearchType = 'all' | 'contacts' | 'messages' | 'groups' | 'files';

interface SearchWindowProps {
  onBack?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const SearchWindow: React.FC<SearchWindowProps> = ({
  onBack,
  onNavigate,
}) => {
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
    { key: 'files', label: '文件' },
  ];

  // 最近搜索标签
  const recentSearches = ['NeoChat', '项目文档', '测试'];

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
    onNavigate?.('ViewProfile', { userId: contact.id });
  };

  // 点击消息
  const handleMessagePress = async (message: Message) => {
    // 设置高亮消息 ID
    setHighlightedMessageId(message.id);
    // 确保消息已加载
    await ensureMessageLoaded(message.conversation_id, message.id);
    // 跳转到聊天页面
    onNavigate?.('Chat', { conversationId: message.conversation_id });
  };

  // 点击群组
  const handleGroupPress = (group: any) => {
    // 跳转到群聊页面
    onNavigate?.('Chat', { conversationId: group.id });
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
        <Ionicons name="people-outline" size={24} color="#8080a0" />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={styles.resultSubtitle}>
          {group.member_count || 0} 名成员
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
          <Ionicons name="search-outline" size={64} color="#8080a0" />
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
    <View style={styles.container}>
      {/* 头部搜索栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>搜索</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 搜索输入框 */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#8080a0"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索聊天记录、好友、群组"
            placeholderTextColor="#8080a0"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.trim() && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={18} color="#8080a0" />
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
              {searchType === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>搜索中...</Text>
          </View>
        ) : !searchQuery.trim() ? (
          /* 最近搜索和搜索历史 */
          <>
            {/* 最近搜索 */}
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>最近搜索</Text>
                <TouchableOpacity>
                  <Text style={styles.clearAllText}>清空</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagsList}>
                {recentSearches.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tagItem}
                    onPress={() => handleSearch(tag)}
                  >
                    <Ionicons name="time-outline" size={16} color="#1a1a2e" />
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 搜索结果标题预览 */}
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>搜索结果</Text>
                <Text style={styles.previewCount}>12 条</Text>
              </View>
              <View style={styles.previewList}>
                {/* 预览示例 */}
              </View>
            </View>
          </>
        ) : (
          renderSearchResults()
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
  searchBarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    marginBottom: SPACING.lg,
  },
  tabsContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabActive: {
  },
  tabText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: '#5b7cff',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 3,
    backgroundColor: '#5b7cff',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
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
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 24,
    padding: 16,
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  clearAllText: {
    color: '#5b7cff',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  tagText: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  previewSection: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: 24,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  previewCount: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  previewList: {
    gap: 0,
  },
  resultsContainer: {
    paddingVertical: SPACING.xs,
  },
  resultSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: 24,
    marginBottom: SPACING.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  resultAvatar: {
    marginRight: SPACING.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  resultSubtitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultTime: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  resultTypeLabel: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
