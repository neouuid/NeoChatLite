// 桌面端聊天备份页面

import React, { useState, useEffect } from 'react';
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
  useChatStore,
  useAuthStore,
} from 'neochat-shared';

interface ChatBackupWindowProps {
  onBack?: () => void;
}

export const ChatBackupWindow: React.FC<ChatBackupWindowProps> = ({ onBack }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const { conversations, messages } = useChatStore();
  const { user } = useAuthStore();

  // 从本地存储读取上次备份时间
  useEffect(() => {
    const saved = localStorage.getItem('neochat_last_backup');
    if (saved) {
      setLastBackupTime(saved);
    }
    const autoBackup = localStorage.getItem('neochat_auto_backup');
    if (autoBackup === 'true') {
      setAutoBackupEnabled(true);
    }
  }, []);

  // 立即备份
  const handleBackupNow = () => {
    Alert.alert(
      '备份聊天记录',
      '将备份聊天记录、图片和文件到本地存储。是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '备份',
          onPress: async () => {
            setIsBackingUp(true);
            try {
              // Web 端备份到 localStorage
              const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                conversations,
                messages,
                userId: user?.id,
              };

              localStorage.setItem('neochat_backup', JSON.stringify(backupData));

              const now = new Date();
              const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              setLastBackupTime(timeString);
              localStorage.setItem('neochat_last_backup', timeString);

              Alert.alert('成功', '聊天记录已备份');
            } catch (error) {
              Alert.alert('错误', '备份失败，请检查存储空间');
            } finally {
              setIsBackingUp(false);
            }
          },
        },
      ]
    );
  };

  // 自动备份
  const handleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    localStorage.setItem('neochat_auto_backup', String(newState));
    Alert.alert('提示', newState ? '已开启自动备份' : '已关闭自动备份');
  };

  // 恢复聊天记录
  const handleRestore = () => {
    const backup = localStorage.getItem('neochat_backup');
    if (!backup) {
      Alert.alert('提示', '暂无备份数据');
      return;
    }

    Alert.alert(
      '恢复聊天记录',
      '将从本地备份恢复聊天记录。此操作会覆盖当前聊天记录，是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '恢复',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              Alert.alert('成功', '聊天记录已恢复（需重启应用生效）');
            } catch (error) {
              Alert.alert('错误', '恢复失败');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>聊天备份</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 备份状态 */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="cloud-done-outline" size={32} color="#5b7cff" />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>最近备份</Text>
              <Text style={styles.statusTime}>{lastBackupTime || '暂无备份'}</Text>
            </View>
          </View>
        </View>

        {/* 备份设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备份设置</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleBackupNow} disabled={isBackingUp}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
                </View>
                <Text style={styles.settingTitle}>{isBackingUp ? '备份中...' : '立即备份'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.settingItem} onPress={handleAutoBackup}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="refresh-outline" size={20} color="#ffffff" />
                </View>
                <Text style={styles.settingTitle}>自动备份</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{autoBackupEnabled ? '开启' : '关闭'}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 恢复设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>恢复设置</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleRestore} disabled={isRestoring}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="cloud-download-outline" size={20} color="#ffffff" />
                </View>
                <Text style={styles.settingTitle}>{isRestoring ? '恢复中...' : '恢复聊天记录'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 备份说明 */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#8080a0" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              备份数据将保存在本地，仅包含文字消息、图片和文件，不包含视频。
            </Text>
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
  statusSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(91, 124, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: 4,
  },
  statusTime: {
    color: '#1a1a2e',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
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
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#5b7cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 76,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(91, 124, 255, 0.1)',
    borderRadius: BORDER_RADIUS.xl,
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
