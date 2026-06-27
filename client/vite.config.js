import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,  // honor PORT env (preview-tool autoPort); fall back to 5173
    host: '0.0.0.0',   // expose to LAN — accessible at http://<your-ip>:5173
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap'))
            return 'vendor-gsap';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion'))
            return 'vendor-motion';
        },
      },
    },
  },
});
