import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'SafeSnack',
  version: '0.1.0',
  description: 'Flags food allergens on Amazon Fresh and other grocery sites.',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: 'icons/icon-32.png',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.amazon.com/*'],
      js: ['src/content/amazon-fresh.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'activeTab', 'tabs', 'alarms'],
  host_permissions: ['https://world.openfoodfacts.org/*', 'https://api.nal.usda.gov/*'],
  web_accessible_resources: [
    {
      resources: ['src/onboarding/index.html', 'assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
