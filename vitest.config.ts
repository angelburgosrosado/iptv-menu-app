import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@iptv-menu/types': path.resolve(__dirname, './packages/types/src/index.ts'),
      '@iptv-menu/config': path.resolve(__dirname, './packages/config/src/index.ts'),
      '@iptv-menu/db': path.resolve(__dirname, './packages/db/src/index.ts'),
      '@iptv-menu/jobs': path.resolve(__dirname, './packages/jobs/src/index.ts'),
      'react-native': path.resolve(__dirname, './src/shims/react-native.tsx'),
      '@shopify/flash-list': path.resolve(__dirname, './src/shims/flash-list.tsx'),
      'expo-router': path.resolve(__dirname, './src/shims/expo-router.tsx'),
      'expo-video': path.resolve(__dirname, './src/shims/expo-video.tsx'),
      'expo-image': path.resolve(__dirname, './src/shims/expo-image.tsx'),
      'react-native-mmkv': path.resolve(__dirname, './src/shims/react-native-mmkv.ts'),
    }
  }
});
