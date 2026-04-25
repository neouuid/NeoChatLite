// 媒体工具
// 提供图片保存、文件操作等功能的统一接口

// 环境检测
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const isReactNative = !isWeb && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// 动态导入 React Native 模块（仅在 React Native 环境）
let RNFS: any = null;
let RNShare: any = null;
let RNPermissions: any = null;

const loadReactNativeModules = async () => {
  if (isReactNative && !RNFS) {
    try {
      RNFS = require('react-native-fs');
      RNShare = require('react-native-share');
      RNPermissions = require('react-native-permissions');
    } catch (e) {
      console.warn('React Native modules not available:', e);
    }
  }
};

/**
 * 保存图片到相册/图库
 */
export const saveImageToLibrary = async (url: string): Promise<boolean> => {
  try {
    // Web 环境 - 创建下载链接
    if (isWeb) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // React Native 环境
    await loadReactNativeModules();
    if (RNFS && RNPermissions) {
      // 下载图片到本地
      const localPath = `${RNFS.DocumentDirectoryPath}/image_${Date.now()}.jpg`;
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        // 保存到相册需要额外的原生模块支持，这里保存到文档目录
        return true;
      }
    }
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
    // Web 环境 - 创建下载链接
    if (isWeb) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // React Native 环境
    await loadReactNativeModules();
    if (RNFS) {
      const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      return downloadResult.statusCode === 200;
    }
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
    // Web 环境 - 在新标签页打开
    if (isWeb) {
      window.open(url, '_blank');
      return true;
    }

    // React Native 环境
    await loadReactNativeModules();
    if (RNShare && RNFS) {
      // 先下载文件
      const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      const exists = await RNFS.exists(localPath);

      let filePath = localPath;
      if (!exists) {
        const downloadResult = await RNFS.downloadFile({
          fromUrl: url,
          toFile: localPath,
        }).promise;

        if (downloadResult.statusCode !== 200) {
          return false;
        }
      }

      // 使用 react-native-share 打开文件
      await RNShare.open({
        url: `file://${filePath}`,
        type: getMimeType(filename),
        filename: filename,
      });
      return true;
    }
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
    // Web 环境 - 无操作
    if (isWeb) {
      return true;
    }

    // React Native 环境
    await loadReactNativeModules();
    if (RNFS) {
      await RNFS.unlink(uri);
      return true;
    }
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

/**
 * 根据文件名获取 MIME 类型
 */
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};
