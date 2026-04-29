import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:path_provider/path_provider.dart';
import 'package:neochat/app.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/hive_adapters.dart';
import 'package:neochat/data/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize logger
  Logger.init();

  // Initialize dependencies
  await initDependencies();

  runApp(
    ProviderScope(
      observers: [
        ProviderLogger(),
      ],
      child: const NeoChatApp(),
    ),
  );
}

Future<void> initDependencies() async {
  // Initialize Hive
  final appDir = await getApplicationDocumentsDirectory();
  Hive.init(appDir.path);

  // Register Hive adapters
  registerHiveAdapters();

  // Initialize storage service
  final storageService = StorageService();
  await storageService.init();
}

class ProviderLogger extends ProviderObserver {
  @override
  void didUpdateProvider(
    ProviderBase<Object?> provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    Logger.debug('Provider updated: ${provider.name ?? provider.runtimeType}');
  }

  @override
  void didAddProvider(
    ProviderBase<Object?> provider,
    Object? value,
    ProviderContainer container,
  ) {
    Logger.debug('Provider added: ${provider.name ?? provider.runtimeType}');
  }

  @override
  void didDisposeProvider(
    ProviderBase<Object?> provider,
    ProviderContainer container,
  ) {
    Logger.debug('Provider disposed: ${provider.name ?? provider.runtimeType}');
  }
}
