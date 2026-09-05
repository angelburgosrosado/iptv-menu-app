import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@iptv-menu/types': path.resolve(__dirname, './packages/types/src/index.ts'),
        'react-native': path.resolve(__dirname, './src/shims/react-native.tsx'),
        '@shopify/flash-list': path.resolve(__dirname, './src/shims/flash-list.tsx'),
        'expo-router': path.resolve(__dirname, './src/shims/expo-router.tsx'),
        'expo-video': path.resolve(__dirname, './src/shims/expo-video.tsx'),
        'expo-image': path.resolve(__dirname, './src/shims/expo-image.tsx'),
        'react-native-mmkv': path.resolve(__dirname, './src/shims/react-native-mmkv.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
