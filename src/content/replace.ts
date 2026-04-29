// Safe plain-text replacement for all supported editable element types.
// Never injects user content as HTML - clipboard text is always treated as
// plain text to prevent XSS via a crafted AI response.

// Use the native property-descriptor setter so React-controlled inputs pick up
// the change. React caches the last value it set; bypassing the setter causes
// React's onChange to fire as if the user typed the new content.
function getNativeSetter(
  el: HTMLInputElement | HTMLTextAreaElement,
): ((value: string) => void) | null {
  const proto =
    el instanceof HTMLInputElement
      ? window.HTMLInputElement.prototype
      : window.HTMLTextAreaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) return (v) => descriptor.set!.call(el, v);
  return null;
}

function replaceInputOrTextarea(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): void {
  const setter = getNativeSetter(el);
  if (setter) {
    setter(text);
  } else {
    el.value = text;
  }
  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  el.focus();
  el.setSelectionRange(text.length, text.length);
}

function replaceContentEditable(el: HTMLElement, text: string): void {
  el.focus();

  // Select all existing content so the following insertText replaces it.
  const sel = window.getSelection();
  if (sel) {
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // execCommand('insertText') inserts plain text, adds to undo history, and
  // dispatches the input event automatically on most browsers.
  const inserted = document.execCommand('insertText', false, text);

  if (!inserted) {
    // Fallback: set innerText directly. No undo support, but functionally correct.
    // We explicitly avoid innerHTML to prevent HTML injection.
    el.innerText = text;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }

  // Place cursor at end.
  const endSel = window.getSelection();
  if (endSel) {
    const endRange = document.createRange();
    endRange.selectNodeContents(el);
    endRange.collapse(false);
    endSel.removeAllRanges();
    endSel.addRange(endRange);
  }
}

export function replaceEditableContent(el: HTMLElement, text: string): boolean {
  try {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      replaceInputOrTextarea(el, text);
      return true;
    }
    if (el.isContentEditable) {
      replaceContentEditable(el, text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Clipboard text sanitization
// ---------------------------------------------------------------------------

// Removes only whole-response wrappers that AI models sometimes add.
// Does NOT strip internal punctuation, quotes, or meaningful whitespace.
export function sanitizeClipboardText(raw: string): string {
  let text = raw;

  // Strip wrapping triple-quotes if the entire response is enclosed.
  if (text.startsWith('"""') && text.endsWith('"""') && text.length > 6) {
    text = text.slice(3, -3);
  }

  // Strip wrapping markdown code fence if the entire response is enclosed.
  // Matches ```optionalLang\n…\n``` at the very start and end only.
  const fenceMatch = /^```[\w-]*\n([\s\S]*?)\n```$/.exec(text.trim());
  if (fenceMatch) {
    text = fenceMatch[1];
  }

  return text.trim();
}
