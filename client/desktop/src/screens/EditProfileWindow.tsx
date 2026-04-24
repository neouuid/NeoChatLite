// 桌面端编辑个人资料页面

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  useUserStore,
  chatService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

import { Avatar } from 'neochat-shared/src/components/Avatar';
import { formatDisplayName } from 'neochat-shared/src/utils';
import { pickImageFromGalleryWeb } from '../utils/mediaWeb';

interface EditProfileWindowProps {
  onBack?: () => void;
}

export const EditProfileWindow: React.FC<EditProfileWindowProps> = ({ onBack }) => {
  const { user, updateUser } = useAuthStore();
  const { updateUser: updateUserInStore } = useUserStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);

  // 保存个人资料
  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const response = await chatService.updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
        avatar: tempAvatar || undefined,
      });

      if (response.success && response.data) {
        const updatedUser = response.data;
        updateUser(updatedUser);
        updateUserInStore(updatedUser);
        setTempAvatar(null);
        Alert.alert('成功', '资料已更新', [
          { text: '确定', onPress: onBack },
        ]);
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [nickname, bio, tempAvatar, user, updateUser, updateUserInStore, onBack]);

  // 更换头像
  const handleChangeAvatar = useCallback(async () => {
    try {
      const result = await pickImageFromGalleryWeb();
      if (result) {
        setIsUploading(true);
        try {
          // 先上传图片
          const uploadResponse = await chatService.uploadFile(
            result.file!,
            `avatar_${Date.now()}.jpg`
          );

          if (uploadResponse.success && uploadResponse.data) {
            setTempAvatar(uploadResponse.data.url);
            Alert.alert('成功', '头像已选择，请点击保存完成');
          } else {
            Alert.alert('错误', uploadResponse.message || '上传失败');
          }
        } catch (uploadError) {
          Alert.alert('错误', '上传头像失败');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={tempAvatar || user?.avatar}
              nickname={formatDisplayName(user?.nickname, user?.username)}
              size="xl"
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar} disabled={isUploading}>
              <Ionicons name="camera-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.changeAvatarText}>{isUploading ? '上传中...' : '点击更换头像'}</Text>
        </View>

        {/* 资料表单 */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            {/* 昵称 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>昵称</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="请输入昵称"
                  placeholderTextColor="#8080a0"
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={30}
                />
              </View>
              <Text style={styles.inputHint}>
                {nickname.length}/30
              </Text>
            </View>

            <View style={styles.inputDivider} />

            {/* 用户名（只读） */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>用户名</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.readOnlyText}>
                  @{user?.username || ''}
                </Text>
              </View>
              <Text style={styles.inputHint}>
                用户名不可修改
              </Text>
            </View>

            <View style={styles.inputDivider} />

            {/* 个性签名 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>个性签名</Text>
              <View style={[styles.inputContainer, styles.textareaContainer]}>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="介绍一下自己吧"
                  placeholderTextColor="#8080a0"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  maxLength={100}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.inputHint}>
                {bio.length}/100
              </Text>
            </View>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5b7cff',
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {},
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  changeAvatarText: {
    color: '#5b7cff',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  formSection: {
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    paddingVertical: 12,
  },
  inputLabel: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F7F8FA',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  textareaContainer: {
    minHeight: 100,
    paddingVertical: 12,
  },
  input: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  textarea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  readOnlyText: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  inputHint: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 8,
    textAlign: 'right',
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
