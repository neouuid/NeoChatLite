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

interface ChatBackgroundWindowProps {
  onBack?: () => void;
}

export const ChatBackgroundWindow: React.FC<ChatBackgroundWindowProps> = ({ onBack }) => {
  const [currentBackground, setCurrentBackground] = useState<string>('default');

  const backgroundOptions = [
    { id: 'default', type: 'color', color: '#ffffff', label: '默认' },
    { id: 'light-blue', type: 'color', color: '#e3f2fd', label: '浅蓝' },
    { id: 'light-green', type: 'color', color: '#e8f5e9', label: '浅绿' },
    { id: 'light-pink', type: 'color', color: '#fce4ec', label: '浅粉' },
    { id: 'light-yellow', type: 'color', color: '#fff8e1', label: '浅黄' },
    { id: 'light-purple', type: 'color', color: '#f3e5f5', label: '浅紫' },
  ];

  // 选择背景
  const handleSelectBackground = (backgroundId: string) => {
    setCurrentBackground(backgroundId);
    Alert.alert('成功', '背景已设置');
  };

  // 从相册选择
  const handleSelectFromGallery = () => {
    Alert.alert('提示', '从相册选择功能开发中');
  };

  // 拍照
  const handleTakePhoto = () => {
    Alert.alert('提示', '拍照功能开发中');
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

        {/* 预设图片 - 暂时只显示占位符 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设图片</Text>
          <View style={styles.placeholderCard}>
            <Ionicons name="image-outline" size={48} color="#8080a0" />
            <Text style={styles.placeholderText}>更多背景图片即将上线</Text>
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
