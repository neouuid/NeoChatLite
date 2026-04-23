// 桌面端通知设置页面

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from 'neochat-shared';

interface NotificationSettingsWindowProps {
  onBack?: () => void;
}

export const NotificationSettingsWindow: React.FC<NotificationSettingsWindowProps> = ({ onBack }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messageSound, setMessageSound] = useState(true);
  const [messageVibrate, setMessageVibrate] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通知设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 总开�?*/}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications-outline" size={20} color="#ffffff" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>消息通知</Text>
                  <Text style={styles.settingSubtitle}>开启后可接收新消息通知</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                thumbColor={notificationsEnabled ? '#5b7cff' : '#8b8bb3'}
              />
            </View>
          </View>
        </View>

        {/* 消息设置 - 仅在开启时显示 */}
        {notificationsEnabled && (
          <>
            {/* 新消息通知 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>新消息通知</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingTitle}>声音</Text>
                  <Switch
                    value={messageSound}
                    onValueChange={setMessageSound}
                    trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                    thumbColor={messageSound ? '#5b7cff' : '#8b8bb3'}
                  />
                </View>
                <View style={styles.settingDivider} />
                <View style={styles.settingItem}>
                  <Text style={styles.settingTitle}>震动</Text>
                  <Switch
                    value={messageVibrate}
                    onValueChange={setMessageVibrate}
                    trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                    thumbColor={messageVibrate ? '#5b7cff' : '#8b8bb3'}
                  />
                </View>
                <View style={styles.settingDivider} />
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>通知预览</Text>
                    <Text style={styles.settingSubtitle}>显示消息内容预览</Text>
                  </View>
                  <Switch
                    value={messagePreview}
                    onValueChange={setMessagePreview}
                    trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                    thumbColor={messagePreview ? '#5b7cff' : '#8b8bb3'}
                  />
                </View>
              </View>
            </View>

            {/* 群聊通知 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>群聊通知</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>群消息通知</Text>
                    <Text style={styles.settingSubtitle}>接收群聊新消�?/Text>
                  </View>
                  <Switch
                    value={groupNotifications}
                    onValueChange={setGroupNotifications}
                    trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                    thumbColor={groupNotifications ? '#5b7cff' : '#8b8bb3'}
                  />
                </View>
                <View style={styles.settingDivider} />
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingTitle}>@我通知</Text>
                    <Text style={styles.settingSubtitle}>有人@我时通知</Text>
                  </View>
                  <Switch
                    value={mentionNotifications}
                    onValueChange={setMentionNotifications}
                    trackColor={{ false: '#e5e5e5', true: 'rgba(91, 124, 255, 0.5)' }}
                    thumbColor={mentionNotifications ? '#5b7cff' : '#8b8bb3'}
                  />
                </View>
              </View>
            </View>
          </>
        )}

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
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: '#1D2129',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  settingSubtitle: {
    color: '#8080a0',
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
    marginLeft: 20,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
