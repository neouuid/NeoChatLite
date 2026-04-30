import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/data/services/storage_service.dart';
import 'package:neochat/providers/services_provider.dart';

class NotificationSettings {
  final bool enabled;
  final bool showDetail;
  final bool sound;
  final bool vibration;

  NotificationSettings({
    required this.enabled,
    required this.showDetail,
    required this.sound,
    required this.vibration,
  });

  NotificationSettings copyWith({
    bool? enabled,
    bool? showDetail,
    bool? sound,
    bool? vibration,
  }) {
    return NotificationSettings(
      enabled: enabled ?? this.enabled,
      showDetail: showDetail ?? this.showDetail,
      sound: sound ?? this.sound,
      vibration: vibration ?? this.vibration,
    );
  }
}

class BackupSettings {
  final bool autoBackup;
  final DateTime? lastBackupTime;

  BackupSettings({
    required this.autoBackup,
    this.lastBackupTime,
  });

  BackupSettings copyWith({
    bool? autoBackup,
    DateTime? lastBackupTime,
  }) {
    return BackupSettings(
      autoBackup: autoBackup ?? this.autoBackup,
      lastBackupTime: lastBackupTime ?? this.lastBackupTime,
    );
  }
}

class SettingsNotifier extends Notifier<NotificationSettings> {
  late StorageService _storageService;

  @override
  NotificationSettings build() {
    _storageService = ref.watch(storageServiceProvider);
    return _loadSettings();
  }

  NotificationSettings _loadSettings() {
    return NotificationSettings(
      enabled: _storageService.getNotificationEnabled(),
      showDetail: _storageService.getNotificationShowDetail(),
      sound: _storageService.getNotificationSound(),
      vibration: _storageService.getNotificationVibration(),
    );
  }

  // Notification settings
  Future<void> setEnabled(bool value) async {
    await _storageService.setNotificationEnabled(value);
    state = state.copyWith(enabled: value);
  }

  Future<void> setShowDetail(bool value) async {
    await _storageService.setNotificationShowDetail(value);
    state = state.copyWith(showDetail: value);
  }

  Future<void> setSound(bool value) async {
    await _storageService.setNotificationSound(value);
    state = state.copyWith(sound: value);
  }

  Future<void> setVibration(bool value) async {
    await _storageService.setNotificationVibration(value);
    state = state.copyWith(vibration: value);
  }

  // Chat background
  String? getChatBackground() => _storageService.getChatBackground();

  Future<void> setChatBackground(String? path) async {
    await _storageService.setChatBackground(path);
  }

  // Backup settings
  BackupSettings getBackupSettings() {
    return BackupSettings(
      autoBackup: _storageService.getAutoBackup(),
      lastBackupTime: _storageService.getLastBackupTime(),
    );
  }

  Future<void> setAutoBackup(bool value) async {
    await _storageService.setAutoBackup(value);
  }

  Future<void> setLastBackupTime(DateTime time) async {
    await _storageService.setLastBackupTime(time);
  }
}

final settingsProvider = NotifierProvider<SettingsNotifier, NotificationSettings>(() {
  return SettingsNotifier();
});

final backupSettingsProvider = Provider<BackupSettings>((ref) {
  final settingsNotifier = ref.watch(settingsProvider.notifier);
  return settingsNotifier.getBackupSettings();
});

final chatBackgroundProvider = Provider<String?>((ref) {
  final settingsNotifier = ref.watch(settingsProvider.notifier);
  return settingsNotifier.getChatBackground();
});
