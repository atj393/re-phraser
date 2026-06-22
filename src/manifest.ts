import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

// Manifest V3 declaration. Permissions are kept minimal - only what the
// extension actually uses:
// - storage: persist user settings (About Me, Global Prompt, AI chat URL, etc.)
// - tabs: find, open, and focus the user's configured AI chat tab (and avoid
//   opening duplicates) so the prompt can be sent there
// - clipboardWrite: copy the generated prompt to the clipboard as a manual
//   paste fallback when automatic send is unavailable
// No host_permissions are requested. The content script uses <all_urls> via
// "matches" only: it renders the in-page UI, reads the user's selection in the
// focused editable element, and - on the user's own signed-in AI chat tab -
// types the prompt and reads back the reply. The extension makes no network
// requests of its own, runs no remote code, and has no backend server.
export default defineManifest({
  manifest_version: 3,
  name: 'Re-Phraser',
  version: pkg.version,
  description:
    'Rewrite selected text using your own AI chat tab. Pick Quick, Normal, or Formal, then review and apply the reply. No API key.',
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
  permissions: ['storage', 'tabs', 'clipboardWrite'],
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
