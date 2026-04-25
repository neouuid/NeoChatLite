// Avatar 组件

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../constants';
import { getAvatarText, formatDisplayName } from '../utils';
import { CachedImage } from './CachedImage';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'xxl' | number;

interface AvatarProps {
  uri?: string;
  nickname?: string;
  username?: string;
  size?: AvatarSize;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// 用户头像颜色
const AVATAR_COLORS = [
  COLORS.primary,
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
];

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  nickname,
  username,
  size = 'md',
  color,
  style,
  textStyle,
}) => {
  // Memoized 尺寸
  const avatarSize = useMemo((): number => {
    if (typeof size === 'number') {
      return size;
    }
    switch (size) {
      case 'xs':
        return 32;
      case 'sm':
        return 40;
      case 'lg':
        return 64;
      case 'xl':
        return 80;
      case '2xl':
        return 100;
      case 'xxl':
        return 120;
      default:
        return 48;
    }
  }, [size]);

  // Memoized 字体大小
  const fontSize = useMemo((): number => {
    if (typeof size === 'number') {
      // 根据尺寸计算合适的字体大小
      return Math.round(size * 0.4);
    }
    switch (size) {
      case 'xs':
        return 14;
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      case 'xl':
        return 32;
      case '2xl':
        return 36;
      case 'xxl':
        return 42;
      default:
        return 20;
    }
  }, [size]);

  // Memoized 颜色
  const avatarColor = useMemo((): string => {
    if (color) return color;
    const name = formatDisplayName(nickname, username);
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }, [color, nickname, username]);

  const avatarText = useMemo(() => getAvatarText(nickname, username), [nickname, username]);

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: avatarColor,
        },
        style,
      ]}
    >
      {uri ? (
        <CachedImage
          uri={uri}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: BORDER_RADIUS.full,
            },
          ]}
        />
      ) : avatarText ? (
        <Text
          style={[
            styles.text,
            {
              fontSize: fontSize,
              color: '#ffffff',
            },
            textStyle,
          ]}
        >
          {avatarText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  text: {
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
