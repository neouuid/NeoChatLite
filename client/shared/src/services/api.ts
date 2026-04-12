import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:8080/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh?: () => Promise<void>;
  private onUnauthorized?: () => void;

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.onTokenRefresh && this.refreshToken) {
            try {
              await this.onTokenRefresh();
              return this.client(originalRequest);
            } catch (refreshError) {
              this.onUnauthorized?.();
              return Promise.reject(refreshError);
            }
          }

          this.onUnauthorized?.();
        }

        return Promise.reject(error);
      }
    );
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setOnTokenRefresh(callback: () => Promise<void>) {
    this.onTokenRefresh = callback;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    // Handle both wrapped and unwrapped responses
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    // Backend returns unwrapped data directly for some endpoints
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  }

  // File upload
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
