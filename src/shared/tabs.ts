// Tab-reuse logic for the AI-chat tab.
// Lives in shared/ so it can be unit-tested without a background context.
// Called exclusively from the background service worker.

export interface OpenOrFocusResult {
  ok: boolean;
  tabId?: number;
  reason?: string;
}

// Open the user's configured AI chat URL in a reusable tab.
//
// Priority order:
// 1. lastAiTabRef.value - the tab we opened last time, if it still exists.
//    We reuse it even if the user navigated within the site (e.g. started a
//    new conversation), so we never create duplicates.
// 2. Exact URL search - any open tab whose URL matches exactly.
// 3. Create a new tab.
//
// lastAiTabRef is mutated to track the most-recently used tab ID.
export async function openOrFocusAiTab(
  url: string,
  lastAiTabRef: { value?: number },
  activate = true,
): Promise<OpenOrFocusResult> {
  if (!url) return { ok: false, reason: 'no-url' };

  // Try the previously remembered tab first.
  if (typeof lastAiTabRef.value === 'number') {
    try {
      const tab = await chrome.tabs.get(lastAiTabRef.value);
      if (tab?.id != null) {
        if (activate) await focusTab(tab);
        return { ok: true, tabId: tab.id };
      }
    } catch {
      // Tab was closed - clear the cached ID and fall through.
      lastAiTabRef.value = undefined;
    }
  }

  // Search for an existing tab with the exact configured URL.
  const existing = await chrome.tabs.query({ url });
  const match = existing.find((t) => t.url === url) ?? existing[0];
  if (match?.id != null) {
    if (activate) await focusTab(match);
    lastAiTabRef.value = match.id;
    return { ok: true, tabId: match.id };
  }

  // Nothing found - open a new tab. When activate is false the tab opens in
  // the background so the user stays on the source page.
  const created = await chrome.tabs.create({ url, active: activate });
  if (created.id != null) lastAiTabRef.value = created.id;
  return { ok: true, tabId: created.id };
}

async function focusTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id != null) {
    await chrome.tabs.update(tab.id, { active: true });
  }
  if (tab.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}
