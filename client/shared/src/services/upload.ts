// 文件上传服务

import { api } from './api';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export class UploadService {
  /**
   * 上传图片
   */
  static async uploadImage(uri: string, filename?: string): Promise<UploadResult> {
    const formData = new FormData();

    // @ts-ignore - React Native 的 FormData 类型定义不完整
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: filename || `image_${Date.now()}.jpg`,
    });

    const response = await api.upload<UploadResult>('/upload', formData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Upload failed');
  }

  /**
   * 上传文件
   */
  static async uploadFile(uri: string, filename: string, mimeType: string): Promise<UploadResult> {
    const formData = new FormData();

    // @ts-ignore - React Native 的 FormData 类型定义不完整
    formData.append('file', {
      uri,
      type: mimeType,
      name: filename,
    });

    const response = await api.upload<UploadResult>('/upload', formData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Upload failed');
  }
}

export default UploadService;
