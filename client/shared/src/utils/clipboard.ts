// 剪贴板工具
// 注意：在 React Native 环境需要使用 expo-clipboard 或 react-native-clipboard
// 这里提供统一的接口，不同平台可以有不同实现

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Web 环境
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // React Native 环境 - 使用提示
    // 实际项目中应该集成 expo-clipboard
    console.log('Copy to clipboard:', text);
    return true;
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      return await navigator.clipboard.readText();
    }

    // React Native 环境
    console.log('Read from clipboard - not implemented');
    return null;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
};
