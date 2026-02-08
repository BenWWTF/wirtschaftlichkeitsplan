import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'electron/main.js'),
      formats: ['cjs'],
      fileName: () => '[name].js',
    },
    outDir: 'dist-electron',
    minify: false,
    rollupOptions: {
      external: ['electron', 'better-sqlite3'],
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
});
