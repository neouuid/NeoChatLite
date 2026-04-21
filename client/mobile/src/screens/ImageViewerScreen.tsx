// 图片查看器页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  saveImageToLibrary,
  deleteFile,
} from '@neochat/shared';
import type { RootStackParamList } from '@neochat/shared/src/types';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ImageViewerScreenRouteProp = {
  params: {
    url: string;
  };
};

export const ImageViewerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ImageViewer'>>();
  const { url } = route.params;

  const [showControls, setShowControls] = useState(true);

  // 切换控制栏显示
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // 保存图片
  const handleSaveImage = async () => {
    const success = await saveImageToLibrary(url);
    Alert.alert(
      success ? '保存成功' : '保存失败',
      success ? '图片已保存到相册' : '保存图片失败，请重试'
    );
  };

  // 转发图片
  const handleForwardImage = () => {
    // 注意：这里需要实际的 messageId，当前通过路由参数只传递了 url
    // 在实际项目中，应该传递 messageId
    Alert.alert('提示', '转发功能需要从消息列表进入');
  };

  // 删除图片
  const handleDeleteImage = () => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFile(url);
            if (success) {
              Alert.alert('已删除', '图片已删除');
              navigation.goBack();
            } else {
              Alert.alert('删除失败', '删除图片失败，请重试');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar hidden={!showControls} />

      {/* 顶部控制栏 */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* 图片区域 */}
      <ScrollView
        style={styles.imageContainer}
        contentContainerStyle={styles.imageContent}
        minimumZoomScale={1}
        maximumZoomScale={3}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={1} onPress={toggleControls}>
          <Image
            source={{ uri: url }}
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </ScrollView>

      {/* 底部控制栏 */}
      {showControls && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={handleSaveImage}>
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.footerButtonText}>保存</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerButton} onPress={handleForwardImage}>
            <Ionicons name="arrow-redo-outline" size={24} color="#fff" />
            <Text style={styles.footerButtonText}>转发</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerButton} onPress={handleDeleteImage}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.footerButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
  },
  imageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  footerButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
