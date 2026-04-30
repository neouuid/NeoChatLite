import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/data/services/auth_service.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class AccountSecurityScreen extends ConsumerStatefulWidget {
  const AccountSecurityScreen({super.key});

  @override
  ConsumerState<AccountSecurityScreen> createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends ConsumerState<AccountSecurityScreen> {
  bool _loginProtection = true;
  bool _isChangingPassword = false;
  bool _isDeletingAccount = false;

  void _showChangePasswordDialog() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text('修改密码'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppInput(
                  controller: oldPasswordController,
                  label: '当前密码',
                  obscureText: true,
                  validator: (value) => value?.isEmpty ?? true ? '请输入当前密码' : null,
                ),
                const SizedBox(height: 12),
                AppInput(
                  controller: newPasswordController,
                  label: '新密码',
                  obscureText: true,
                  validator: (value) {
                    if (value?.isEmpty ?? true) return '请输入新密码';
                    if ((value?.length ?? 0) < 6) return '密码至少6位';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                AppInput(
                  controller: confirmPasswordController,
                  label: '确认新密码',
                  obscureText: true,
                  validator: (value) {
                    if (value != newPasswordController.text) return '两次密码不一致';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => context.pop(), child: const Text('取消')),
            TextButton(
              onPressed: _isChangingPassword
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;

                      setModalState(() {
                        _isChangingPassword = true;
                      });

                      try {
                        final authService = ref.read(authServiceProvider);
                        // TODO: Implement change password API
                        await Future.delayed(const Duration(seconds: 1));

                        if (context.mounted) {
                          context.pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('密码修改成功')),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('修改失败: $e'), backgroundColor: AppColors.error),
                          );
                        }
                      } finally {
                        if (mounted) {
                          setState(() {
                            _isChangingPassword = false;
                          });
                        }
                      }
                    },
              child: _isChangingPassword
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('确定'),
            ),
          ],
        ),
      ),
    );
  }

  void _showBindPhoneDialog() {
    final phoneController = TextEditingController();
    final codeController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('绑定手机号'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppInput(
                controller: phoneController,
                label: '手机号',
                keyboardType: TextInputType.phone,
                validator: (value) => value?.isEmpty ?? true ? '请输入手机号' : null,
              ),
              const SizedBox(height: 12),
              AppInput(
                controller: codeController,
                label: '验证码',
                keyboardType: TextInputType.number,
                validator: (value) => value?.isEmpty ?? true ? '请输入验证码' : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => context.pop(), child: const Text('取消')),
          TextButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              context.pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('绑定成功')),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showBindEmailDialog() {
    final emailController = TextEditingController();
    final codeController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('绑定邮箱'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppInput(
                controller: emailController,
                label: '邮箱地址',
                keyboardType: TextInputType.emailAddress,
                validator: (value) => value?.isEmpty ?? true ? '请输入邮箱地址' : null,
              ),
              const SizedBox(height: 12),
              AppInput(
                controller: codeController,
                label: '验证码',
                keyboardType: TextInputType.number,
                validator: (value) => value?.isEmpty ?? true ? '请输入验证码' : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => context.pop(), child: const Text('取消')),
          TextButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              context.pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('绑定成功')),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text('注销账号'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '此操作将永久删除您的账号和所有数据，无法恢复，请谨慎操作！',
                style: TextStyle(color: AppColors.error),
              ),
              const SizedBox(height: 16),
              Form(
                key: formKey,
                child: AppInput(
                  controller: passwordController,
                  label: '请输入密码确认',
                  obscureText: true,
                  validator: (value) => value?.isEmpty ?? true ? '请输入密码' : null,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => context.pop(), child: const Text('取消')),
            TextButton(
              onPressed: _isDeletingAccount
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;

                      setModalState(() {
                        _isDeletingAccount = true;
                      });

                      try {
                        final authService = ref.read(authServiceProvider);
                        // TODO: Implement delete account API
                        await Future.delayed(const Duration(seconds: 1));

                        if (context.mounted) {
                          await ref.read(authStateProvider.notifier).logout();
                          context.go('/login');
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('注销失败: $e'), backgroundColor: AppColors.error),
                          );
                        }
                      } finally {
                        if (mounted) {
                          setState(() {
                            _isDeletingAccount = false;
                          });
                        }
                      }
                    },
              style: TextButton.styleFrom(foregroundColor: AppColors.error),
              child: _isDeletingAccount
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('确认注销'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('账号安全'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                ListTile(
                  title: const Text('修改密码'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _showChangePasswordDialog,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                ListTile(
                  title: const Text('绑定手机号'),
                  subtitle: Text(user?.phone != null ? user!.phone! : '未绑定'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _showBindPhoneDialog,
                ),
                Divider(height: 1, color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
                ListTile(
                  title: const Text('绑定邮箱'),
                  subtitle: Text(user?.email != null ? user!.email! : '未绑定'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _showBindEmailDialog,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('登录保护'),
                  subtitle: const Text('新设备登录需要验证'),
                  value: _loginProtection,
                  onChanged: (value) {
                    setState(() {
                      _loginProtection = value;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                ListTile(
                  title: const Text('注销账号'),
                  textColor: AppColors.error,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _showDeleteAccountDialog,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
