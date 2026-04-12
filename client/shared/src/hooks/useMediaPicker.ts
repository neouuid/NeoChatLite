// 媒体选择 hook - 封装图片和文件选择功能

import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import DocumentPicker, {
  DocumentPickerResponse,
  types as DocumentTypes,
} from 'react-native-document-picker';

export interface MediaItem {
  uri: string;
  type: 'image' | 'file';
  filename?: string;
  mimeType?: string;
  fileSize?: number;
}

interface UseMediaPickerOptions {
  onImageSelected?: (item: MediaItem) => void;
  onFileSelected?: (item: MediaItem) => void;
  onError?: (error: Error) => void;
}

export function useMediaPicker(options: UseMediaPickerOptions = {}) {
  // 处理图片选择结果
  const handleImageResponse = useCallback(
    (response: ImagePickerResponse): MediaItem | null => {
      if (response.didCancel) {
        return null;
      }
      if (response.errorCode) {
        const error = new Error(
          response.errorMessage || `Image picker error: ${response.errorCode}`
        );
        options.onError?.(error);
        return null;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        return {
          uri: asset.uri!,
          type: 'image',
          filename: asset.fileName,
          mimeType: asset.type,
          fileSize: asset.fileSize,
        };
      }
      return null;
    },
    [options]
  );

  // 从相册选择图片
  const pickImageFromGallery = useCallback(async (): Promise<MediaItem | null> => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });

      const item = handleImageResponse(result);
      if (item) {
        options.onImageSelected?.(item);
      }
      return item;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to pick image');
      options.onError?.(err);
      return null;
    }
  }, [handleImageResponse, options]);

  // 拍照
  const takePhoto = useCallback(async (): Promise<MediaItem | null> => {
    try {
      const result = await launchCamera({
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: true,
      });

      const item = handleImageResponse(result);
      if (item) {
        options.onImageSelected?.(item);
      }
      return item;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to take photo');
      options.onError?.(err);
      return null;
    }
  }, [handleImageResponse, options]);

  // 选择图片（显示选项对话框）
  const pickImage = useCallback(async (): Promise<MediaItem | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        '选择图片',
        '请选择图片来源',
        [
          {
            text: '拍照',
            onPress: async () => {
              const result = await takePhoto();
              resolve(result);
            },
          },
          {
            text: '从相册选择',
            onPress: async () => {
              const result = await pickImageFromGallery();
              resolve(result);
            },
          },
          {
            text: '取消',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }, [takePhoto, pickImageFromGallery]);

  // 选择文件
  const pickFile = useCallback(async (): Promise<MediaItem | null> => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentTypes.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0] as DocumentPickerResponse;
        const item: MediaItem = {
          uri: file.uri,
          type: 'file',
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        };
        options.onFileSelected?.(item);
        return item;
      }
      return null;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      const err = error instanceof Error ? error : new Error('Failed to pick file');
      options.onError?.(err);
      return null;
    }
  }, [options]);

  return {
    pickImage,
    pickImageFromGallery,
    takePhoto,
    pickFile,
  };
}
