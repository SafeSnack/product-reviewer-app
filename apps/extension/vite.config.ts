import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.js';

const extensionRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, extensionRoot, '');
  return {
    plugins: [react(), crx({ manifest })],
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN ?? ''),
      'import.meta.env.VITE_SENTRY_ENV': JSON.stringify(env.VITE_SENTRY_ENV ?? ''),
      'import.meta.env.VITE_SENTRY_THROW_ON_START': JSON.stringify(
        env.VITE_SENTRY_THROW_ON_START ?? '',
      ),
    },
    build: {
      rollupOptions: {
        preserveEntrySignatures: 'exports-only',
      },
    },
  };
});
