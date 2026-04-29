// Supported input types where selectionStart/selectionEnd are defined by spec.
// Password is intentionally excluded - we never offer to rewrite passwords.
export const SUPPORTED_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', '']);

export function isSupportedInput(el: Element | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  return SUPPORTED_INPUT_TYPES.has(el.type.toLowerCase());
}

// Returns true if el has effective content-editability.
// Checks both the computed property (isContentEditable) AND the attribute so
// the function works in environments like jsdom where isContentEditable can
// return false for unconnected elements even when the attribute is set.
function hasContentEditable(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const attr = el.getAttribute('contenteditable');
  return attr === 'true' || attr === '';
}

export function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (isSupportedInput(el)) return true;
  // Covers contenteditable="true" and role=textbox editors
  // (Gmail, LinkedIn, WhatsApp Web, …).
  if (el instanceof HTMLElement && hasContentEditable(el)) return true;
  return false;
}

export function isReadonlyOrDisabled(el: Element | null): boolean {
  if (!el) return true;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.readOnly || el.disabled;
  }
  if (el instanceof HTMLElement) {
    // contenteditable="false" is explicitly non-editable
    if (el.getAttribute('contenteditable') === 'false') return true;
    if (el.getAttribute('aria-readonly') === 'true') return true;
    if (el.getAttribute('aria-disabled') === 'true') return true;
  }
  return false;
}

// For contenteditable elements, returns the outermost contenteditable ancestor
// so we compare against the full editable region (e.g. the Gmail body, not a
// nested <div> inside it). For textarea/input, returns the element itself.
export function getEditableRoot(el: Element | null): HTMLElement | null {
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el;
  if (!hasContentEditable(el)) return null;
  let candidate: HTMLElement = el;
  let parent = el.parentElement;
  while (parent instanceof HTMLElement && hasContentEditable(parent)) {
    candidate = parent;
    parent = parent.parentElement;
  }
  return candidate;
}

// Returns the user-visible text of an editable element.
// innerText respects CSS visibility; textContent includes hidden content.
export function getEditableText(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  return el.innerText ?? el.textContent ?? '';
}

export function getSelectedTextFromEditable(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    return el.value.substring(start, end);
  }
  return window.getSelection()?.toString() ?? '';
}

export function isFullSelectionInsideEditable(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const value = el.value;
    return (
      el.selectionStart === 0 &&
      el.selectionEnd === value.length &&
      value.trim().length > 2
    );
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const anchor = sel.anchorNode;
  const focus = sel.focusNode;
  if (!anchor || !focus) return false;
  if (!el.contains(anchor) || !el.contains(focus)) return false;
  const selectedTrimmed = sel.toString().trim();
  const fullTrimmed = getEditableText(el).trim();
  return selectedTrimmed.length > 2 && selectedTrimmed === fullTrimmed;
}
