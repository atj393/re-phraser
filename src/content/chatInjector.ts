// Inject a prompt into a chat composer (ChatGPT, Claude, Gemini, generic
// contenteditable / textarea), click send, then wait for the assistant
// response to finish streaming and return its text.
// Runs in the AI-chat tab when the background forwards an INJECT_PROMPT.

const SEND_BUTTON_SELECTORS = [
  '#composer-submit-button',
  'button[data-testid="send-button"]',
  'button[aria-label="Send prompt"]',
  'button[aria-label="Send message"]',
  'button[aria-label*="Send"]',
];

const EDITOR_SELECTORS = [
  '#prompt-textarea',
  'div[contenteditable="true"][role="textbox"]',
  'div.ProseMirror[contenteditable="true"]',
  'textarea[name="prompt-textarea"]',
  'textarea[placeholder]',
  'textarea',
];

const ASSISTANT_TURN_SELECTORS = [
  // ChatGPT
  'div[data-message-author-role="assistant"]',
  // Claude
  'div[data-testid^="assistant-message"]',
  // Generic markdown bubble (fallback - only used if specific selectors miss)
  '.markdown.prose',
];

const RESPONSE_TIMEOUT_MS = 120000; // hard cap: 2 minutes
const RESPONSE_STABILITY_MS = 1500; // text unchanged for this long → done

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function isVisible(el: Element): boolean {
  const r = (el as HTMLElement).getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

async function findElement(
  selectors: string[],
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const sel of selectors) {
      const list = document.querySelectorAll(sel);
      for (const el of Array.from(list)) {
        if (isVisible(el)) return el as HTMLElement;
      }
    }
    await sleep(120);
  }
  return null;
}

function setEditorText(editor: HTMLElement, text: string): boolean {
  // Plain textarea / input - bypass framework controlled-input wrappers via
  // the native value setter so React/Vue/etc pick up the change.
  if (
    editor instanceof HTMLTextAreaElement ||
    editor instanceof HTMLInputElement
  ) {
    const proto =
      editor instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    editor.focus();
    if (setter) setter.call(editor, text);
    else editor.value = text;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // contenteditable (ProseMirror, Lexical, etc.)
  editor.focus();
  try {
    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
  } catch {
    /* ignore */
  }

  // execCommand fires the right beforeinput/input events that ProseMirror
  // and friends listen for. Deprecated but still the most reliable path.
  try {
    if (document.execCommand('insertText', false, text)) return true;
  } catch {
    /* fall through */
  }

  // Fallback: write directly and synthesise an input event.
  editor.innerText = text;
  editor.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text,
    }),
  );
  return true;
}

async function clickSend(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const sel of SEND_BUTTON_SELECTORS) {
      const btn = document.querySelector(sel) as HTMLButtonElement | null;
      if (
        btn &&
        !btn.disabled &&
        btn.getAttribute('aria-disabled') !== 'true' &&
        isVisible(btn)
      ) {
        btn.click();
        return true;
      }
    }
    await sleep(100);
  }
  return false;
}

export interface InjectResult {
  ok: boolean;
  reason?: string;
  text?: string;
}

function getAssistantTurns(): HTMLElement[] {
  for (const sel of ASSISTANT_TURN_SELECTORS) {
    const list = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
    if (list.length > 0) return list;
  }
  return [];
}

function getTurnText(turn: HTMLElement): string {
  // Prefer the rendered markdown body when present; otherwise the whole turn.
  const md = turn.querySelector('.markdown') as HTMLElement | null;
  const source = md ?? turn;
  return (source.innerText ?? source.textContent ?? '').trim();
}

async function waitForResponseText(
  initialCount: number,
  initialLastText: string,
  timeoutMs: number,
  stabilityMs: number,
): Promise<string | null> {
  const start = Date.now();
  let seenText = '';
  let lastChangeAt = Date.now();

  while (Date.now() - start < timeoutMs) {
    const turns = getAssistantTurns();
    let candidate = '';
    if (turns.length > initialCount) {
      candidate = getTurnText(turns[turns.length - 1]);
    } else if (turns.length > 0) {
      // Same count: maybe the existing last turn grew (some UIs reuse the node).
      const last = getTurnText(turns[turns.length - 1]);
      if (last.length > initialLastText.length && last !== initialLastText) {
        candidate = last;
      }
    }

    if (candidate !== seenText) {
      seenText = candidate;
      lastChangeAt = Date.now();
    } else if (
      seenText.length > 0 &&
      Date.now() - lastChangeAt >= stabilityMs
    ) {
      return seenText;
    }

    await sleep(250);
  }

  return seenText.length > 0 ? seenText : null;
}

export async function injectAndSend(prompt: string): Promise<InjectResult> {
  console.log('[PR] injectAndSend - searching for editor');
  const editor = await findElement(EDITOR_SELECTORS, 6000);
  if (!editor) return { ok: false, reason: 'no-editor' };
  console.log('[PR] editor found:', editor);

  // Snapshot existing assistant turns so we can spot the new one.
  const initialTurns = getAssistantTurns();
  const initialCount = initialTurns.length;
  const initialLastText =
    initialCount > 0 ? getTurnText(initialTurns[initialCount - 1]) : '';

  if (!setEditorText(editor, prompt)) {
    return { ok: false, reason: 'set-text-failed' };
  }

  // Give the framework a tick to enable the send button.
  await sleep(150);

  const sent = await clickSend(5000);
  if (!sent) return { ok: false, reason: 'no-send-button' };
  console.log('[PR] sent - waiting for assistant response');

  const text = await waitForResponseText(
    initialCount,
    initialLastText,
    RESPONSE_TIMEOUT_MS,
    RESPONSE_STABILITY_MS,
  );
  if (!text) return { ok: false, reason: 'no-response' };
  console.log('[PR] response received, length:', text.length);

  return { ok: true, text };
}
