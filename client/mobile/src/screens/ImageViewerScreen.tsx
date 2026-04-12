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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@neochat/shared';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ImageViewerScreenRouteProp = {
  params: {
    url: string;
  };
};

// Mock images
const mockImages = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
];

export const ImageViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ImageViewerScreenRouteProp>();
  const { url } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // 切换控制栏显示
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // 保存图片
  const handleSaveImage = () => {
    // TODO: 保存图片到相册
    console.log('Save image:', url);
  };

  // 转发图片
  const handleForwardImage = () => {
    // TODO: 转发图片
    navigation.navigate('Forward' as never, { messageId: 'mock' } as never);
  };

  // 删除图片
  const handleDeleteImage = () => {
    // TODO: 删除图片
    console.log('Delete image:', url);
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
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {mockImages.length}
          </Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
          </TouchableOpacity>
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
  headerTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreButton: {
    padding: SPACING.sm,
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
