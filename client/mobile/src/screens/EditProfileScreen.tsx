// 资料编辑页面

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useUserStore,
  authService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useMediaPicker,
  useMediaUpload,
  type MediaItem,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import type { RootStackParamList } from 'neochat-shared/src/types';
import type { NavigationProp } from '@react-navigation/native';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, setUser } = useAuthStore();
  const { clearUser } = useUserStore();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 媒体上传 hook
  const { uploadImage } = useMediaUpload({
    onUploadStart: () => {
      setIsUploading(true);
    },
    onUploadComplete: async (result) => {
      // 更新用户头像
      await updateProfile({ avatar: result.url });
    },
    onUploadError: (error) => {
      setIsUploading(false);
      Alert.alert('上传失败', error.message);
    },
  });

  // 媒体选择 hook
  const { pickImage } = useMediaPicker({
    onImageSelected: async (item: MediaItem) => {
      if (item.uri) {
        await uploadImage(item.uri, item.filename);
      }
    },
    onError: (error) => {
      Alert.alert('选择失败', error.message);
    },
  });

  // 更新用户资料
  const updateProfile = useCallback(async (data: Partial<{ nickname: string; bio: string; avatar: string }>) => {
    if (!user) return;

    try {
      setIsSaving(true);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      Alert.alert('成功', '资料已更新');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('错误', '更新资料失败');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }, [user, setUser]);

  // 保存资料
  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      Alert.alert('错误', '昵称不能为空');
      return;
    }

    await updateProfile({ nickname, bio });
  }, [nickname, bio, updateProfile]);

  // 选择头像
  const handleAvatarPress = useCallback(async () => {
    Alert.alert(
      '更换头像',
      '请选择图片来源',
      [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: async () => {
            const result = await pickImage();
            if (result) {
              await uploadImage(result.uri, result.filename);
            }
          }
        },
        { text: '从相册选择', onPress: async () => {
            const result = await pickImage();
            if (result) {
              await uploadImage(result.uri, result.filename);
            }
          }
        },
      ]
    );
  }, [pickImage, uploadImage]);

  const displayName = user ? formatDisplayName(user.nickname, user.username) : '未知用户';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || isUploading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isUploading}
        >
          <Text style={styles.saveButtonText}>
            {isSaving || isUploading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
            <Avatar
              uri={user?.avatar}
              nickname={displayName}
              size="xxl"
              style={styles.avatar}
            />
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </View>

        {/* 表单区域 */}
        <View style={styles.formSection}>
          {/* 昵称 */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>昵称</Text>
            <TextInput
              style={styles.formInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="请输入昵称"
              placeholderTextColor={COLORS.dark.text.tertiary}
              maxLength={30}
            />
          </View>

          {/* 用户名（只读） */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>用户名</Text>
            <TextInput
              style={[styles.formInput, styles.formInputDisabled]}
              value={user?.username || ''}
              placeholder="用户名"
              placeholderTextColor={COLORS.dark.text.tertiary}
              editable={false}
            />
            <Text style={styles.formHint}>用户名不可修改</Text>
          </View>

          {/* 个性签名 */}
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>个性签名</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="介绍一下自己吧..."
              placeholderTextColor={COLORS.dark.text.tertiary}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.formHint}>{bio.length}/200</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.dark.text.tertiary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    marginBottom: SPACING.md,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  formSection: {
    paddingHorizontal: SPACING.lg,
  },
  formItem: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
  },
  formInput: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  formInputDisabled: {
    color: COLORS.dark.text.tertiary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formHint: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
