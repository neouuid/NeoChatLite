// 桌面端图片查看器页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  chatService,
} from '@neochat/shared';

interface ImageViewerWindowProps {
  imageUrl: string;
  fileName?: string;
  sendTime?: string;
  onClose?: () => void;
  onForward?: (messageId: string) => void;
  messageId?: string;
}

export const ImageViewerWindow: React.FC<ImageViewerWindowProps> = ({
  imageUrl,
  fileName = '图片',
  sendTime,
  onClose,
  onForward,
  messageId,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 删除图片
  const handleDelete = () => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            if (!messageId) {
              Alert.alert('错误', '无法删除此图片');
              return;
            }

            setIsDeleting(true);
            try {
              await chatService.deleteMessage(messageId);
              Alert.alert('成功', '图片已删除', [
                { text: '确定', onPress: onClose },
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

  // 转发图片
  const handleForward = () => {
    if (messageId && onForward) {
      onForward(messageId);
    }
  };

  // 下载图片
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // 这里应该调用下载工具函数
      Alert.alert('提示', '下载功能开发中');
    } catch (error) {
      Alert.alert('错误', '下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{fileName}</Text>
            {sendTime && (
              <Text style={styles.subtitle}>{sendTime}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleForward}>
            <Ionicons name="share-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 图片展示区域 */}
      <View style={styles.mainContent}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            // 这里应该用 <Image> 组件，但为了演示我们先放一个占位符
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color="#8080a0" />
              <Text style={styles.placeholderText}>图片预览</Text>
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color="#8080a0" />
              <Text style={styles.placeholderText}>无图片</Text>
            </View>
          )}
        </View>
      </View>

      {/* 底部导航栏 */}
      <View style={styles.footer}>
        <View style={styles.navigationLeft}>
          <TouchableOpacity style={styles.navButton} disabled>
            <Ionicons name="chevron-back" size={22} color="#8080a0" />
          </TouchableOpacity>
        </View>
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>1/1</Text>
        </View>
        <View style={styles.navigationRight}>
          <TouchableOpacity style={styles.navButton} disabled>
            <Ionicons name="chevron-forward" size={22} color="#8080a0" />
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
  subtitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
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
  imageContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  placeholderImage: {
    width: 600,
    height: 500,
    backgroundColor: '#2d2d44',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navigationLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  navigationRight: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
