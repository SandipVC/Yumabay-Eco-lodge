import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rm } from 'node:fs/promises';
import path from 'node:path';

// Vite copies the whole public/ dir into dist/. The local public/{images,video,
// pdf}/ folders hold 160+MB of source media that must NOT ship in the deploy —
// ALL content media (images, video, PDFs) is served by URL from the CMS
// (Firebase Storage) instead. Strip those dirs from dist after the build so they
// are never uploaded to hosting. Brand chrome kept in the bundle: favicon.svg and
// logo-yb.svg (the CMS-branding fallback) + font/.
function stripBundledMedia() {
  return {
    name: 'strip-bundled-media',
    apply: 'build',
    async closeBundle() {
      for (const dir of ['images', 'video', 'pdf']) {
        await rm(path.resolve('dist', dir), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), stripBundledMedia()],
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
