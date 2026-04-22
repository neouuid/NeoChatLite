// Mobile 端缓存图片组件 - 使用 react-native-fast-image

import React from 'react';
import { ImageProps, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';

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
  if (uri) {
    // 使用 FastImage 进行缓存
    return (
      <FastImage
        source={{
          uri: uri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        {...props as any}
      />
    );
  }

  // 对于本地资源，使用标准 Image
  if (source) {
    return <FastImage source={source as any} {...props as any} />;
  }

  return null;
};
