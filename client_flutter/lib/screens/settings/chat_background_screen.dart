import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/providers/settings_provider.dart';

class ChatBackgroundScreen extends ConsumerStatefulWidget {
  const ChatBackgroundScreen({super.key});

  @override
  ConsumerState<ChatBackgroundScreen> createState() =>
      _ChatBackgroundScreenState();
}

class _ChatBackgroundScreenState extends ConsumerState<ChatBackgroundScreen> {
  // ignore: unused_field
  String? _selectedBackground;
  int _selectedPresetIndex = 0;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _presetBackgrounds = [
    {'name': '默认', 'type': 'default'},
    {'name': '蓝色', 'type': 'color', 'color': Colors.blue.shade50},
    {'name': '绿色', 'type': 'color', 'color': Colors.green.shade50},
    {'name': '紫色', 'type': 'color', 'color': Colors.purple.shade50},
    {'name': '橙色', 'type': 'color', 'color': Colors.orange.shade50},
    {'name': '粉色', 'type': 'color', 'color': Colors.pink.shade50},
  ];

  @override
  void initState() {
    super.initState();
    _selectedBackground = ref.read(chatBackgroundProvider);
  }

  Future<void> _pickFromGallery() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);

      if (image != null && mounted) {
        await ref.read(settingsProvider.notifier).setChatBackground(image.path);
        setState(() {
          _selectedBackground = image.path;
          _selectedPresetIndex = -1;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('背景设置成功')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('选择图片失败: $e'), backgroundColor: AppColors.error),
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

  Future<void> _selectPreset(int index) async {
    setState(() {
      _selectedPresetIndex = index;
    });

    final preset = _presetBackgrounds[index];
    if (preset['type'] == 'default') {
      await ref.read(settingsProvider.notifier).setChatBackground(null);
      setState(() {
        _selectedBackground = null;
      });
    } else {
      // For color presets, we'll store the color value as a string
      final color = preset['color'] as Color;
      final colorString = 'color:${color.value}';
      await ref.read(settingsProvider.notifier).setChatBackground(colorString);
      setState(() {
        _selectedBackground = colorString;
      });
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('背景设置成功')),
      );
    }
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
        title: const Text('聊天背景'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                decoration: BoxDecoration(
                  color:
                      isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child:
                            const Icon(Icons.image, color: AppColors.primary),
                      ),
                      title: const Text('从相册选择'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: _isLoading ? null : _pickFromGallery,
                    ),
                    Divider(
                        height: 1,
                        color: isDark
                            ? AppColors.inputBackgroundDark
                            : AppColors.backgroundLight),
                    ListTile(
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.color_lens,
                            color: AppColors.primary),
                      ),
                      title: const Text('选择纯色背景'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        // Could expand to show more colors
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                '预设背景',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondaryDark,
                ),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _presetBackgrounds.length,
                itemBuilder: (context, index) {
                  final option = _presetBackgrounds[index];
                  final isSelected = _selectedPresetIndex == index;

                  return GestureDetector(
                    onTap: () => _selectPreset(index),
                    child: Container(
                      decoration: BoxDecoration(
                        color: _getBackgroundColor(option, isDark),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Text(
                              option['name'] as String,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                          if (isSelected)
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check,
                                  size: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  Color _getBackgroundColor(Map<String, dynamic> option, bool isDark) {
    if (option['type'] == 'default') {
      return isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    }
    return option['color'] as Color;
  }
}
