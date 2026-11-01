import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build` -> dist/ (Cloudflare). `vite build --mode single` -> dist-single/index.html (một file, chơi với máy).
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2500,
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', ws: true },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
