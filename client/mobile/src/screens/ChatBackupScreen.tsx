// 聊天备份页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ProgressBarAndroid,
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

export const ChatBackupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackupTime, setLastBackupTime] = useState<string>('2026-04-10 15:30');
  const [backupSize, setBackupSize] = useState<string>('128 MB');

  // 立即备份
  const handleBackup = () => {
    Alert.alert(
      '备份聊天记录',
      '将备份聊天记录到本地存储',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '备份',
          onPress: () => {
            setIsBackingUp(true);
            setProgress(0);

            // 模拟备份进度
            const interval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 1) {
                  clearInterval(interval);
                  setIsBackingUp(false);
                  setLastBackupTime(new Date().toLocaleString('zh-CN'));
                  Alert.alert('备份完成', '聊天记录已成功备份');
                  return 1;
                }
                return prev + 0.1;
              });
            }, 300);
          },
        },
      ]
    );
  };

  // 恢复备份
  const handleRestore = () => {
    Alert.alert(
      '恢复聊天记录',
      '恢复备份将覆盖当前聊天记录，确定要恢复吗',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '恢复',
          style: 'destructive',
          onPress: () => {
            setIsRestoring(true);
            setProgress(0);

            // 模拟恢复进度
            const interval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 1) {
                  clearInterval(interval);
                  setIsRestoring(false);
                  Alert.alert('恢复完成', '聊天记录已成功恢复');
                  return 1;
                }
                return prev + 0.1;
              });
            }, 300);
          },
        },
      ]
    );
  };

  // 删除备份
  const handleDeleteBackup = () => {
    Alert.alert(
      '删除备份',
      '确定要删除本地备份吗',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setLastBackupTime('');
            setBackupSize('');
            Alert.alert('已删除', '备份已删除');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天备份</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 备份信息 */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.dark.text.secondary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>上次备份</Text>
                <Text style={styles.infoValue}>
                  {lastBackupTime || '暂无备份'}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Ionicons name="folder-outline" size={20} color={COLORS.dark.text.secondary} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>备份大小</Text>
                <Text style={styles.infoValue}>
                  {backupSize || '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 备份选项 */}
        <View style={styles.optionsSection}>
          <View style={styles.optionCard}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="cloud-outline" size={22} color={COLORS.dark.text.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>自动备份</Text>
                  <Text style={styles.optionSubtitle}>每周</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="document-text-outline" size={22} color={COLORS.dark.text.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>包含内容</Text>
                  <Text style={styles.optionSubtitle}>文字、图片、视频</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 进度条 */}
        {(isBackingUp || isRestoring) && (
          <View style={styles.progressSection}>
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>
                {isBackingUp ? '正在备份...' : '正在恢复...'}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleBackup}
            disabled={isBackingUp || isRestoring}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonTextPrimary}>
              {isBackingUp ? '备份中...' : '立即备份'}
            </Text>
          </TouchableOpacity>

          {lastBackupTime && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={handleRestore}
                disabled={isBackingUp || isRestoring}
              >
                <Ionicons name="cloud-download-outline" size={20} color={COLORS.dark.text.primary} />
                <Text style={styles.actionButtonTextSecondary}>
                  {isRestoring ? '恢复中...' : '恢复备份'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleDeleteBackup}
                disabled={isBackingUp || isRestoring}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={styles.actionButtonTextDanger}>删除备份</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 提示 */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.dark.text.tertiary}
              style={styles.tipsIcon}
            />
            <Text style={styles.tipsText}>
              备份仅保存在本地设备中，卸载应用会删除备份。建议定期备份到云端
            </Text>
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
  infoSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  infoValue: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.xs / 2,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 20 + SPACING.md,
    marginVertical: SPACING.xs,
  },
  optionsSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  optionCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  optionTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  optionSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 22 + SPACING.md,
  },
  progressSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  progressCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  progressTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.dark.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'right',
  },
  actionsSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.dark.surface,
  },
  actionButtonDanger: {
    backgroundColor: COLORS.dark.surface,
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionButtonTextSecondary: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionButtonTextDanger: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  tipsSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: `${COLORS.dark.surface}`,
    borderRadius: BORDER_RADIUS.md,
  },
  tipsIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  tipsText: {
    flex: 1,
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
