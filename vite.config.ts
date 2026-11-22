import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const htmlPages = [
  'index.html',
  'kalkulator-tco.html',
  'analisis-risiko.html',
  'komparasi-kendaraan.html',
  'hasil-komparasi.html',
  'masalah-kendaraan.html',
  'bengkel-inspektor.html',
  'berita-otomotif.html',
  'detail-berita.html',
  'admin.html',
];

const inputEntries: Record<string, string> = {};
for (const page of htmlPages) {
  const fullPath = path.resolve(__dirname, page);
  if (fs.existsSync(fullPath)) {
    inputEntries[page.replace(/\.html$/, '')] = fullPath;
  }
}

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        input: inputEntries,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
