// Input 组件

import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

type InputVariant = 'default' | 'outlined' | 'filled';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'filled',
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  secureTextEntry = false,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: error ? COLORS.error : COLORS.dark.border,
      backgroundColor: variant === 'filled' ? COLORS.dark.surface : 'transparent',
    };

    switch (size) {
      case 'sm':
        baseStyle.height = 40;
        baseStyle.paddingHorizontal = SPACING.sm;
        break;
      case 'lg':
        baseStyle.height = 56;
        baseStyle.paddingHorizontal = SPACING.lg;
        break;
      default:
        baseStyle.height = 48;
        baseStyle.paddingHorizontal = SPACING.md;
    }

    return [baseStyle];
  };

  const getInputStyle = (): TextStyle[] => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: '#ffffff',
      fontSize: size === 'sm' ? TYPOGRAPHY.sizes.sm : TYPOGRAPHY.sizes.md,
    };

    if (leftIcon) {
      baseStyle.marginLeft = SPACING.sm;
    }

    if (rightIcon) {
      baseStyle.marginRight = SPACING.sm;
    }

    return [baseStyle, inputStyle];
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      <View style={getContainerStyle()}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

        <TextInput
          style={getInputStyle()}
          placeholderTextColor={COLORS.dark.text.secondary}
          secureTextEntry={secureTextEntry}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.icon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs,
  },
  label: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
