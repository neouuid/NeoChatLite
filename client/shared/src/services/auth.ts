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

  static async requestPasswordReset(email: string): Promise<string> {
    const response = await api.post<{ token: string }>('/auth/forgot-password', { email });
    if (!response.success) {
      throw new Error(response.message || 'Failed to request password reset');
    }
    return response.data?.token || '';
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

  static async updatePhone(phone: string, code: string): Promise<void> {
    const response = await api.post('/auth/update-phone', { phone, code });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update phone');
    }
  }

  static async updateEmail(email: string, code: string): Promise<void> {
    const response = await api.post('/auth/update-email', { email, code });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update email');
    }
  }

  static async sendPhoneVerification(phone: string): Promise<string> {
    const response = await api.post<{ token: string }>('/auth/send-phone-verification', { phone });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send verification code');
    }
    return response.data?.token || '';
  }

  static async sendEmailVerification(): Promise<string> {
    const response = await api.post<{ code: string }>('/auth/send-verification-email');
    if (!response.success) {
      throw new Error(response.message || 'Failed to send verification email');
    }
    return response.data?.code || '';
  }

  static async deleteAccount(password: string): Promise<void> {
    const response = await api.post('/auth/delete-account', { password });
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete account');
    }
    api.clearTokens();
  }

  static async getLoginHistory(page: number = 1, pageSize: number = 20): Promise<any> {
    const response = await api.get(`/auth/login-history?page=${page}&page_size=${pageSize}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to get login history');
    }
    return response.data;
  }

  static async getDevices(): Promise<any> {
    const response = await api.get('/auth/devices');
    if (!response.success) {
      throw new Error(response.message || 'Failed to get devices');
    }
    return response.data;
  }
}

export default AuthService;
