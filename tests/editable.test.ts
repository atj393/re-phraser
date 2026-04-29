import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEditableElement,
  isSupportedInput,
  isReadonlyOrDisabled,
  getEditableRoot,
  getEditableText,
  getSelectedTextFromEditable,
  isFullSelectionInsideEditable,
  SUPPORTED_INPUT_TYPES,
} from '@/content/editable';

// ---------------------------------------------------------------------------
// Helpers - create elements in jsdom
// ---------------------------------------------------------------------------

function input(type: string, extra?: Partial<HTMLInputElement>): HTMLInputElement {
  const el = document.createElement('input');
  el.type = type;
  if (extra) Object.assign(el, extra);
  return el;
}

function textarea(extra?: Partial<HTMLTextAreaElement>): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  if (extra) Object.assign(el, extra);
  return el;
}

function ce(text?: string): HTMLDivElement {
  const el = document.createElement('div');
  // Use setAttribute - jsdom does not reflect the contentEditable IDL property
  // to the DOM attribute, but getAttribute('contenteditable') works correctly.
  el.setAttribute('contenteditable', 'true');
  if (text) el.innerText = text;
  return el;
}

// ---------------------------------------------------------------------------
// SUPPORTED_INPUT_TYPES
// ---------------------------------------------------------------------------

describe('SUPPORTED_INPUT_TYPES', () => {
  it('includes text, search, email, url, empty string', () => {
    expect(SUPPORTED_INPUT_TYPES.has('text')).toBe(true);
    expect(SUPPORTED_INPUT_TYPES.has('search')).toBe(true);
    expect(SUPPORTED_INPUT_TYPES.has('email')).toBe(true);
    expect(SUPPORTED_INPUT_TYPES.has('url')).toBe(true);
    expect(SUPPORTED_INPUT_TYPES.has('')).toBe(true);
  });
  it('excludes password, number, checkbox', () => {
    expect(SUPPORTED_INPUT_TYPES.has('password')).toBe(false);
    expect(SUPPORTED_INPUT_TYPES.has('number')).toBe(false);
    expect(SUPPORTED_INPUT_TYPES.has('checkbox')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSupportedInput
// ---------------------------------------------------------------------------

describe('isSupportedInput', () => {
  it('returns true for input[type=text]', () => expect(isSupportedInput(input('text'))).toBe(true));
  it('returns true for input[type=search]', () => expect(isSupportedInput(input('search'))).toBe(true));
  it('returns true for input[type=email]', () => expect(isSupportedInput(input('email'))).toBe(true));
  it('returns true for input[type=url]', () => expect(isSupportedInput(input('url'))).toBe(true));
  it('returns false for input[type=password]', () => expect(isSupportedInput(input('password'))).toBe(false));
  it('returns false for input[type=number]', () => expect(isSupportedInput(input('number'))).toBe(false));
  it('returns false for textarea', () => expect(isSupportedInput(textarea())).toBe(false));
  it('returns false for null', () => expect(isSupportedInput(null)).toBe(false));
  it('returns false for a plain div', () => expect(isSupportedInput(document.createElement('div'))).toBe(false));
});

// ---------------------------------------------------------------------------
// isEditableElement
// ---------------------------------------------------------------------------

describe('isEditableElement', () => {
  it('accepts textarea', () => expect(isEditableElement(textarea())).toBe(true));
  it('accepts input[type=text]', () => expect(isEditableElement(input('text'))).toBe(true));
  it('accepts input[type=search]', () => expect(isEditableElement(input('search'))).toBe(true));
  it('accepts contenteditable div', () => expect(isEditableElement(ce())).toBe(true));
  it('rejects input[type=password]', () => expect(isEditableElement(input('password'))).toBe(false));
  it('rejects plain div', () => expect(isEditableElement(document.createElement('div'))).toBe(false));
  it('rejects null', () => expect(isEditableElement(null)).toBe(false));
  it('rejects button', () => expect(isEditableElement(document.createElement('button'))).toBe(false));
});

// ---------------------------------------------------------------------------
// isReadonlyOrDisabled
// ---------------------------------------------------------------------------

describe('isReadonlyOrDisabled', () => {
  it('returns true for readonly textarea', () => {
    const el = textarea({ readOnly: true });
    expect(isReadonlyOrDisabled(el)).toBe(true);
  });
  it('returns true for disabled input', () => {
    const el = input('text', { disabled: true });
    expect(isReadonlyOrDisabled(el)).toBe(true);
  });
  it('returns false for normal input', () => {
    expect(isReadonlyOrDisabled(input('text'))).toBe(false);
  });
  it('returns true for contenteditable=false', () => {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'false');
    expect(isReadonlyOrDisabled(el)).toBe(true);
  });
  it('returns true for aria-readonly=true', () => {
    const el = ce();
    el.setAttribute('aria-readonly', 'true');
    expect(isReadonlyOrDisabled(el)).toBe(true);
  });
  it('returns true for null', () => {
    expect(isReadonlyOrDisabled(null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getEditableRoot
// ---------------------------------------------------------------------------

describe('getEditableRoot', () => {
  it('returns textarea itself', () => {
    const el = textarea();
    expect(getEditableRoot(el)).toBe(el);
  });
  it('returns input itself', () => {
    const el = input('text');
    expect(getEditableRoot(el)).toBe(el);
  });
  it('returns outermost contenteditable ancestor', () => {
    const outer = document.createElement('div');
    outer.setAttribute('contenteditable', 'true');
    const inner = document.createElement('div');
    inner.setAttribute('contenteditable', 'true');
    outer.appendChild(inner);
    document.body.appendChild(outer);
    expect(getEditableRoot(inner)).toBe(outer);
    outer.remove();
  });
  it('returns null for plain div', () => {
    expect(getEditableRoot(document.createElement('div'))).toBeNull();
  });
  it('returns null for null', () => {
    expect(getEditableRoot(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getEditableText
// ---------------------------------------------------------------------------

describe('getEditableText', () => {
  it('returns value for textarea', () => {
    const el = textarea();
    el.value = 'hello';
    expect(getEditableText(el)).toBe('hello');
  });
  it('returns value for input', () => {
    const el = input('text');
    el.value = 'world';
    expect(getEditableText(el)).toBe('world');
  });
});

// ---------------------------------------------------------------------------
// getSelectedTextFromEditable
// ---------------------------------------------------------------------------

describe('getSelectedTextFromEditable', () => {
  it('returns selected slice of textarea value', () => {
    const el = textarea();
    el.value = 'hello world';
    el.setSelectionRange(6, 11);
    expect(getSelectedTextFromEditable(el)).toBe('world');
  });
  it('returns empty string when nothing selected', () => {
    const el = textarea();
    el.value = 'hello';
    el.setSelectionRange(0, 0);
    expect(getSelectedTextFromEditable(el)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isFullSelectionInsideEditable - textarea / input path
// ---------------------------------------------------------------------------

describe('isFullSelectionInsideEditable (input/textarea)', () => {
  beforeEach(() => {
    // Selection-range helpers work correctly in jsdom for textarea/input.
  });

  it('returns true when all text is selected', () => {
    const el = textarea();
    el.value = 'hello world';
    el.setSelectionRange(0, 11);
    expect(isFullSelectionInsideEditable(el)).toBe(true);
  });

  it('returns false for partial selection', () => {
    const el = textarea();
    el.value = 'hello world';
    el.setSelectionRange(0, 5);
    expect(isFullSelectionInsideEditable(el)).toBe(false);
  });

  it('returns false when text is too short (<=2 chars)', () => {
    const el = textarea();
    el.value = 'hi';
    el.setSelectionRange(0, 2);
    expect(isFullSelectionInsideEditable(el)).toBe(false);
  });

  it('returns false when whitespace only', () => {
    const el = textarea();
    el.value = '   ';
    el.setSelectionRange(0, 3);
    expect(isFullSelectionInsideEditable(el)).toBe(false);
  });

  it('returns false when selectionStart is not 0', () => {
    const el = textarea();
    el.value = 'hello world!';
    el.setSelectionRange(1, 12);
    expect(isFullSelectionInsideEditable(el)).toBe(false);
  });
});
