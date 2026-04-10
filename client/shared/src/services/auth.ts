import { api } from './api';
import { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../types';

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.success && response.data) {
      api.setTokens(response.data.access_token, response.data.refresh_token);
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.success && response.data) {
      api.setTokens(response.data.access_token, response.data.refresh_token);
      return response.data;
    }
    throw new Error(response.message || 'Registration failed');
  }

  static async logout(): Promise<void> {
    await api.post('/auth/logout');
    api.clearTokens();
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
    if (response.success && response.data) {
      api.setTokens(response.data.access_token, response.data.refresh_token);
      return response.data;
    }
    throw new Error(response.message || 'Token refresh failed');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get user');
  }

  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update profile');
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const response = await api.post('/auth/forgot-password', { email });
    if (!response.success) {
      throw new Error(response.message || 'Failed to request password reset');
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  static async verifyEmail(code: string): Promise<void> {
    const response = await api.post('/auth/verify-email', { code });
    if (!response.success) {
      throw new Error(response.message || 'Failed to verify email');
    }
  }
}

export default AuthService;
