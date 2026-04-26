// 桌面端图片查看器页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
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
} from 'neochat-shared';
import type { RootStackParamList } from 'neochat-shared/src/types';

export const ImageViewerWindow: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ImageViewer'>>();
  const { url: imageUrl } = route.params;
  const fileName = '图片';
  const sendTime = undefined;
  const messageId = undefined;
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

  // 转发图片
  const handleForward = () => {
    if (messageId) {
      navigation.navigate('Forward', { messageId });
    } else {
      Alert.alert('提示', '转发功能需要从消息列表进入');
    }
  };

  // 下载图片
  const handleDownload = async () => {
    if (!imageUrl) {
      Alert.alert('错误', '没有可下载的图片');
      return;
    }

    setIsDownloading(true);
    try {
      const success = await downloadFile(imageUrl, fileName);
      Alert.alert(
        success ? '下载成功' : '下载失败',
        success ? '图片已下载' : '下载图片失败，请重试'
      );
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
          <TouchableOpacity style={styles.closeButton} onPress={navigation.goBack}>
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
          <TouchableOpacity style={styles.headerButton} onPress={handleDownload} disabled={isDownloading}>
            <Ionicons name="download-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleForward}>
            <Ionicons name="share-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete} disabled={isDeleting}>
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 图片展示区域 */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.imageContent}
        minimumZoomScale={1}
        maximumZoomScale={3}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={80} color="#8080a0" />
            <Text style={styles.placeholderText}>无图片</Text>
          </View>
        )}
      </ScrollView>

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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  imageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
