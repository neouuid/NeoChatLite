// 媒体上传相关 hooks

import { useState, useCallback } from 'react';
import { UploadService, UploadResult } from '../services';

interface UseMediaUploadOptions {
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  // 上传图片
  const uploadImage = useCallback(
    async (uri: string, filename?: string): Promise<UploadResult | null> => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      options.onUploadStart?.();

      try {
        const result = await UploadService.uploadImage(uri, filename);
        setUploadProgress(100);
        options.onUploadComplete?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        setUploadError(err);
        options.onUploadError?.(err);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  // 上传文件
  const uploadFile = useCallback(
    async (uri: string, filename: string, mimeType: string): Promise<UploadResult | null> => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      options.onUploadStart?.();

      try {
        const result = await UploadService.uploadFile(uri, filename, mimeType);
        setUploadProgress(100);
        options.onUploadComplete?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        setUploadError(err);
        options.onUploadError?.(err);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  // 重置状态
  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadError,
    uploadImage,
    uploadFile,
    resetUpload,
  };
}
