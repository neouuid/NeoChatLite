// 桌面端数据清除页�?

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useChatStore,
} from 'neochat-shared';

interface DataClearWindowProps {
  onBack?: () => void;
}

export const DataClearWindow: React.FC<DataClearWindowProps> = ({ onBack }) => {
  const { clearAllMessages, conversations } = useChatStore();
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // 计算本地存储大小（模拟）
  const [storageInfo, setStorageInfo] = useState([
    { label: '聊天记录', size: '0 MB' },
    { label: '图片', size: '0 MB' },
    { label: '文件', size: '0 MB' },
    { label: '视频', size: '0 MB' },
    { label: '其他', size: '0 MB' },
  ]);

  // 计算存储大小
  useEffect(() => {
    const messageCount = Object.values(conversations).reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
    const approxSizeMB = Math.min(messageCount * 0.1, 500); // 假设每条消息 0.1 MB

    setStorageInfo([
      { label: '聊天记录', size: `${Math.round(approxSizeMB)} MB` },
      { label: '图片', size: `${Math.round(approxSizeMB * 2)} MB` },
      { label: '文件', size: `${Math.round(approxSizeMB * 1.5)} MB` },
      { label: '视频', size: `${Math.round(approxSizeMB * 3)} MB` },
      { label: '其他', size: '64 MB' },
    ]);
  }, [conversations]);

  const totalSize = storageInfo.reduce((acc, item) => {
    const match = item.size.match(/(\d+\.?\d*) (MB|GB)/);
    if (!match) return acc;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return acc + (unit === 'GB' ? value * 1024 : value);
  }, 0);

  const totalSizeText = totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${Math.round(totalSize)} MB`;

  // 清除聊天记录
  const handleClearChat = () => {
    Alert.alert(
      '清除聊天记录',
      '将清除所有聊天记录，此操作无法撤销。确定要清除吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定清除',
          style: 'destructive',
          onPress: async () => {
            setIsClearingChat(true);
            try {
              clearAllMessages();
              Alert.alert('成功', '聊天记录已清�?);
            } catch (error) {
              Alert.alert('错误', '清除失败');
            } finally {
              setIsClearingChat(false);
            }
          },
        },
      ]
    );
  };

  // 清除缓存
  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '将清除图片、文件等缓存数据，不会删除聊天记录。确定要清除吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定清除',
          onPress: async () => {
            setIsClearingCache(true);
            try {
              // Web端清�?localStorage 中的缓存数据
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('cache') || key.includes('media') || key.includes('image'))) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => localStorage.removeItem(key));

              Alert.alert('成功', '缓存已清�?);
            } catch (error) {
              Alert.alert('错误', '清除失败');
            } finally {
              setIsClearingCache(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据管理</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 存储空间 */}
        <View style={styles.storageSection}>
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Text style={styles.storageTitle}>存储空间</Text>
              <Text style={styles.storageTotal}>�?{totalSizeText}</Text>
            </View>
            <View style={styles.storageBar}>
              <View style={styles.storageFill} />
            </View>
            <View style={styles.storageDetails}>
              {storageInfo.map((item) => (
                <View key={item.label} style={styles.storageItem}>
                  <Text style={styles.storageLabel}>{item.label}</Text>
                  <Text style={styles.storageSize}>{item.size}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 清除选项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据清除</Text>
          <View style={styles.clearCard}>
            <TouchableOpacity style={styles.clearItem} onPress={handleClearChat} disabled={isClearingChat}>
              <View style={styles.clearLeft}>
                <View style={styles.clearIconContainer}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color="#ffffff" />
                </View>
                <Text style={styles.clearTitle}>
                  {isClearingChat ? '清除�?..' : '清除聊天记录'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
            </TouchableOpacity>
            <View style={styles.clearDivider} />
            <TouchableOpacity style={styles.clearItem} onPress={handleClearCache} disabled={isClearingCache}>
              <View style={styles.clearLeft}>
                <View style={styles.clearIconContainer}>
                  <Ionicons name="folder-outline" size={20} color="#ffffff" />
                </View>
                <Text style={styles.clearTitle}>
                  {isClearingCache ? '清除�?..' : '清除缓存'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
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
  storageSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  storageCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageTitle: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  storageTotal: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  storageBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    marginBottom: 20,
  },
  storageFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#5b7cff',
    borderRadius: 4,
  },
  storageDetails: {
    gap: 12,
  },
  storageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageLabel: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  storageSize: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
  },
  clearCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  clearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  clearLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  clearTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  clearDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
