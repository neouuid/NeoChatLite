import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/core/utils/validators.dart';
import 'package:neochat/data/models/auth.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/widgets/common/common.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _emailSent = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendResetEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final request =
          ForgotPasswordRequest(email: _emailController.text.trim());
      final response = await authService.forgotPassword(request);

      if (response.success) {
        setState(() {
          _emailSent = true;
        });
      } else {
        setState(() {
          _errorMessage = response.message ?? '发送失败，请稍后重试';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_errorMessage!),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage!),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final request = ResetPasswordRequest(
        token: _tokenController.text.trim(),
        newPassword: _newPasswordController.text.trim(),
      );
      final response = await authService.resetPassword(request);

      if (response.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('密码重置成功，请重新登录'),
              backgroundColor: AppColors.success,
              duration: Duration(seconds: 2),
            ),
          );
          context.go('/login');
        }
      } else {
        setState(() {
          _errorMessage = response.message ?? '重置失败，请稍后重试';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_errorMessage!),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage!),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _resetToEmail() {
    setState(() {
      _emailSent = false;
      _tokenController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Center(
          child: isMobile
              ? _buildMobileLayout(isDark)
              : _buildDesktopLayout(isDark),
        ),
      ),
    );
  }

  bool get isMobile => MediaQuery.of(context).size.width < 600;

  Widget _buildMobileLayout(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: _buildContent(isDark),
    );
  }

  Widget _buildDesktopLayout(bool isDark) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.all(32),
          child: _buildContent(isDark),
        ),
      ),
    );
  }

  Widget _buildContent(bool isDark) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _buildLogoSection(isDark),
          const SizedBox(height: 32),
          if (_emailSent)
            _buildResetPasswordForm(isDark)
          else
            _buildEmailForm(isDark),
          const SizedBox(height: 32),
          _buildBackToLogin(isDark),
        ],
      ),
    );
  }

  Widget _buildLogoSection(bool isDark) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(36),
          ),
          child: const Icon(
            Icons.lock_reset_outlined,
            color: Colors.white,
            size: 36,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          _emailSent ? '重置密码' : '重置密码',
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color:
                isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _emailSent ? '请输入收到的验证码和新密码' : '请输入您的邮箱地址以重置密码',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
      ],
    );
  }

  Widget _buildEmailForm(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
          controller: _emailController,
          label: '邮箱地址',
          hint: '请输入您的邮箱',
          keyboardType: TextInputType.emailAddress,
          validator: Validators.email,
          enabled: !_isLoading,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleSendResetEmail(),
        ),
        const SizedBox(height: 24),
        AppButton(
          text: '发送重置链接',
          onPressed: _handleSendResetEmail,
          loading: _isLoading,
          disabled: _isLoading,
        ),
      ],
    );
  }

  Widget _buildResetPasswordForm(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle, color: AppColors.success),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '验证码已发送',
                      style: TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '请查收邮件 ${_emailController.text} 并输入验证码',
                      style: const TextStyle(
                        color: AppColors.textSecondaryDark,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        AppInput(
          controller: _tokenController,
          label: '验证码',
          hint: '请输入收到的验证码',
          validator: Validators.required,
          enabled: !_isLoading,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        AppInput(
          controller: _newPasswordController,
          label: '新密码',
          hint: '请输入新密码',
          obscureText: true,
          validator: Validators.password,
          enabled: !_isLoading,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        AppInput(
          controller: _confirmPasswordController,
          label: '确认新密码',
          hint: '请再次输入新密码',
          obscureText: true,
          validator: (value) =>
              Validators.confirmPassword(value, _newPasswordController.text),
          enabled: !_isLoading,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _handleResetPassword(),
        ),
        const SizedBox(height: 24),
        AppButton(
          text: '确认重置',
          onPressed: _handleResetPassword,
          loading: _isLoading,
          disabled: _isLoading,
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: _isLoading ? null : _resetToEmail,
          child: const Text('重新发送验证码'),
        ),
      ],
    );
  }

  Widget _buildBackToLogin(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          '想起密码了？',
          style: TextStyle(
            fontSize: 14,
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(width: 6),
        TextButton(
          onPressed: _isLoading ? null : () => context.go('/login'),
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: const Text(
            '返回登录',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.primary,
            ),
          ),
        ),
      ],
    );
  }
}
