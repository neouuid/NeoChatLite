// 桌面端账号安全页面
import React, { useState, useEffect } from 'react';
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
	authService,
	SPACING,
	TYPOGRAPHY,
	BORDER_RADIUS,
	COLORS,
} from 'neochat-shared';

interface AccountSecurityWindowProps {
	onBack?: () => void;
	onNavigate?: (screen: string, params?: any) => void;
}

type ModalType = 'password' | 'phone' | 'email' | null;

export const AccountSecurityWindow: React.FC<AccountSecurityWindowProps> = ({
	onBack,
	onNavigate,
}) => {
	const { user, logout } = useAuthStore();
	const [isProcessing, setIsProcessing] = useState<string | null>(null);
	const [activeModal, setActiveModal] = useState<ModalType>(null);

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

	// 加载登录历史和设备数据
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
			const code = await authService.sendPhoneVerification(newPhone);
			if (code) {
				Alert.alert('验证码已发送', `验证码: ${code}`);
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
			const code = await authService.sendEmailVerification();
			if (code) {
				Alert.alert('验证码已发送', `验证码: ${code}`);
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
			icon: 'key-outline',
			subtitle: '定期修改密码更安全',
			onPress: () => setActiveModal('password'),
			processing: isProcessing === 'password',
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

	const renderModal = () => {
		if (!activeModal) return null;

		return (
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
							<Ionicons name="close" size={24} color={COLORS.dark.text.secondary} />
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
		);
	};

	return (
		<View style={styles.container}>
			{/* 头部 */}
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={onBack}>
					<Ionicons name="arrow-back" size={20} color="#1a1a2e" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>账号安全</Text>
				<View style={styles.headerRight} />
			</View>

			<ScrollView style={styles.scrollView}>
				{/* 安全设置 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>安全设置</Text>
					<View style={styles.securityCard}>
						{securityItems.map((item, index) => (
							<React.Fragment key={item.id}>
								<TouchableOpacity
									style={styles.securityItem}
									onPress={item.onPress}
									disabled={item.processing}
								>
									<View style={styles.securityLeft}>
										<View style={styles.securityIconContainer}>
											<Ionicons name={item.icon as any} size={20} color="#ffffff" />
										</View>
										<View style={styles.securityText}>
											<Text style={styles.securityTitle}>{item.title}</Text>
											<Text style={styles.securitySubtitle}>{item.subtitle}</Text>
										</View>
									</View>
									{item.processing ? (
										<Ionicons name="hourglass-outline" size={20} color="#8b8bb3" />
									) : (
										<Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
									)}
								</TouchableOpacity>
								{index < securityItems.length - 1 && <View style={styles.securityDivider} />}
							</React.Fragment>
						))}
					</View>
				</View>

				{/* 登录设备 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>登录设备</Text>
					<View style={styles.securityCard}>
						{devices.length > 0 ? (
							devices.map((device, index) => (
								<React.Fragment key={device.id}>
									<View style={styles.securityItem}>
										<View style={styles.securityLeft}>
											<View style={styles.securityIconContainer}>
												<Ionicons
													name={device.type === 'mobile' ? 'phone-portrait-outline' :
													      device.type === 'desktop' ? 'desktop-outline' : 'globe-outline'}
													size={20} color="#ffffff"
												/>
											</View>
											<View style={styles.securityText}>
												<Text style={styles.securityTitle}>{device.name || '未知设备'}</Text>
												<Text style={styles.securitySubtitle}>
													{device.ip_address} - {new Date(device.last_active).toLocaleString()}
												</Text>
											</View>
										</View>
									</View>
									{index < devices.length - 1 && <View style={styles.securityDivider} />}
								</React.Fragment>
							))
						) : (
							<View style={styles.emptyState}>
								<Text style={styles.emptyText}>暂无登录设备记录</Text>
							</View>
						)}
					</View>
				</View>

				{/* 登录历史 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>登录历史</Text>
					<View style={styles.securityCard}>
						{loginHistory.length > 0 ? (
							loginHistory.map((record, index) => (
								<React.Fragment key={record.id}>
									<View style={styles.securityItem}>
										<View style={styles.securityLeft}>
											<View style={styles.securityIconContainer}>
												<Ionicons
													name={record.type === 'login' ? 'log-in-outline' : 'log-out-outline'}
													size={20} color="#ffffff"
												/>
											</View>
											<View style={styles.securityText}>
												<Text style={styles.securityTitle}>
													{record.type === 'login' ? '登录' : '登出'}
												</Text>
												<Text style={styles.securitySubtitle}>
													{record.ip_address} - {new Date(record.created_at).toLocaleString()}
												</Text>
											</View>
										</View>
									</View>
									{index < loginHistory.length - 1 && <View style={styles.securityDivider} />}
								</React.Fragment>
							))
						) : (
							<View style={styles.emptyState}>
								<Text style={styles.emptyText}>暂无登录历史记录</Text>
							</View>
						)}
					</View>
				</View>

				{/* 注销账号 */}
				<View style={styles.section}>
					<TouchableOpacity
						style={styles.dangerCard}
						onPress={handleDeleteAccount}
						disabled={isProcessing === 'delete'}
					>
						<View style={styles.dangerLeft}>
							<View style={styles.dangerIconContainer}>
								{isProcessing === 'delete' ? (
									<Ionicons name="hourglass-outline" size={20} color="#ff4757" />
								) : (
									<Ionicons name="trash-outline" size={20} color="#ff4757" />
								)}
							</View>
							<Text style={styles.dangerTitle}>注销账号</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#8b8bb3" />
					</TouchableOpacity>
				</View>

				{/* 底部安全区域 */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			{renderModal()}
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
	securityCard: {
		backgroundColor: '#ffffff',
		borderRadius: BORDER_RADIUS.xl,
		overflow: 'hidden',
	},
	securityItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	securityLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	securityIconContainer: {
		width: 40,
		height: 40,
		borderRadius: BORDER_RADIUS.md,
		backgroundColor: '#5b7cff',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING.md,
	},
	securityText: {
		flex: 1,
	},
	securityTitle: {
		color: '#1D2129',
		fontSize: TYPOGRAPHY.sizes.md,
	},
	securitySubtitle: {
		color: '#8080a0',
		fontSize: TYPOGRAPHY.sizes.sm,
		marginTop: 2,
	},
	securityDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#e5e5e5',
		marginLeft: 76,
	},
	dangerCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#ffffff',
		borderRadius: BORDER_RADIUS.xl,
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	dangerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dangerIconContainer: {
		width: 40,
		height: 40,
		borderRadius: BORDER_RADIUS.md,
		backgroundColor: 'rgba(255, 71, 87, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: SPACING.md,
	},
	dangerTitle: {
		color: '#ff4757',
		fontSize: TYPOGRAPHY.sizes.md,
	},
	bottomSpacer: {
		height: SPACING.xl,
	},
	emptyState: {
		padding: 40,
		alignItems: 'center',
	},
	emptyText: {
		color: '#8080a0',
		fontSize: TYPOGRAPHY.sizes.sm,
	},
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000,
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderRadius: BORDER_RADIUS.xl,
		width: '100%',
		maxWidth: 480,
		maxHeight: '80%',
		margin: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e5e5e5',
	},
	modalTitle: {
		fontSize: TYPOGRAPHY.sizes.lg,
		fontWeight: TYPOGRAPHY.weights.semibold,
		color: '#1D2129',
	},
	modalClose: {
		padding: 4,
	},
	modalBody: {
		padding: 20,
		maxHeight: 320,
	},
	modalFooter: {
		flexDirection: 'row',
		gap: 12,
		padding: 20,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#e5e5e5',
	},
	formItem: {
		marginBottom: 20,
	},
	formLabel: {
		fontSize: TYPOGRAPHY.sizes.sm,
		color: '#8080a0',
		marginBottom: 8,
		fontWeight: TYPOGRAPHY.weights.medium,
	},
	input: {
		backgroundColor: '#F7F8FA',
		borderRadius: BORDER_RADIUS.md,
		paddingHorizontal: 16,
		paddingVertical: 12,
		color: '#1D2129',
		fontSize: TYPOGRAPHY.sizes.md,
	},
	inputRow: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'center',
	},
	sendCodeBtn: {
		backgroundColor: '#5b7cff',
		borderRadius: BORDER_RADIUS.md,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	sendCodeText: {
		color: '#ffffff',
		fontSize: TYPOGRAPHY.sizes.sm,
	},
	btn: {
		flex: 1,
		borderRadius: BORDER_RADIUS.md,
		paddingVertical: 12,
		alignItems: 'center',
	},
	btnCancel: {
		backgroundColor: '#F7F8FA',
	},
	btnCancelText: {
		color: '#8080a0',
		fontSize: TYPOGRAPHY.sizes.md,
	},
	btnPrimary: {
		backgroundColor: '#5b7cff',
	},
	btnPrimaryText: {
		color: '#ffffff',
		fontSize: TYPOGRAPHY.sizes.md,
	},
});
