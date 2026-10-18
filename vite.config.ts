import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.ELECTRON === 'true' ? './' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@iptv-menu/types': path.resolve(__dirname, './packages/types/src/index.ts'),
        'react-native': path.resolve(__dirname, './src/shims/react-native.tsx'),
        '@shopify/flash-list': path.resolve(__dirname, './src/shims/flash-list.tsx'),
        'expo-router': path.resolve(__dirname, './src/shims/expo-router.tsx'),
        'expo-video': path.resolve(__dirname, './src/shims/expo-video.tsx'),
        'expo-image': path.resolve(__dirname, './src/shims/expo-image.tsx'),
        'react-native-mmkv': path.resolve(__dirname, './src/shims/react-native-mmkv.ts'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('src/data/') || id.includes('data/iptv-org')) {
              return 'iptv-datasets';
            }
            if (id.includes('src/components/admin') || id.includes('DesktopApkBuilder')) {
              return 'admin-builder-suite';
            }
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'ui-icons';
              }
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler')) {
                return 'react-vendor';
              }
              if (id.includes('hls.js')) {
                return 'video-player';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('@supabase') || id.includes('@google/genai')) {
                return 'cloud-sdks';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'motion-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
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
