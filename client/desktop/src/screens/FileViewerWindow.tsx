// 桌面端文件查看器页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  chatService,
  downloadFile,
  openFilePreview,
} from 'neochat-shared';
import type { RootStackParamList } from 'neochat-shared/src/types';

export const FileViewerWindow: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'FileViewer'>>();
  const { url: fileUrl, name: fileName = '文件', size: fileSize = '0 KB' } = route.params;
  const fileType = fileName.split('.').pop() || 'file';
  const sendTime = undefined;
  const senderName = undefined;
  const messageId = undefined;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // 获取文件图标
  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'grid';
      case 'ppt':
      case 'pptx':
        return 'easel';
      case 'zip':
      case 'rar':
      case '7z':
        return 'folder';
      case 'mp3':
      case 'wav':
      case 'aac':
        return 'musical-note';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'play';
      default:
        return 'document';
    }
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
          onPress: async () => {
            if (!messageId) {
              Alert.alert('错误', '无法删除此文件');
              return;
            }

            setIsDeleting(true);
            try {
              await chatService.deleteMessage(messageId);
              Alert.alert('成功', '文件已删除', [
                { text: '确定', onPress: navigation.goBack },
              ]);
            } catch (error) {
              Alert.alert('错误', error instanceof Error ? error.message : '删除失败');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // 转发文件
  const handleForward = () => {
    if (messageId) {
      navigation.navigate('Forward', { messageId });
    } else {
      Alert.alert('提示', '转发功能需要从消息列表进入');
    }
  };

  // 下载文件
  const handleDownload = async () => {
    if (!fileUrl) {
      Alert.alert('错误', '没有可下载的文件');
      return;
    }

    setIsDownloading(true);
    try {
      const success = await downloadFile(fileUrl, fileName);
      Alert.alert(
        success ? '下载成功' : '下载失败',
        success ? '文件已下载' : '下载文件失败，请重试'
      );
    } catch (error) {
      Alert.alert('错误', '下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  // 打开文件
  const handleOpen = async () => {
    if (!fileUrl) {
      Alert.alert('错误', '没有可打开的文件');
      return;
    }

    setIsOpening(true);
    try {
      const success = await openFilePreview(fileUrl, fileName);
      if (!success) {
        Alert.alert('提示', '无法打开此文件类型，请先下载');
      }
    } catch (error) {
      Alert.alert('错误', '打开文件失败');
    } finally {
      setIsOpening(false);
    }
  };

  // 直接打开
  const handleDirectOpen = async () => {
    await handleOpen();
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{fileName}</Text>
            <View style={styles.metaContainer}>
              {fileSize && <Text style={styles.metaText}>{fileSize}</Text>}
              {senderName && <Text style={styles.metaText}>· 发送者: {senderName}</Text>}
              {sendTime && <Text style={styles.metaText}>· {sendTime}</Text>}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleForward}>
            <Ionicons name="share-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDownload} disabled={isDownloading}>
            <Ionicons name="download-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 文件展示区域 */}
      <View style={styles.mainContent}>
        <View style={styles.fileContainer}>
          <View style={styles.fileIconContainer}>
            <Ionicons name={getFileIcon() as any} size={48} color="#6366f1" />
          </View>
          <Text style={styles.fileName}>{fileName}</Text>
          <Text style={styles.fileSizeText}>{fileSize}</Text>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.openButton} onPress={handleDirectOpen} disabled={isOpening}>
            <Ionicons name="open-outline" size={18} color="#ffffff" />
            <Text style={styles.openButtonText}>打开文件</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fileContainer: {
    width: 500,
    backgroundColor: '#2d2d44',
    borderRadius: BORDER_RADIUS.lg,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  fileIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  fileSizeText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d2d44',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  printButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
