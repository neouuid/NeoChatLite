// 桌面端聊天背景页面

import React, { useState } from 'react';
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
} from '@neochat/shared';

import { pickImageFromGalleryWeb, takePhotoWeb } from '../utils/mediaWeb';

interface ChatBackgroundWindowProps {
  onBack?: () => void;
}

export const ChatBackgroundWindow: React.FC<ChatBackgroundWindowProps> = ({ onBack }) => {
  const [currentBackground, setCurrentBackground] = useState<string>('default');

  const backgroundOptions = [
    { id: 'default', type: 'color' as const, color: '#ffffff', label: '默认' },
    { id: 'light-blue', type: 'color' as const, color: '#e3f2fd', label: '浅蓝' },
    { id: 'light-green', type: 'color' as const, color: '#e8f5e9', label: '浅绿' },
    { id: 'light-pink', type: 'color' as const, color: '#fce4ec', label: '浅粉' },
    { id: 'light-yellow', type: 'color' as const, color: '#fff8e1', label: '浅黄' },
    { id: 'light-purple', type: 'color' as const, color: '#f3e5f5', label: '浅紫' },
  ];

  const presetImageBackgrounds = [
    { id: 'bg1', label: '渐变蓝', gradient: ['#667eea', '#764ba2'] },
    { id: 'bg2', label: '渐变绿', gradient: ['#11998e', '#38ef7d'] },
    { id: 'bg3', label: '渐变粉', gradient: ['#f093fb', '#f5576c'] },
    { id: 'bg4', label: '渐变橙', gradient: ['#fa709a', '#fee140'] },
    { id: 'bg5', label: '渐变紫', gradient: ['#a18cd1', '#fbc2eb'] },
    { id: 'bg6', label: '渐变青', gradient: ['#4facfe', '#00f2fe'] },
  ];

  // 选择背景
  const handleSelectBackground = (backgroundId: string) => {
    setCurrentBackground(backgroundId);
    Alert.alert('成功', '背景已设置');
  };

  // 从相册选择
  const handleSelectFromGallery = async () => {
    try {
      const result = await pickImageFromGalleryWeb();
      if (result) {
        setCurrentBackground(`custom-${Date.now()}`);
        Alert.alert('成功', '背景已设置');
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    try {
      const result = await takePhotoWeb();
      if (result) {
        setCurrentBackground(`custom-${Date.now()}`);
        Alert.alert('成功', '背景已设置');
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  };

  // 渲染渐变背景预览
  const renderGradientPreview = (gradient: string[]) => {
    return (
      <View style={styles.gradientPreview}>
        <View style={[styles.gradientColor, { backgroundColor: gradient[0], flex: 1 }]} />
        <View style={[styles.gradientColor, { backgroundColor: gradient[1], flex: 1 }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天背景</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 自定义选项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自定义背景</Text>
          <View style={styles.customCard}>
            <TouchableOpacity style={styles.customItem} onPress={handleSelectFromGallery}>
              <View style={styles.customIconContainer}>
                <Ionicons name="images-outline" size={24} color="#5b7cff" />
              </View>
              <Text style={styles.customTitle}>从相册选择</Text>
            </TouchableOpacity>
            <View style={styles.customDivider} />
            <TouchableOpacity style={styles.customItem} onPress={handleTakePhoto}>
              <View style={styles.customIconContainer}>
                <Ionicons name="camera-outline" size={24} color="#5b7cff" />
              </View>
              <Text style={styles.customTitle}>拍照</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 预设颜色 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设颜色</Text>
          <View style={styles.colorGrid}>
            {backgroundOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.colorItem,
                  currentBackground === option.id && styles.colorItemSelected,
                ]}
                onPress={() => handleSelectBackground(option.id)}
              >
                <View style={[styles.colorPreview, { backgroundColor: option.color }]} />
                <Text style={styles.colorLabel}>{option.label}</Text>
                {currentBackground === option.id && (
                  <View style={styles.checkOverlay}>
                    <Ionicons name="checkmark-circle" size={32} color="#5b7cff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 预设渐变背景 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设渐变</Text>
          <View style={styles.colorGrid}>
            {presetImageBackgrounds.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.colorItem,
                  currentBackground === option.id && styles.colorItemSelected,
                ]}
                onPress={() => handleSelectBackground(option.id)}
              >
                {renderGradientPreview(option.gradient)}
                <Text style={styles.colorLabel}>{option.label}</Text>
                {currentBackground === option.id && (
                  <View style={styles.checkOverlay}>
                    <Ionicons name="checkmark-circle" size={32} color="#5b7cff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  customCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  customItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  customIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(91, 124, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  customTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  customDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 88,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorItemSelected: {
    borderWidth: 2,
    borderColor: '#5b7cff',
  },
  colorPreview: {
    width: '80%',
    height: '80%',
    borderRadius: BORDER_RADIUS.md,
  },
  gradientPreview: {
    width: '80%',
    height: '80%',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradientColor: {
    height: '100%',
  },
  colorLabel: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 8,
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  placeholderCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
