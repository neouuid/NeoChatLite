import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/auth.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/services/api_service.dart';
import 'package:neochat/data/services/auth_service.dart';
import 'package:neochat/data/services/storage_service.dart';
import 'package:neochat/data/services/websocket_service.dart';
import 'package:neochat/providers/services_provider.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final apiService = ref.watch(apiServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  final wsService = ref.watch(webSocketServiceProvider);
  return AuthNotifier(authService, apiService, storageService, wsService);
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final User? user;
  final String? error;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    User? user,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error ?? this.error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final ApiService _apiService;
  final StorageService _storageService;
  final WebSocketService _wsService;

  AuthNotifier(this._authService, this._apiService, this._storageService, this._wsService) : super(AuthState()) {
    _init();
  }

  Future<void> _init() async {
    await _storageService.init();
    await _loadSavedTokens();
  }

  Future<void> _loadSavedTokens() async {
    try {
      final accessToken = _storageService.getAccessToken();
      final refreshToken = _storageService.getRefreshToken();

      if (accessToken != null && refreshToken != null) {
        _apiService.setTokens(accessToken, refreshToken);
        final response = await _authService.getCurrentUser();
        if (response.success && response.data != null) {
          await _storageService.setCurrentUser(response.data!);
          _wsService.connect();
          state = state.copyWith(
            isAuthenticated: true,
            user: response.data,
          );
        }
      }
    } catch (e, stackTrace) {
      Logger.error('Failed to load saved tokens', error: e, stackTrace: stackTrace);
    }
  }

  Future<bool> login(String identifier, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final request = LoginRequest(identifier: identifier, password: password);
      final response = await _authService.login(request);

      if (response.success && response.data != null) {
        await _saveAuthData(response.data!);
        _wsService.connect();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: response.data!.user,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Login failed',
        );
        return false;
      }
    } catch (e, stackTrace) {
      Logger.error('Login failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> register({
    required String username,
    required String nickname,
    required String password,
    required String confirmPassword,
    String? email,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final request = RegisterRequest(
        username: username,
        nickname: nickname,
        password: password,
        confirmPassword: confirmPassword,
        email: email,
        phone: phone,
      );
      final response = await _authService.register(request);

      if (response.success && response.data != null) {
        await _saveAuthData(response.data!);
        _wsService.connect();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: response.data!.user,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Registration failed',
        );
        return false;
      }
    } catch (e, stackTrace) {
      Logger.error('Registration failed', error: e, stackTrace: stackTrace);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
    } catch (e, stackTrace) {
      Logger.error('Logout API failed', error: e, stackTrace: stackTrace);
    }
    _wsService.disconnect();
    await _clearAuthData();
    state = AuthState();
  }

  Future<void> _saveAuthData(AuthResponse authResponse) async {
    await _storageService.setAccessToken(authResponse.accessToken);
    await _storageService.setRefreshToken(authResponse.refreshToken);
    await _storageService.setCurrentUser(authResponse.user);
    _apiService.setTokens(authResponse.accessToken, authResponse.refreshToken);
  }

  Future<void> _clearAuthData() async {
    await _storageService.clearTokens();
    await _storageService.clearCurrentUser();
    await _storageService.clearAll();
    _apiService.clearTokens();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
