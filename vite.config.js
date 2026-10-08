import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // pdfjs-dist v4 ships modern syntax (top-level await, private fields)
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
  server: { port: 5173 },
});
