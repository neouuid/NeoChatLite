// 剪贴板工具
// 提供 Web 和 React Native 双平台的剪贴板功能

// 环境检测
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const isReactNative = !isWeb && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// 动态导入 React Native 剪贴板模块
let Clipboard: any = null;

const loadClipboardModule = async () => {
  if (isReactNative && !Clipboard) {
    try {
      Clipboard = require('@react-native-clipboard/clipboard');
    } catch (e) {
      console.warn('React Native Clipboard module not available:', e);
    }
  }
};

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Web 环境
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // React Native 环境
    await loadClipboardModule();
    if (Clipboard) {
      Clipboard.setString(text);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * 从剪贴板读取文本
 */
export const readFromClipboard = async (): Promise<string | null> => {
  try {
    // Web 环境
    if (isWeb && typeof navigator !== 'undefined' && navigator.clipboard) {
      return await navigator.clipboard.readText();
    }

    // React Native 环境
    await loadClipboardModule();
    if (Clipboard) {
      const text = await Clipboard.getString();
      return text;
    }

    return null;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
};
