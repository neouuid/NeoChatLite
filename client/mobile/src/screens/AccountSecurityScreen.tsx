// 账户安全页面

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthStore,
  authService,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '@neochat/shared';

export const AccountSecurityScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'password' | 'phone' | 'email' | null>(null);

  // 修改密码表单
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 修改手机/邮箱表单
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');

  // 登录历史和设备数据
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  // 加载登录历史和设备
  const loadSecurityData = async () => {
    try {
      const [historyRes, devicesRes] = await Promise.all([
        authService.getLoginHistory(),
        authService.getDevices(),
      ]);
      if (historyRes.success) {
        setLoginHistory(historyRes.data?.list || []);
      }
      if (devicesRes.success) {
        setDevices(devicesRes.data?.devices || []);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    setIsProcessing('password');
    try {
      await authService.changePassword(oldPassword, newPassword);
      Alert.alert('成功', '密码已修改');
      setActiveModal(null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('错误', (error as Error).message || '修改密码失败');
    } finally {
      setIsProcessing(null);
    }
  };

  // 发送手机验证码
  const handleSendPhoneCode = async () => {
    if (!newPhone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    setIsProcessing('phone_code');
    try {
      const res = await authService.sendPhoneVerification(newPhone);
      if (res.success && res.data?.code) {
        Alert.alert('验证码已发送', `验证码: ${res.data.code}`);
      } else {
        Alert.alert('提示', '验证码已发送');
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message || '发送失败');
    } finally {
      setIsProcessing(null);
    }
  };

  // 修改手机号
  const handleUpdatePhone = async () => {
    if (!newPhone || !phoneCode) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    setIsProcessing('phone');
    try {
      await authService.updatePhone(newPhone, phoneCode);
      Alert.alert('成功', '手机号已修改');
      setActiveModal(null);
      setNewPhone('');
      setPhoneCode('');
      await loadSecurityData();
    } catch (error) {
      Alert.alert('错误', (error as Error).message || '修改失败');
    } finally {
      setIsProcessing(null);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!newEmail) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }

    setIsProcessing('email_code');
    try {
      const res = await authService.sendEmailVerification();
      if (res.success && res.data?.code) {
        Alert.alert('验证码已发送', `验证码: ${res.data.code}`);
      } else {
        Alert.alert('提示', '验证码已发送');
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message || '发送失败');
    } finally {
      setIsProcessing(null);
    }
  };

  // 修改邮箱
  const handleUpdateEmail = async () => {
    if (!newEmail || !emailCode) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    setIsProcessing('email');
    try {
      await authService.updateEmail(newEmail, emailCode);
      Alert.alert('成功', '邮箱已修改');
      setActiveModal(null);
      setNewEmail('');
      setEmailCode('');
      await loadSecurityData();
    } catch (error) {
      Alert.alert('错误', (error as Error).message || '修改失败');
    } finally {
      setIsProcessing(null);
    }
  };

  // 注销账号
  const handleDeleteAccount = () => {
    Alert.alert(
      '注销账号',
      '注销账号后，您的所有数据将被删除且无法恢复。确定要注销吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定注销',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              '确认密码',
              '请输入密码确认注销',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '确定',
                  onPress: async (password) => {
                    if (!password) {
                      Alert.alert('提示', '请输入密码');
                      return;
                    }

                    setIsProcessing('delete');
                    try {
                      await authService.deleteAccount(password);
                      Alert.alert('已注销', '账号已成功注销');
                      logout();
                    } catch (error) {
                      Alert.alert('错误', (error as Error).message || '注销失败');
                    } finally {
                      setIsProcessing(null);
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ]
    );
  };

  const securityItems = [
    {
      id: 'password',
      title: '修改密码',
      icon: 'lock-closed-outline',
      subtitle: '定期修改密码以保护账户安全',
      onPress: () => setActiveModal('password'),
    },
    {
      id: 'phone',
      title: '手机号',
      icon: 'phone-portrait-outline',
      subtitle: user?.phone || '未绑定',
      onPress: () => {
        setNewPhone(user?.phone || '');
        setActiveModal('phone');
      },
    },
    {
      id: 'email',
      title: '邮箱',
      icon: 'mail-outline',
      subtitle: user?.email || '未绑定',
      onPress: () => {
        setNewEmail(user?.email || '');
        setActiveModal('email');
      },
    },
  ];

  const renderMenuItem = (item: any) => {
    return (
      <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress} disabled={isProcessing !== null}>
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primary }]}>
            <Ionicons
              name={item.icon as any}
              size={20}
              color="#ffffff"
            />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>
              {item.title}
            </Text>
            <Text style={styles.menuItemSubtitle}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.dark.text.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderListSection = (title: string, items: any[], emptyText: string) => (
    <View style={styles.menuSection} key={title}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primary }]}>
                    <Ionicons
                      name={
                        item.type
                          ? (item.type === 'login' ? 'log-in-outline' : 'log-out-outline')
                          : (item.type === 'mobile' ? 'phone-portrait-outline' :
                             item.type === 'desktop' ? 'desktop-outline' : 'globe-outline')
                      }
                      size={20}
                      color="#ffffff"
                    />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>
                      {item.name || (item.type === 'login' ? '登录' : '登出')}
                    </Text>
                    <Text style={styles.menuItemSubtitle}>
                      {item.ip_address} • {new Date(item.last_active || item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
              {index < items.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDangerItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress} disabled={isProcessing !== null}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(255,71,87,0.1)' }]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color={COLORS.error}
          />
        </View>
        <Text style={[styles.menuItemTitle, styles.menuItemTitleDanger]}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const dangerItems = [
    {
      id: 'delete-account',
      title: '注销账户',
      icon: 'trash-outline',
      onPress: handleDeleteAccount,
    },
  ];

  const renderModal = () => (
    <Modal
      visible={activeModal !== null}
      transparent
      animationType="slide"
      onRequestClose={() => setActiveModal(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeModal === 'password' ? '修改密码' :
               activeModal === 'phone' ? '修改手机号' : '修改邮箱'}
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setActiveModal(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.dark.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {activeModal === 'password' && (
              <>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>当前密码</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="请输入当前密码"
                    placeholderTextColor={COLORS.dark.text.tertiary}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>新密码</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="请输入新密码"
                    placeholderTextColor={COLORS.dark.text.tertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>确认密码</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="请再次输入新密码"
                    placeholderTextColor={COLORS.dark.text.tertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </>
            )}

            {activeModal === 'phone' && (
              <>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>新手机号</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="请输入手机号"
                      placeholderTextColor={COLORS.dark.text.tertiary}
                      value={newPhone}
                      onChangeText={setNewPhone}
                      keyboardType="phone-pad"
                    />
                    <TouchableOpacity
                      style={styles.sendCodeBtn}
                      onPress={handleSendPhoneCode}
                      disabled={isProcessing === 'phone_code'}
                    >
                      <Text style={styles.sendCodeText}>
                        {isProcessing === 'phone_code' ? '发送中...' : '获取验证码'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>验证码</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入验证码"
                    placeholderTextColor={COLORS.dark.text.tertiary}
                    value={phoneCode}
                    onChangeText={setPhoneCode}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}

            {activeModal === 'email' && (
              <>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>新邮箱</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="请输入邮箱"
                      placeholderTextColor={COLORS.dark.text.tertiary}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      keyboardType="email-address"
                    />
                    <TouchableOpacity
                      style={styles.sendCodeBtn}
                      onPress={handleSendEmailCode}
                      disabled={isProcessing === 'email_code'}
                    >
                      <Text style={styles.sendCodeText}>
                        {isProcessing === 'email_code' ? '发送中...' : '获取验证码'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>验证码</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入验证码"
                    placeholderTextColor={COLORS.dark.text.tertiary}
                    value={emailCode}
                    onChangeText={setEmailCode}
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.btnCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                if (activeModal === 'password') {
                  handleChangePassword();
                } else if (activeModal === 'phone') {
                  handleUpdatePhone();
                } else if (activeModal === 'email') {
                  handleUpdateEmail();
                }
              }}
              disabled={isProcessing !== null}
            >
              <Text style={styles.btnPrimaryText}>
                {isProcessing !== null ? '处理中...' : '确定'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>账户安全</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.tipsContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.primary}
            style={styles.tipsIcon}
          />
          <Text style={styles.tipsText}>
            建议开启双重验证，定期修改密码，保护您的账户安全。
          </Text>
        </View>

        {/* 安全设置 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>安全设置</Text>
          <View style={styles.menuCard}>
            {securityItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
                {index < securityItems.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 登录设备 */}
        {renderListSection('登录设备', devices, '暂无登录设备记录')}

        {/* 登录历史 */}
        {renderListSection('登录历史', loginHistory, '暂无登录历史记录')}

        {/* 危险操作 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>危险操作</Text>
          <View style={styles.menuCard}>
            {dangerItems.map(renderDangerItem)}
          </View>
        </View>

        {/* 底部安全区域 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderModal()}
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
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  tipsIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  tipsText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 18,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  menuItemTitleDanger: {
    color: COLORS.error,
  },
  menuItemSubtitle: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs / 2,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.dark.border,
    marginLeft: SPACING.lg + 36 + SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.dark.text.tertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    margin: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.dark.text.primary,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: SPACING.lg,
    maxHeight: 320,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.dark.border,
  },
  formItem: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dark.text.secondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  input: {
    backgroundColor: COLORS.dark.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  sendCodeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  sendCodeText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  btn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: COLORS.dark.background,
  },
  btnCancelText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
