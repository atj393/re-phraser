// Background service worker (Manifest V3).
// Handles typed messages from the content script and manages the single
// reusable AI-chat tab so the user never ends up with duplicate tabs.

import type { ExtensionMessage, ExtensionMessageResponse } from '@/shared/messages';
import { loadSettings } from '@/shared/storage';
import { openOrFocusAiTab } from '@/shared/tabs';

// Session-only state - intentionally not persisted.
// If the service worker restarts, lastAiTabId is lost and tab search falls
// back to URL matching, which is still correct behaviour.
const lastAiTabRef: { value?: number } = {};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void chrome.runtime.openOptionsPage();
  }
});

// Open the options page when the user clicks the extension action icon.
chrome.action?.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: ExtensionMessageResponse) => void,
  ): boolean => {
    switch (message.type) {
      case 'PING':
        sendResponse({ ok: true, data: 'pong' });
        return false;

      case 'OPEN_OPTIONS':
        void chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        return false;

      case 'OPEN_OR_FOCUS_AI_TAB':
        // Must return true to keep the message channel open while awaiting.
        void handleOpenAiTab(sendResponse);
        return true;

      case 'SEND_PROMPT_TO_AI':
        void handleSendPromptToAi(message.prompt, sendResponse);
        return true;

      case 'INJECT_PROMPT':
        // Background never receives this; it is sent from background to a
        // content script. Reject defensively in case something misroutes.
        sendResponse({ ok: false, error: 'INJECT_PROMPT not handled in background' });
        return false;

      default: {
        const exhaustive: never = message;
        sendResponse({
          ok: false,
          error: `unknown message: ${JSON.stringify(exhaustive)}`,
        });
        return false;
      }
    }
  },
);

async function handleOpenAiTab(
  respond: (r: ExtensionMessageResponse) => void,
): Promise<void> {
  try {
    const settings = await loadSettings();
    if (!settings.aiChatUrl.trim()) {
      respond({ ok: false, error: 'no-url' });
      return;
    }
    const result = await openOrFocusAiTab(settings.aiChatUrl.trim(), lastAiTabRef);
    if (result.ok) {
      respond({ ok: true, data: result.tabId });
    } else {
      respond({ ok: false, error: result.reason ?? 'tab-error' });
    }
  } catch (err) {
    respond({ ok: false, error: String(err) });
  }
}

async function handleSendPromptToAi(
  prompt: string,
  respond: (r: ExtensionMessageResponse) => void,
): Promise<void> {
  try {
    const settings = await loadSettings();
    if (!settings.aiChatUrl.trim()) {
      respond({ ok: false, error: 'no-url' });
      return;
    }
    // activate:false → don't pull focus away from the source page.
    const result = await openOrFocusAiTab(
      settings.aiChatUrl.trim(),
      lastAiTabRef,
      false,
    );
    if (!result.ok || result.tabId == null) {
      respond({ ok: false, error: result.reason ?? 'tab-error' });
      return;
    }
    const tabId = result.tabId;

    await waitForTabComplete(tabId, 8000);

    const injectRes = await sendInjectMessage(tabId, prompt);
    if (injectRes.ok) {
      // data carries the scraped assistant response so the source page can
      // surface it in the floating panel as a ready-to-apply rephrase.
      respond({ ok: true, data: injectRes.text ?? '' });
    } else {
      respond({ ok: false, error: injectRes.reason ?? 'inject-failed' });
    }
  } catch (err) {
    respond({ ok: false, error: String(err) });
  }
}

function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        resolve();
        return;
      }
      if (tab.status === 'complete') {
        resolve();
        return;
      }
      const listener = (id: number, info: chrome.tabs.TabChangeInfo): void => {
        if (id === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timer);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      const timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, timeoutMs);
    });
  });
}

interface InjectMessageResult {
  ok: boolean;
  reason?: string;
  text?: string;
}

async function sendInjectMessage(
  tabId: number,
  prompt: string,
): Promise<InjectMessageResult> {
  // Retry only on transport-level failures (content script still loading).
  // Logical failures (no-editor, no-send-button, no-response) bubble up directly.
  let lastErr = 'inject-failed';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = (await chrome.tabs.sendMessage(tabId, {
        type: 'INJECT_PROMPT',
        prompt,
      })) as InjectMessageResult | undefined;
      if (res?.ok) return { ok: true, text: res.text };
      if (res?.reason) return { ok: false, reason: res.reason };
    } catch (e) {
      lastErr = String(e);
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return { ok: false, reason: lastErr };
}
