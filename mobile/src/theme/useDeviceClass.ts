/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

export type DeviceClass = 'phone' | 'tablet' | 'tv';

export interface DeviceInfo {
  deviceClass: DeviceClass;
  isTV: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  columns: number;
}

export function useDeviceClass(): DeviceInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove?.();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const shortestDim = Math.min(width, height);

  const isTV = Boolean((Platform as any).isTV || Platform.OS === 'android' && width >= 960 && (dimensions as any).fontScale === 1 && isLandscape && shortestDim >= 540);
  const isTablet = !isTV && (shortestDim >= 600 || width >= 800);
  const isPhone = !isTV && !isTablet;

  const deviceClass: DeviceClass = isTV ? 'tv' : isTablet ? 'tablet' : 'phone';

  // Compute adaptive column count for channel cards
  let columns = 1;
  if (isTV) {
    columns = 4;
  } else if (isTablet) {
    columns = isLandscape ? 3 : 2;
  } else {
    columns = isLandscape ? 2 : 1;
  }

  return {
    deviceClass,
    isTV,
    isTablet,
    isPhone,
    isLandscape,
    columns,
  };
}
