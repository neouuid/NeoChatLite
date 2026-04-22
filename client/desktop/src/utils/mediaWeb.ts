// Web 端媒体工具
import { Platform } from 'react-native';

export interface MediaItemWeb {
  uri: string;
  type: 'image' | 'file';
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  file?: File; // Web 端的 File 对象
}

// 从相册选择图片（Web 端）
export async function pickImageFromGalleryWeb(): Promise<MediaItemWeb | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve({
            uri: result,
            type: 'image',
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            file,
          });
        };

        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

// 拍照（Web 端）
export async function takePhotoWeb(): Promise<MediaItemWeb | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve({
            uri: result,
            type: 'image',
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            file,
          });
        };

        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

// 选择文件（Web 端）
export async function pickFileWeb(): Promise<MediaItemWeb | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve({
            uri: result,
            type: 'file',
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            file,
          });
        };

        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

// Web 端上传文件
export async function uploadFileWeb(
  url: string,
  file: File,
  token?: string
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });
}
