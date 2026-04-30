class AppConstants {
  static const String appName = 'NeoChat';
  static const String appVersion = '1.0.0';

  // API Configuration
  static const String defaultBaseUrl = 'http://localhost:8080';
  static const String wsBaseUrl = 'ws://localhost:8080';
  static const String apiVersion = 'api/v1';
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Storage Keys
  static const String storageKeyAccessToken = 'access_token';
  static const String storageKeyRefreshToken = 'refresh_token';
  static const String storageKeyUser = 'user';
  static const String storageKeyThemeMode = 'theme_mode';
  static const String storageKeyLanguage = 'language';
  static const String storageKeyConversations = 'conversations';
  static const String storageKeyMessages = 'messages';
  static const String storageKeyFriends = 'friends';
  static const String storageKeyNotificationEnabled = 'notification_enabled';
  static const String storageKeyNotificationShowDetail = 'notification_show_detail';
  static const String storageKeyNotificationSound = 'notification_sound';
  static const String storageKeyNotificationVibration = 'notification_vibration';
  static const String storageKeyChatBackground = 'chat_background';
  static const String storageKeyAutoBackup = 'auto_backup';
  static const String storageKeyLastBackupTime = 'last_backup_time';

  // WebSocket
  static const String wsPath = '/ws';
  static const Duration wsReconnectDelay = Duration(seconds: 5);
  static const Duration wsPingInterval = Duration(seconds: 30);

  // Pagination
  static const int defaultPageSize = 20;
  static const int chatPageSize = 50;

  // File Upload
  static const int maxImageSize = 10 * 1024 * 1024; // 10MB
  static const int maxFileSize = 100 * 1024 * 1024; // 100MB

  // UI
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;
  static const double defaultIconSize = 24.0;
}
