import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: [
    { find: 'three/addons', replacement: fileURLToPath(new URL('../prototype/node_modules/three/examples/jsm', import.meta.url)) },
    { find: /^three$/, replacement: fileURLToPath(new URL('../prototype/node_modules/three/build/three.module.js', import.meta.url)) },
  ] },
  server: { fs: { allow: ['..'] }, proxy: { '/api': 'http://127.0.0.1:8123', '/ai-assets': 'http://127.0.0.1:8123', '/ai-runtime': 'http://127.0.0.1:8123' } },
  build: { chunkSizeWarningLimit: 850 },
});
