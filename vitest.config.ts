import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@iptv-menu/types': path.resolve(__dirname, './packages/types/src/index.ts'),
    }
  }
});
