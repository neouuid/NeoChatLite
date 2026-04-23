// 数据清除页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

export const DataClearScreen: React.FC = () => {
  const navigation = useNavigation();

  // 清除缓存
  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除缓存吗？这不会删除您的聊天记录�?,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            Alert.alert('已清�?, '缓存已清�?);
          },
        },
      ]
    );
  };

  // 清除聊天记录
  const handleClearChatHistory = () => {
    Alert.alert(
      '清除聊天记录',
      '确定要清除所有聊天记录吗？此操作不可撤销�?,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('已清�?, '所有聊天记录已清除');
          },
        },
      ]
    );
  };

  // 清除所有数�?  const handleClearAllData = () => {
    Alert.alert(
      '清除所有数�?,
      '确定要清除所有数据吗？这将删除所有聊天记录、设置并退出登录。此操作不可撤销�?,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('已清�?, '所有数据已清除');
          },
        },
      ]
    );
  };

  const clearItems = [
    {
      id: 'cache',
      title: '清除缓存',
      subtitle: '清理图片、视频等临时文件',
      size: '128 MB',
      icon: 'folder-outline',
      onPress: handleClearCache,
      isDanger: false,
    },
    {
      id: 'chat-history',
      title: '清除聊天记录',
      subtitle: '删除所有聊天消�?,
      size: '512 MB',
      icon: 'chatbubble-ellipses-outline',
      onPress: handleClearChatHistory,
      isDanger: true,
    },
    {
      id: 'all-data',
      title: '清除所有数�?,
      subtitle: '删除所有数据并退出登�?,
      size: '',
      icon: 'trash-bin-outline',
      onPress: handleClearAllData,
      isDanger: true,
    },
  ];

  const renderClearItem = (item: typeof clearItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.clearItem}
      onPress={item.onPress}
    >
      <View style={styles.clearItemLeft}>
        <View style={[styles.iconContainer, item.isDanger && styles.iconContainerDanger]}>
          <Ionicons
            name={item.icon as any}
            size={24}
            color={item.isDanger ? COLORS.error : COLORS.primary}
          />
        </View>
        <View style={styles.clearItemText}>
          <Text style={[styles.clearItemTitle, item.isDanger && styles.clearItemTitleDanger]}>
            {item.title}
          </Text>
          <Text style={styles.clearItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <View style={styles.clearItemRight}>
        {item.size && (
          <Text style={styles.clearItemSize}>{item.size}</Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据清除</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 警告 */}
        <View style={styles.warningSection}>
          <View style={styles.warningCard}>
            <Ionicons
              name="warning-outline"
              size={20}
              color={COLORS.warning}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              清除数据操作不可逆，请谨慎操作！
            </Text>
          </View>
        </View>

        {/* 存储空间 */}
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>存储空间</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageInfo}>
              <View>
                <Text style={styles.storageUsedLabel}>已使�?/Text>
                <Text style={styles.storageUsed}>1.2 GB</Text>
              </View>
              <View style={styles.storageDivider} />
              <View>
                <Text style={styles.storageTotalLabel}>总空�?/Text>
                <Text style={styles.storageTotal}>128 GB</Text>
              </View>
            </View>
            <View style={styles.storageBar}>
              <View style={styles.storageBarFill} />
            </View>
            <Text style={styles.storageHint}>
              聊天记录和媒体文件占用了大部分空�?            </Text>
          </View>
        </View>

        {/* 清除选项 */}
        <View style={styles.clearSection}>
          <Text style={styles.sectionTitle}>清除选项</Text>
          <View style={styles.clearCard}>
            {clearItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderClearItem(item)}
                {index < clearItems.length - 1 && <View style={styles.clearDivider} />}
              </React.Fragment>
            ))}
          </View>
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  warningSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  warningIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  storageSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  storageCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  storageInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  storageUsedLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  storageUsed: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  storageDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginHorizontal: SPACING.lg,
  },
  storageTotalLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.xs,
  },
  storageTotal: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  storageBar: {
    height: 8,
    backgroundColor: COLORS.dark.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  storageBarFill: {
    width: '30%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  storageHint: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  clearSection: {
    marginTop: SPACING.lg,
  },
  clearCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  clearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  clearItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconContainerDanger: {
    backgroundColor: `${COLORS.error}15`,
  },
  clearItemText: {
    flex: 1,
  },
  clearItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs / 2,
  },
  clearItemTitleDanger: {
    color: COLORS.error,
  },
  clearItemSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  clearItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  clearItemSize: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  clearDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 48 + SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
