import { describe, it, expect } from 'vitest';
import { sanitizeClipboardText, replaceEditableContent } from '@/content/replace';

// ---------------------------------------------------------------------------
// sanitizeClipboardText
// ---------------------------------------------------------------------------

describe('sanitizeClipboardText', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeClipboardText('Hello world.')).toBe('Hello world.');
  });

  it('strips wrapping triple-quotes', () => {
    expect(sanitizeClipboardText('"""Hello world."""')).toBe('Hello world.');
  });

  it('does not strip internal triple-quotes', () => {
    const text = 'She said """hi""" to me.';
    expect(sanitizeClipboardText(text)).toBe(text);
  });

  it('strips wrapping markdown code fence', () => {
    expect(sanitizeClipboardText('```\nHello world.\n```')).toBe('Hello world.');
  });

  it('strips wrapping code fence with language tag', () => {
    expect(sanitizeClipboardText('```text\nHello world.\n```')).toBe('Hello world.');
  });

  it('does not strip an internal code fence', () => {
    const text = 'See the snippet:\n```js\nconst x=1;\n```\nDone.';
    // Not wrapping the whole text - should be left alone
    expect(sanitizeClipboardText(text)).toBe(text);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeClipboardText('  hi there  ')).toBe('hi there');
  });

  it('preserves internal whitespace and newlines', () => {
    const text = 'line one\nline two\nline three';
    expect(sanitizeClipboardText(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(sanitizeClipboardText('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// replaceEditableContent - textarea path
// ---------------------------------------------------------------------------

describe('replaceEditableContent (textarea)', () => {
  it('sets textarea value and returns true', () => {
    const el = document.createElement('textarea');
    el.value = 'original';
    const ok = replaceEditableContent(el, 'replaced');
    expect(ok).toBe(true);
    expect(el.value).toBe('replaced');
  });

  it('dispatches an input event after replacement', () => {
    const el = document.createElement('textarea');
    el.value = 'old';
    let fired = false;
    el.addEventListener('input', () => { fired = true; });
    replaceEditableContent(el, 'new value');
    expect(fired).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// replaceEditableContent - input path
// ---------------------------------------------------------------------------

describe('replaceEditableContent (input)', () => {
  it('sets input value and returns true', () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = 'old';
    const ok = replaceEditableContent(el, 'new');
    expect(ok).toBe(true);
    expect(el.value).toBe('new');
  });
});

// ---------------------------------------------------------------------------
// replaceEditableContent - unsupported element
// ---------------------------------------------------------------------------

describe('replaceEditableContent (unsupported)', () => {
  it('returns false for a non-editable element', () => {
    const el = document.createElement('div');
    expect(replaceEditableContent(el, 'text')).toBe(false);
  });
});
