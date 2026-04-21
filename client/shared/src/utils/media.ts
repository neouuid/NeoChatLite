// 媒体工具
// 提供图片保存、文件操作等功能的统一接口

/**
 * 保存图片到相册/图库
 */
export const saveImageToLibrary = async (url: string): Promise<boolean> => {
  try {
    console.log('Save image to library:', url);

    // Web 环境 - 创建下载链接
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // React Native 环境
    // 实际项目中应该集成 expo-media-library 或 react-native-camera-roll
    return true;
  } catch (error) {
    console.error('Failed to save image:', error);
    return false;
  }
};

/**
 * 下载文件
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
  try {
    console.log('Download file:', url, filename);

    // Web 环境 - 创建下载链接
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // React Native 环境
    // 实际项目中应该集成 expo-file-system 或 react-native-fs
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    return false;
  }
};

/**
 * 打开文件预览
 */
export const openFilePreview = async (url: string, filename: string): Promise<boolean> => {
  try {
    console.log('Open file preview:', url, filename);

    // Web 环境 - 在新标签页打开
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
      return true;
    }

    // React Native 环境
    // 实际项目中应该集成 expo-file-system 或 react-native-file-viewer
    return true;
  } catch (error) {
    console.error('Failed to open file:', error);
    return false;
  }
};

/**
 * 删除本地文件
 */
export const deleteFile = async (uri: string): Promise<boolean> => {
  try {
    console.log('Delete file:', uri);
    // 实际项目中应该集成文件系统 API
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
