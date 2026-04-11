// 认证相关 hooks

import { useCallback, useEffect } from 'react';
import { useAuthStore, AuthService, api } from '../index';
import type { LoginRequest, RegisterRequest, User } from '../types';

export function useAuth() {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    logout: storeLogout,
    setLoading,
    clearTokens,
  } = useAuthStore();

  // 登录
  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const auth = await AuthService.login(data);
        setAuth(auth);
        return auth;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading]
  );

  // 注册
  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const auth = await AuthService.register(data);
        setAuth(auth);
        return auth;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading]
  );

  // 登出
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storeLogout();
      clearTokens();
    }
  }, [storeLogout, clearTokens]);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const user = await AuthService.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [isAuthenticated, setUser]);

  // 更新用户资料
  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      try {
        const user = await AuthService.updateProfile(data);
        setUser(user);
        return user;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },
    [setUser]
  );

  // 初始化：从存储恢复认证状态
  useEffect(() => {
    // TODO: 实现从本地存储恢复 token 和 user
    setLoading(false);
  }, [setLoading]);

  // 设置 API 拦截器
  useEffect(() => {
    if (accessToken) {
      api.setTokens(accessToken, refreshToken || '');
    } else {
      api.clearTokens();
    }
  }, [accessToken, refreshToken]);

  // 设置 token 刷新回调
  useEffect(() => {
    api.setOnTokenRefresh(async () => {
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      const auth = await AuthService.refreshToken(refreshToken);
      setAuth(auth);
    });

    api.setOnUnauthorized(() => {
      storeLogout();
    });
  }, [refreshToken, setAuth, storeLogout]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
  };
}
