// Content script entry point.
// Privacy: this script never sends user text to any server. It only reads the
// active editable selection on user gesture, builds a prompt locally, and uses
// the clipboard API after an explicit button click.

import { loadSettings, onSettingsChanged } from '@/shared/storage';
import type { ExtensionSettings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/settings';
import { getEditableSelectionInfo } from './selection';
import { mountFloatingUi, type FloatingUiHandle } from './floating-ui';
import { isSiteEnabled } from './siteCheck';
import { injectAndSend } from './chatInjector';

// One-time guard prevents double-injection on extension reload.
const INIT_FLAG = '__pr_loaded_v1__';
const w = window as unknown as Record<string, boolean>;
if (!w[INIT_FLAG]) {
  w[INIT_FLAG] = true;
  init();
}

function init(): void {
  // Listen for prompts forwarded from the background to inject into this
  // page's chat composer (this is what makes auto paste-and-send work).
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (
      message &&
      typeof message === 'object' &&
      message.type === 'INJECT_PROMPT' &&
      typeof message.prompt === 'string'
    ) {
      void injectAndSend(message.prompt).then((res) => sendResponse(res));
      return true; // keep channel open for async response
    }
    return false;
  });

  let ui: FloatingUiHandle | null = null;
  let settings: ExtensionSettings = DEFAULT_SETTINGS;
  let evaluateTimer: ReturnType<typeof setTimeout> | null = null;
  let lastUrl = location.href;

  // Load settings once; re-evaluate when they change.
  void loadSettings().then((s) => {
    settings = s;
    if (isSiteEnabled(settings)) ensureUi();
    else teardownUi();
  });

  onSettingsChanged((s) => {
    settings = s;
    if (isSiteEnabled(settings)) {
      ensureUi();
    } else {
      teardownUi();
    }
  });

  function ensureUi(): void {
    if (!ui) {
      ui = mountFloatingUi();
    }
  }

  function teardownUi(): void {
    ui?.destroy();
    ui = null;
  }

  function scheduleEvaluate(delay = 60): void {
    if (evaluateTimer !== null) clearTimeout(evaluateTimer);
    evaluateTimer = setTimeout(() => {
      evaluateTimer = null;
      evaluate();
    }, delay);
  }

  function evaluate(): void {
    if (!ui || !isSiteEnabled(settings)) return;
    const info = getEditableSelectionInfo();
    ui.setSelectionInfo(info);
  }

  // SPA navigation detection - re-evaluate when the URL changes without a page reload.
  function checkNavigation(): void {
    const current = location.href;
    if (current !== lastUrl) {
      lastUrl = current;
      ui?.closePanel();
      scheduleEvaluate();
    }
  }

  // --- Event listeners ---

  document.addEventListener('selectionchange', () => scheduleEvaluate());

  document.addEventListener('mouseup', () => scheduleEvaluate());

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      ui?.closePanel();
      return;
    }
    scheduleEvaluate();
  });

  // On blur, wait briefly so clicks inside the shadow panel register first.
  document.addEventListener('focusout', () => scheduleEvaluate(180));

  // Detect SPA navigation via popstate and a polling fallback for frameworks
  // that push history without firing popstate (e.g. Next.js).
  window.addEventListener('popstate', () => {
    lastUrl = location.href;
    ui?.closePanel();
    scheduleEvaluate();
  });

  // Poll every 1.5 s for URL changes that don't trigger popstate.
  setInterval(checkNavigation, 1500);
}

export {};
