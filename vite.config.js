import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ORKA/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
