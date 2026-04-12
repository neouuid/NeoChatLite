// 认证相关 hooks

import { useCallback, useEffect } from 'react';
import { useAuthStore, AuthService, api } from '../index';
import { storageSetJSON, storageGetJSON, storageRemove } from '../utils/storage';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../types';

const STORAGE_KEYS = {
  AUTH: 'neochat_auth',
};

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: User;
}

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

  // 保存认证状态到本地存储
  const saveAuthToStorage = useCallback(async (auth: AuthResponse) => {
    try {
      const stored: StoredAuth = {
        accessToken: auth.access_token,
        refreshToken: auth.refresh_token,
        user: auth.user,
      };
      await storageSetJSON(STORAGE_KEYS.AUTH, stored);
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }, []);

  // 清除本地存储的认证状态
  const clearAuthFromStorage = useCallback(async () => {
    try {
      await storageRemove(STORAGE_KEYS.AUTH);
    } catch (error) {
      console.error('Failed to clear auth from storage:', error);
    }
  }, []);

  // 登录
  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const auth = await AuthService.login(data);
        setAuth(auth);
        await saveAuthToStorage(auth);
        return auth;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, saveAuthToStorage]
  );

  // 注册
  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const auth = await AuthService.register(data);
        setAuth(auth);
        await saveAuthToStorage(auth);
        return auth;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, saveAuthToStorage]
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
      await clearAuthFromStorage();
    }
  }, [storeLogout, clearTokens, clearAuthFromStorage]);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const user = await AuthService.getCurrentUser();
      setUser(user);
      // 更新存储中的用户信息
      if (accessToken && refreshToken) {
        await saveAuthToStorage({
          access_token: accessToken,
          refresh_token: refreshToken,
          user,
        });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [isAuthenticated, setUser, accessToken, refreshToken, saveAuthToStorage]);

  // 更新用户资料
  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      try {
        const user = await AuthService.updateProfile(data);
        setUser(user);
        // 更新存储中的用户信息
        if (accessToken && refreshToken) {
          await saveAuthToStorage({
            access_token: accessToken,
            refresh_token: refreshToken,
            user,
          });
        }
        return user;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },
    [setUser, accessToken, refreshToken, saveAuthToStorage]
  );

  // 初始化：从存储恢复认证状态
  useEffect(() => {
    const loadAuthFromStorage = async () => {
      try {
        const stored = await storageGetJSON<StoredAuth>(STORAGE_KEYS.AUTH);
        if (stored) {
          setAuth({
            access_token: stored.accessToken,
            refresh_token: stored.refreshToken,
            user: stored.user,
          });
        }
      } catch (error) {
        console.error('Failed to load auth from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthFromStorage();
  }, [setAuth, setLoading]);

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
      await saveAuthToStorage(auth);
    });

    api.setOnUnauthorized(() => {
      storeLogout();
      clearAuthFromStorage();
    });
  }, [refreshToken, setAuth, storeLogout, saveAuthToStorage, clearAuthFromStorage]);

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
