// 跨平台缓存图片组件

import React from 'react';
import { Image, ImageProps, Platform } from 'react-native';

// 注意：react-native-fast-image 只在 mobile 端使用
// desktop 端使用标准 Image 组件

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string;
  source?: ImageProps['source'];
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  source,
  ...props
}) => {
  // 确定图片源
  const imageSource = uri ? { uri } : source;

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Mobile 端：尝试使用 FastImage（需要在 mobile 项目中导入）
    // 这里使用标准 Image 作为 fallback，实际使用时可以在 mobile 层覆盖
    return <Image source={imageSource} {...props} />;
  }

  // Desktop/Web 端：使用标准 Image
  return <Image source={imageSource} {...props} />;
};
