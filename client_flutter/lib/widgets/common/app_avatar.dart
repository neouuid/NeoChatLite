import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:neochat/core/theme/app_theme.dart';

enum AvatarSize { extraSmall, small, medium, large, extraLarge }

class AppAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String? name;
  final AvatarSize size;
  final bool showStatus;
  final Color? statusColor;
  final VoidCallback? onTap;
  final Color? backgroundColor;

  const AppAvatar({
    super.key,
    this.avatarUrl,
    this.name,
    this.size = AvatarSize.medium,
    this.showStatus = false,
    this.statusColor,
    this.onTap,
    this.backgroundColor,
  });

  double get _sizeValue {
    switch (size) {
      case AvatarSize.extraSmall:
        return 24;
      case AvatarSize.small:
        return 32;
      case AvatarSize.medium:
        return 48;
      case AvatarSize.large:
        return 64;
      case AvatarSize.extraLarge:
        return 96;
    }
  }

  double get _statusSize {
    switch (size) {
      case AvatarSize.extraSmall:
        return 8;
      case AvatarSize.small:
        return 10;
      case AvatarSize.medium:
        return 14;
      case AvatarSize.large:
        return 18;
      case AvatarSize.extraLarge:
        return 24;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final double avatarSize = _sizeValue;
    final double statusSize = _statusSize;

    Widget avatar = Container(
      width: avatarSize,
      height: avatarSize,
      decoration: BoxDecoration(
        color: backgroundColor ?? (isDark ? AppColors.inputBackgroundDark : AppColors.backgroundLight),
        shape: BoxShape.circle,
      ),
      child: _buildAvatarContent(context, isDark, avatarSize),
    );

    if (showStatus) {
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          Positioned(
            right: -2,
            bottom: -2,
            child: Container(
              width: statusSize,
              height: statusSize,
              decoration: BoxDecoration(
                color: statusColor ?? AppColors.statusOnline,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
                  width: 2,
                ),
              ),
            ),
          ),
        ],
      );
    }

    if (onTap != null) {
      avatar = InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(avatarSize / 2),
        child: avatar,
      );
    }

    return avatar;
  }

  Widget _buildAvatarContent(BuildContext context, bool isDark, double size) {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: CachedNetworkImage(
          imageUrl: avatarUrl!,
          fit: BoxFit.cover,
          width: size,
          height: size,
          placeholder: (context, url) => _buildInitials(isDark),
          errorWidget: (context, url, error) => _buildInitials(isDark),
        ),
      );
    }
    return _buildInitials(isDark);
  }

  Widget _buildInitials(bool isDark) {
    String initials = '';
    if (name != null && name!.isNotEmpty) {
      final parts = name!.trim().split(RegExp(r'\s+'));
      if (parts.isNotEmpty) {
        initials = parts[0][0].toUpperCase();
        if (parts.length > 1) {
          initials += parts[1][0].toUpperCase();
        }
      }
    }

    return Center(
      child: Text(
        initials.isNotEmpty ? initials : '?',
        style: TextStyle(
          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          fontSize: _sizeValue * 0.35,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
