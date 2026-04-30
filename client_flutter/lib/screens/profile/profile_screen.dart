import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:neochat/widgets/common/common.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/auth_provider.dart';
import 'package:neochat/providers/services_provider.dart';
import 'package:neochat/data/models/user.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isEditing = false;
  final TextEditingController _nicknameController = TextEditingController();
  final TextEditingController _signatureController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  String? _avatarPath;

  @override
  void dispose() {
    _nicknameController.dispose();
    _signatureController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _avatarPath = image.path;
      });
    }
  }

  Future<void> _saveProfile() async {
    setState(() {
      _isEditing = false;
    });

    final user = ref.read(authStateProvider).user;
    if (user == null) return;

    try {
      final authService = ref.read(authServiceProvider);
      final data = <String, dynamic>{};

      if (_nicknameController.text.isNotEmpty &&
          _nicknameController.text != user.nickname) {
        data['nickname'] = _nicknameController.text;
      }
      if (_signatureController.text.isNotEmpty &&
          _signatureController.text != user.bio) {
        data['bio'] = _signatureController.text;
      }
      if (_phoneController.text.isNotEmpty &&
          _phoneController.text != user.phone) {
        data['phone'] = _phoneController.text;
      }
      if (_emailController.text.isNotEmpty &&
          _emailController.text != user.email) {
        data['email'] = _emailController.text;
      }

      if (data.isNotEmpty) {
        await authService.updateProfile(data);
        await ref.read(authStateProvider.notifier).loadUser();
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('保存成功')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isMobile = MediaQuery.of(context).size.width < 768;
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('个人资料'),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: () {
              if (_isEditing) {
                _saveProfile();
              } else {
                setState(() {
                  _nicknameController.text = user?.nickname ?? '';
                  _signatureController.text = user?.bio ?? '';
                  _phoneController.text = user?.phone ?? '';
                  _emailController.text = user?.email ?? '';
                  _isEditing = true;
                });
              }
            },
            child: Text(_isEditing ? '保存' : '编辑'),
          ),
        ],
      ),
      body: SafeArea(
        child: isMobile
            ? _buildMobileLayout(context, isDark, user)
            : _buildDesktopLayout(context, isDark, user),
      ),
    );
  }

  Widget _buildMobileLayout(BuildContext context, bool isDark, User? user) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildProfileCard(context, isDark, user),
        const SizedBox(height: 20),
        _buildInfoSection(context, isDark, user),
      ],
    );
  }

  Widget _buildDesktopLayout(BuildContext context, bool isDark, User? user) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _buildProfileCard(context, isDark, user),
            const SizedBox(height: 24),
            _buildInfoSection(context, isDark, user),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard(BuildContext context, bool isDark, User? user) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Stack(
            children: [
              _avatarPath != null
                  ? ClipOval(
                      child: Image.file(
                        File(_avatarPath!),
                        width: 120,
                        height: 120,
                        fit: BoxFit.cover,
                      ),
                    )
                  : AppAvatar(
                      name: user?.nickname ?? '用户',
                      size: AvatarSize.extraLarge,
                      avatarUrl: user?.avatar,
                      backgroundColor: AppColors.warning,
                    ),
              if (_isEditing)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: _pickAvatar,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isDark
                              ? AppColors.surfaceDark
                              : AppColors.surfaceLight,
                          width: 3,
                        ),
                      ),
                      child: const Icon(
                        Icons.camera_alt,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isEditing)
            AppInput(
              controller: _nicknameController,
              hint: '请输入昵称',
              textAlign: TextAlign.center,
            )
          else
            Text(
              user?.nickname ?? '用户',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
              ),
            ),
          if (!_isEditing && user?.username != null) const SizedBox(height: 4),
          if (!_isEditing && user?.username != null)
            Text(
              '@${user!.username}',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondaryDark,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context, bool isDark, User? user) {
    final phone = user?.phone;
    final phoneDisplay = phone != null
        ? '${phone.substring(0, 3)}****${phone.substring(7)}'
        : '未设置';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '基本信息',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoItem(
            isDark,
            '昵称',
            user?.nickname ?? '未设置',
            isEditing: _isEditing,
            controller: _nicknameController,
            hint: '请输入昵称',
          ),
          _buildDivider(isDark),
          _buildInfoItem(
            isDark,
            '手机号',
            phoneDisplay,
            isEditing: _isEditing,
            controller: _phoneController,
            hint: '请输入手机号',
            keyboardType: TextInputType.phone,
          ),
          _buildDivider(isDark),
          _buildInfoItem(
            isDark,
            '邮箱',
            user?.email ?? '未设置',
            isEditing: _isEditing,
            controller: _emailController,
            hint: '请输入邮箱',
            keyboardType: TextInputType.emailAddress,
          ),
          _buildDivider(isDark),
          _buildInfoItem(
            isDark,
            '地区',
            '未设置',
            isEditing: _isEditing,
            showArrow: true,
          ),
          _buildDivider(isDark),
          _buildInfoItem(
            isDark,
            '个性签名',
            user?.bio ?? '暂无签名',
            isEditing: _isEditing,
            controller: _signatureController,
            hint: '请输入个性签名',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    bool isDark,
    String label,
    String value, {
    bool isEditing = false,
    TextEditingController? controller,
    String? hint,
    TextInputType? keyboardType,
    bool showArrow = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.textSecondaryDark,
              ),
            ),
          ),
          if (isEditing && controller != null)
            Expanded(
              flex: 2,
              child: AppInput(
                controller: controller,
                hint: hint,
                textAlign: TextAlign.right,
                keyboardType: keyboardType,
              ),
            )
          else
            Expanded(
              flex: 2,
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontSize: 15,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
              ),
            ),
          if (showArrow) const SizedBox(width: 8),
          if (showArrow)
            const Icon(
              Icons.chevron_right,
              color: AppColors.textSecondaryDark,
            ),
        ],
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      color: isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight,
    );
  }
}
