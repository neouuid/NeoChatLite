// 类型声明文件 - 声明 React Native 专用的可选依赖模块
// 这些模块只在 mobile 项目中存在，shared 包将它们作为可选 peerDependencies

declare module 'react-native-image-picker' {
  export type MediaType = 'photo' | 'video' | 'mixed';

  export interface ImagePickerAsset {
    uri?: string;
    fileName?: string;
    type?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  }

  export interface ImagePickerResponse {
    didCancel: boolean;
    errorCode?: string;
    errorMessage?: string;
    assets?: ImagePickerAsset[];
  }

  export interface ImagePickerOptions {
    mediaType?: MediaType;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    selectionLimit?: number;
    saveToPhotos?: boolean;
  }

  export function launchImageLibrary(options?: ImagePickerOptions): Promise<ImagePickerResponse>;
  export function launchCamera(options?: ImagePickerOptions): Promise<ImagePickerResponse>;
}

declare module 'react-native-document-picker' {
  export interface DocumentPickerResponse {
    uri: string;
    name: string;
    type?: string;
    size?: number;
  }

  export const types: {
    allFiles: string;
    images: string;
    plainText: string;
    audio: string;
    video: string;
  };

  export interface DocumentPickerOptions {
    type?: string[];
    copyTo?: 'cachesDirectory' | 'documentDirectory';
  }

  export function pick(options?: DocumentPickerOptions): Promise<DocumentPickerResponse[]>;
  export function isCancel(err: any): boolean;
  export default {
    pick,
    isCancel,
    types,
  };
}
