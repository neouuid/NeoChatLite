import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/data/services/api_service.dart';
import 'package:neochat/data/services/auth_service.dart';
import 'package:neochat/data/services/chat_service.dart';
import 'package:neochat/data/services/user_service.dart';
import 'package:neochat/data/services/websocket_service.dart';
import 'package:neochat/data/services/storage_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AuthService(api);
});

final chatServiceProvider = Provider<ChatService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return ChatService(api);
});

final userServiceProvider = Provider<UserService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return UserService(api);
});

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return WebSocketService(api);
});
