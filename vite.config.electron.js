import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'electron/main.ts'),
      external: [
        'electron',
        'better-sqlite3',
        'axios',
        'path',
        'url',
        'fs',
        'fs/promises',
        'node:path',
        'node:url',
        'node:fs',
        'node:fs/promises',
      ],
      output: {
        entryFileNames: 'main.cjs',
        format: 'cjs',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
