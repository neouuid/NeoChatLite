// 聊天背景页面

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';
import { useMediaPicker } from '@neochat/shared/src/hooks/useMediaPicker';

// 预设背景
const presetBackgrounds = [
  { id: 'bg1', type: 'color' as const, value: COLORS.dark.background },
  { id: 'bg2', type: 'color' as const, value: '#1a1a2e' },
  { id: 'bg3', type: 'color' as const, value: '#2d1b4e' },
  { id: 'bg4', type: 'color' as const, value: '#0d2818' },
  { id: 'bg5', type: 'color' as const, value: '#2d1f1f' },
  { id: 'bg6', type: 'color' as const, value: '#1a2d3d' },
];

// 预设图片背景（占位）
const presetImages = [
  { id: 'img1', type: 'image' as const, value: null },
  { id: 'img2', type: 'image' as const, value: null },
  { id: 'img3', type: 'image' as const, value: null },
  { id: 'img4', type: 'image' as const, value: null },
];

export const ChatBackgroundScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedBackground, setSelectedBackground] = useState<string>('bg1');
  const [customBackground, setCustomBackground] = useState<string | null>(null);

  const { pickImageFromGallery, takePhoto } = useMediaPicker({
    onImageSelected: (item) => {
      setCustomBackground(item.uri);
      Alert.alert('成功', '背景已设置');
    },
    onError: (error) => {
      Alert.alert('错误', error.message || '选择图片失败');
    },
  });

  // 选择背景
  const handleSelectBackground = (bgId: string) => {
    setSelectedBackground(bgId);
    setCustomBackground(null);
  };

  // 从相册选择
  const handleChooseFromGallery = useCallback(async () => {
    await pickImageFromGallery();
  }, [pickImageFromGallery]);

  // 拍一张
  const handleTakePhoto = useCallback(async () => {
    await takePhoto();
  }, [takePhoto]);

  // 恢复默认
  const handleResetDefault = () => {
    Alert.alert(
      '恢复默认',
      '确定要恢复默认背景吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            setSelectedBackground('bg1');
            Alert.alert('已恢复', '已恢复默认背景');
          },
        },
      ]
    );
  };

  // 渲染背景项
  const renderBackgroundItem = (bg: typeof presetBackgrounds[0]) => {
    const isSelected = selectedBackground === bg.id;

    return (
      <TouchableOpacity
        key={bg.id}
        style={styles.backgroundItem}
        onPress={() => handleSelectBackground(bg.id)}
      >
        <View
          style={[
            styles.backgroundPreview,
            { backgroundColor: bg.value },
            isSelected && styles.backgroundPreviewSelected,
          ]}
        />
        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 渲染图片背景项
  const renderImageItem = (img: typeof presetImages[0]) => {
    return (
      <TouchableOpacity
        key={img.id}
        style={styles.backgroundItem}
        onPress={() => Alert.alert('功能开发中', '预设图片背景功能正在开发中，敬请期待')}
      >
        <View
          style={[
            styles.backgroundPreview,
            styles.imagePlaceholder,
          ]}
        >
          <Ionicons name="image-outline" size={32} color={COLORS.dark.text.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天背景</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 操作按钮 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleChooseFromGallery}>
            <View style={styles.actionIcon}>
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>从相册选择</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
            <View style={styles.actionIcon}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>拍一张</Text>
          </TouchableOpacity>
        </View>

        {/* 预设颜色 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设颜色</Text>
          <View style={styles.backgroundsGrid}>
            {presetBackgrounds.map(renderBackgroundItem)}
          </View>
        </View>

        {/* 预设图片 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设图片</Text>
          <View style={styles.backgroundsGrid}>
            {presetImages.map(renderImageItem)}
          </View>
        </View>

        {/* 恢复默认 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetDefault}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.dark.text.secondary} />
            <Text style={styles.resetButtonText}>恢复默认背景</Text>
          </TouchableOpacity>
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
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  backgroundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg - SPACING.sm,
    gap: SPACING.sm,
  },
  backgroundItem: {
    position: 'relative',
    width: (375 - SPACING.lg * 2 - SPACING.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  backgroundPreview: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  backgroundPreviewSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  resetButtonText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
