import 'dart:developer' as developer;

class Logger {
  static bool _isInitialized = false;
  static bool _enableDebug = true;

  static void init({bool enableDebug = true}) {
    _isInitialized = true;
    _enableDebug = enableDebug;
  }

  static void debug(String message, {String? tag}) {
    if (!_isInitialized || !_enableDebug) return;
    developer.log(
      message,
      name: tag ?? 'DEBUG',
      time: DateTime.now(),
    );
  }

  static void info(String message, {String? tag}) {
    if (!_isInitialized) return;
    developer.log(
      message,
      name: tag ?? 'INFO',
      time: DateTime.now(),
    );
  }

  static void warning(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    if (!_isInitialized) return;
    developer.log(
      message,
      name: tag ?? 'WARNING',
      error: error,
      stackTrace: stackTrace,
      time: DateTime.now(),
    );
  }

  static void error(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    if (!_isInitialized) return;
    developer.log(
      message,
      name: tag ?? 'ERROR',
      error: error,
      stackTrace: stackTrace,
      time: DateTime.now(),
    );
  }
}
