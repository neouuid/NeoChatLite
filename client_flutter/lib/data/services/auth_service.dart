import 'package:neochat/data/models/auth.dart';
import 'package:neochat/data/models/common.dart';
import 'package:neochat/data/models/user.dart';
import 'package:neochat/data/services/api_service.dart';

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  Future<ApiResponse<AuthResponse>> login(LoginRequest request) async {
    final response = await _api.post('/auth/login', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<AuthResponse>> register(RegisterRequest request) async {
    final response = await _api.post('/auth/register', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<AuthResponse>> refreshToken(RefreshTokenRequest request) async {
    final response = await _api.post('/auth/refresh', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<User>> getCurrentUser() async {
    final response = await _api.get('/auth/me');
    return ApiResponse.fromJson(
      response.data,
      (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<User>> updateProfile(Map<String, dynamic> data) async {
    final response = await _api.put('/auth/profile', data: data);
    return ApiResponse.fromJson(
      response.data,
      (json) => User.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<ApiResponse<void>> changePassword(ChangePasswordRequest request) async {
    final response = await _api.post('/auth/change-password', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> forgotPassword(ForgotPasswordRequest request) async {
    final response = await _api.post('/auth/forgot-password', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> resetPassword(ResetPasswordRequest request) async {
    final response = await _api.post('/auth/reset-password', data: request.toJson());
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> logout() async {
    final response = await _api.post('/auth/logout');
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }

  Future<ApiResponse<void>> deleteAccount(String password) async {
    final response = await _api.post('/auth/delete-account', data: {'password': password});
    return ApiResponse.fromJson(
      response.data,
      (_) {},
    );
  }
}
