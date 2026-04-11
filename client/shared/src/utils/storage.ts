// 存储工具函数 (封装)

// 这里定义存储接口，具体实现由各平台提供
export interface Storage {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// 默认使用 localStorage (Web) 或 AsyncStorage (RN)
// 实际项目中会使用 react-native-mmkv
let storageImpl: Storage | null = null;

export function setStorage(storage: Storage) {
  storageImpl = storage;
}

export function getStorage(): Storage {
  if (!storageImpl) {
    throw new Error('Storage not initialized. Call setStorage() first.');
  }
  return storageImpl;
}

// 便捷方法
export async function storageSet(key: string, value: string): Promise<void> {
  return getStorage().setItem(key, value);
}

export async function storageGet(key: string): Promise<string | null> {
  return getStorage().getItem(key);
}

export async function storageRemove(key: string): Promise<void> {
  return getStorage().removeItem(key);
}

export async function storageClear(): Promise<void> {
  return getStorage().clear();
}

// JSON 存储
export async function storageSetJSON<T>(key: string, value: T): Promise<void> {
  return storageSet(key, JSON.stringify(value));
}

export async function storageGetJSON<T>(key: string): Promise<T | null> {
  const value = await storageGet(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
