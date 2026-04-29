import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

// Manifest V3 declaration. Permissions are kept minimal:
// - storage: persist user settings (About Me, Global Prompt, etc.)
// - tabs: required to find/focus an existing AI chat tab and avoid duplicates
// - clipboardRead: needed by Apply Result (only invoked after explicit click)
// - clipboardWrite: needed by Copy Prompt (only invoked after explicit click)
// host permissions are NOT requested. Content script uses <all_urls> via
// "matches" only; the script reads/writes the active editable element under
// activeTab, never network requests, never remote code.
export default defineManifest({
  manifest_version: 3,
  name: 'Re-Phraser',
  version: pkg.version,
  description:
    'Rewrite selected text in any editable field using your AI chat - no API key, no scraping, no automation.',
  icons: {
    '16': 'src/assets/icons/icon16.png',
    '32': 'src/assets/icons/icon32.png',
    '48': 'src/assets/icons/icon48.png',
    '128': 'src/assets/icons/icon128.png',
  },
  action: {
    default_title: 'Re-Phraser - open settings',
    default_icon: {
      '16': 'src/assets/icons/icon16.png',
      '32': 'src/assets/icons/icon32.png',
      '48': 'src/assets/icons/icon48.png',
      '128': 'src/assets/icons/icon128.png',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabs', 'activeTab', 'clipboardWrite', 'clipboardRead'],
  content_scripts: [
    {
      // <all_urls> is required because the user may rephrase text in editable
      // fields on any site (Gmail, LinkedIn, WhatsApp Web, etc.). The content
      // script only reads the user's selection inside their editable target
      // and never sends data anywhere.
      matches: ['<all_urls>'],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        'src/options/index.html',
        'src/assets/icons/icon16.png',
        'src/assets/icons/icon32.png',
        'src/assets/icons/icon48.png',
        'src/assets/icons/icon128.png',
      ],
      matches: ['<all_urls>'],
    },
  ],
});
