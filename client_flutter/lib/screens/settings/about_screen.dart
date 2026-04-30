import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:neochat/core/theme/app_theme.dart';

class AboutScreen extends ConsumerStatefulWidget {
  const AboutScreen({super.key});

  @override
  ConsumerState<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends ConsumerState<AboutScreen> {
  PackageInfo? _packageInfo;
  bool _isCheckingUpdate = false;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() {
        _packageInfo = info;
      });
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('无法打开链接'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _checkUpdate() async {
    setState(() {
      _isCheckingUpdate = true;
    });

    try {
      // Simulate checking for updates
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已是最新版本')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCheckingUpdate = false;
        });
      }
    }
  }

  void _showLicensePage() {
    showLicensePage(
      context: context,
      applicationName: _packageInfo?.appName ?? 'NeoChat',
      applicationVersion: _packageInfo?.version ?? '1.0.0',
      applicationLegalese: '© 2024 NeoChat',
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        title: const Text('关于'),
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
                const SizedBox(height: 32),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.chat_bubble,
                      size: 40, color: Colors.white),
                ),
                const SizedBox(height: 16),
                Text(
                  _packageInfo?.appName ?? 'NeoChat',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Version ${_packageInfo?.version ?? '1.0.0'}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
                const SizedBox(height: 32),
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
                  title: const Text('用户协议'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _launchUrl('https://neochat.app/terms'),
                ),
                Divider(
                    height: 1,
                    color: isDark
                        ? AppColors.inputBackgroundDark
                        : AppColors.backgroundLight),
                ListTile(
                  title: const Text('隐私政策'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _launchUrl('https://neochat.app/privacy'),
                ),
                Divider(
                    height: 1,
                    color: isDark
                        ? AppColors.inputBackgroundDark
                        : AppColors.backgroundLight),
                ListTile(
                  title: const Text('开源许可'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _showLicensePage,
                ),
                Divider(
                    height: 1,
                    color: isDark
                        ? AppColors.inputBackgroundDark
                        : AppColors.backgroundLight),
                ListTile(
                  title: const Text('检查更新'),
                  subtitle: const Text('已是最新版本'),
                  trailing: _isCheckingUpdate
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.chevron_right),
                  onTap: _isCheckingUpdate ? null : _checkUpdate,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
