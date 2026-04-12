// 文件查看器页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

type FileViewerScreenRouteProp = {
  params: {
    url: string;
    name: string;
  };
};

// Mock file info
const mockFileInfo = {
  name: '项目文档.pdf',
  size: '2.5 MB',
  type: 'application/pdf',
  sendTime: '2026-04-10 15:30',
  sender: '测试好友',
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['pdf'].includes(ext)) return 'document-text-outline';
  if (['doc', 'docx'].includes(ext)) return 'document-text-outline';
  if (['xls', 'xlsx'].includes(ext)) return 'grid-outline';
  if (['ppt', 'pptx'].includes(ext)) return 'easel-outline';
  if (['zip', 'rar', '7z'].includes(ext)) return 'folder-outline';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image-outline';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'play-circle-outline';
  if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) return 'musical-notes-outline';
  return 'document-outline';
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['pdf'].includes(ext)) return '#ef4444';
  if (['doc', 'docx'].includes(ext)) return '#3b82f6';
  if (['xls', 'xlsx'].includes(ext)) return '#10b981';
  if (['ppt', 'pptx'].includes(ext)) return '#f59e0b';
  if (['zip', 'rar', '7z'].includes(ext)) return '#8b5cf6';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '#6366f1';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return '#f59e0b';
  if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) return '#ec4899';
  return COLORS.primary;
};

export const FileViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<FileViewerScreenRouteProp>();
  const { url, name } = route.params;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // 下载文件
  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // 模拟下载进度
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          setIsDownloading(false);
          Alert.alert('下载完成', '文件已保存到本地');
          return 1;
        }
        return prev + 0.1;
      });
    }, 300);
  };

  // 打开文件
  const handleOpenFile = () => {
    // TODO: 打开文件
    console.log('Open file:', url);
  };

  // 转发文件
  const handleForward = () => {
    navigation.navigate('Forward' as never, { messageId: 'mock' } as never);
  };

  // 删除文件
  const handleDelete = () => {
    Alert.alert(
      '删除文件',
      '确定要删除这个文件吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('已删除', '文件已删除');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const fileIcon = getFileIcon(name);
  const fileColor = getFileColor(name);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 文件预览区域 */}
        <View style={styles.previewSection}>
          <View style={styles.filePreview}>
            <View style={[styles.fileIcon, { backgroundColor: `${fileColor}15` }]}>
              <Ionicons name={fileIcon as any} size={64} color={fileColor} />
            </View>
            <Text style={styles.fileName} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.fileSize}>{mockFileInfo.size}</Text>
          </View>

          {/* 下载/打开按钮 */}
          <View style={styles.actionButtons}>
            {!isDownloading ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleDownload}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonTextPrimary}>下载</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleOpenFile}
            >
              <Ionicons name="eye-outline" size={20} color={COLORS.dark.text.primary} />
              <Text style={styles.actionButtonTextSecondary}>打开</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 文件信息 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>文件信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>文件名称</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {name}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>文件大小</Text>
              <Text style={styles.infoValue}>{mockFileInfo.size}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>发送者</Text>
              <Text style={styles.infoValue}>{mockFileInfo.sender}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>发送时间</Text>
              <Text style={styles.infoValue}>{mockFileInfo.sendTime}</Text>
            </View>
          </View>
        </View>

        {/* 更多操作 */}
        <View style={styles.moreActionsSection}>
          <Text style={styles.sectionTitle}>更多操作</Text>
          <View style={styles.moreActionsCard}>
            <TouchableOpacity style={styles.moreActionItem} onPress={handleForward}>
              <View style={styles.moreActionIcon}>
                <Ionicons name="arrow-redo-outline" size={22} color={COLORS.dark.text.primary} />
              </View>
              <Text style={styles.moreActionText}>转发文件</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.moreActionDivider} />

            <TouchableOpacity style={styles.moreActionItem} onPress={handleDelete}>
              <View style={styles.moreActionIcon}>
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              </View>
              <Text style={[styles.moreActionText, styles.moreActionTextDanger]}>删除文件</Text>
            </TouchableOpacity>
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
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
  moreButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  previewSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  filePreview: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  fileIcon: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  fileName: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  fileSize: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
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
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.dark.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  infoSection: {
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
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  infoLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  infoValue: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    textAlign: 'right',
    marginLeft: SPACING.md,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg,
  },
  moreActionsSection: {
    marginTop: SPACING.lg,
  },
  moreActionsCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  moreActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  moreActionIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  moreActionText: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  moreActionTextDanger: {
    color: COLORS.error,
  },
  moreActionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 32 + SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
