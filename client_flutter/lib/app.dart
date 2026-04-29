import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/core/constants/app_constants.dart';
import 'package:neochat/core/theme/app_theme.dart';
import 'package:neochat/core/router/app_router.dart';
import 'package:neochat/providers/theme_provider.dart';

class NeoChatApp extends ConsumerWidget {
  const NeoChatApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
