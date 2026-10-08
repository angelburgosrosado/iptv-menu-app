/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { PALETTE, RADII, SHADOWS } from '../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FocusableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  scaleOnFocus?: boolean;
  glowOnFocus?: boolean;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: any;
  children: React.ReactNode | ((state: { focused: boolean; pressed: boolean }) => React.ReactNode);
}

export function Focusable({
  style,
  focusedStyle,
  scaleOnFocus = true,
  glowOnFocus = true,
  hasTVPreferredFocus = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  children,
  onFocus,
  onBlur,
  ...rest
}: FocusableProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (scaleOnFocus) {
      scale.value = withSpring(1.05, { damping: 14, stiffness: 180 });
    }
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (scaleOnFocus) {
      scale.value = withSpring(1.0, { damping: 14, stiffness: 180 });
    }
    onBlur?.(e);
  };

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      {...rest}
      onFocus={handleFocus}
      onBlur={handleBlur}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        selected: isFocused,
        disabled: Boolean(rest.disabled),
      }}
      style={[
        style,
        animStyle,
        isFocused && {
          borderColor: PALETTE.focusRing,
          borderWidth: 2,
          backgroundColor: PALETTE.focusBg,
          ...(glowOnFocus ? SHADOWS.focusGlow : {}),
        },
        isFocused && focusedStyle,
      ]}
    >
      {(state) =>
        typeof children === 'function'
          ? children({ focused: isFocused, pressed: state.pressed })
          : children
      }
    </AnimatedPressable>
  );
}
