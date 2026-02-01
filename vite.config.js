// vite.config.js

import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Read package.json to get the version
const packageJson = JSON.parse(
  readFileSync('./package.json', { encoding: 'utf-8' }),
);

const appName = packageJson.name;
const appNameFormatted = appName
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
const appVersion = packageJson.version;

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteMinifyPlugin({})],
  define: {
    // Make the version available as an environment variable
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),

    'import.meta.env.VITE_APP_NAME': JSON.stringify(appName),

    // Make the app name available as an environment variable
    'import.meta.env.VITE_APP_NAME_FORMATTED': JSON.stringify(appNameFormatted),

    // Ko-fi url for donations
    'import.meta.env.VITE_KOFI_URL': JSON.stringify(
      process.env.VITE_KOFI_URL ||
        `https://ko-fi.com/prabapro/tip?utm_campaign=${appName}&utm_source=website&utm_medium=`,
    ),
  },
  // Resolve config
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@ui': resolve(__dirname, './src/components/ui'),
      '@assets': resolve(__dirname, './src/assets'),
      '@styles': resolve(__dirname, './src/styles'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@context': resolve(__dirname, './src/context'),
      '@pages': resolve(__dirname, './src/pages'),
      '@routes': resolve(__dirname, './src/routes'),
      '@stores': resolve(__dirname, './src/stores'),
      '@services': resolve(__dirname, './src/services'),
      '@constants': resolve(__dirname, './src/constants'),
      '@data': resolve(__dirname, './src/data'),
      '@events': resolve(__dirname, './src/events'),
      '@lib': resolve(__dirname, './src/lib'),
      '@types': resolve(__dirname, './src/types'),
      '@config': resolve(__dirname, './src/config'),
    },
  },

  // Development server config
  server: {
    port: 3000,
    open: true,
  },

  // Build config
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Radix UI components
          'radix-ui': [
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-navigation-menu',
          ],

          // Utilities
          'utils-vendor': ['clsx', 'tailwind-merge'],

          // Icons
          icons: ['lucide-react'],

          // Zustand (state management)
          state: ['zustand'],

          // Markdown processing
          markdown: ['react-markdown'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
