// Button 组件

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../constants';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    // Size
    switch (size) {
      case 'sm':
        baseStyle.height = 36;
        baseStyle.paddingHorizontal = SPACING.md;
        break;
      case 'lg':
        baseStyle.height = 56;
        baseStyle.paddingHorizontal = SPACING.xl;
        break;
      default:
        baseStyle.height = 48;
        baseStyle.paddingHorizontal = SPACING.lg;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = COLORS.primary;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = COLORS.error;
        break;
      default:
        baseStyle.backgroundColor = COLORS.primary;
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return [baseStyle, style];
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle = {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.semibold,
    };

    switch (variant) {
      case 'secondary':
      case 'text':
        baseStyle.color = COLORS.primary;
        break;
      case 'danger':
      default:
        baseStyle.color = '#ffffff';
    }

    return [baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : COLORS.primary}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
