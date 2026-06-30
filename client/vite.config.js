import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rm } from 'node:fs/promises';
import path from 'node:path';

// Vite copies the whole public/ dir into dist/. The local public/video/ holds
// 100+MB of source media that must NOT ship in the deploy — the hero scrub video
// is served from the CMS (Firebase Storage) instead. Strip dist/video after the
// build so it's never uploaded to hosting.
function stripBundledVideo() {
  return {
    name: 'strip-bundled-video',
    apply: 'build',
    async closeBundle() {
      await rm(path.resolve('dist/video'), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), stripBundledVideo()],
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
