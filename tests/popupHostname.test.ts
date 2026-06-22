import { describe, expect, it } from 'vitest';
import {
  addDisabledSite,
  hostnameFromUrl,
  isHostDisabled,
  removeDisabledSite,
} from '@/popup/hostname';

describe('hostnameFromUrl', () => {
  it('extracts and normalizes the hostname (strips www)', () => {
    expect(hostnameFromUrl('https://www.example.com/path?q=1')).toBe('example.com');
    expect(hostnameFromUrl('https://mail.google.com/')).toBe('mail.google.com');
    expect(hostnameFromUrl('http://localhost:3000/')).toBe('localhost');
    expect(hostnameFromUrl('https://Example.COM/')).toBe('example.com');
  });

  it('returns null for non-web URLs', () => {
    expect(hostnameFromUrl('chrome://extensions')).toBeNull();
    expect(hostnameFromUrl('about:blank')).toBeNull();
    expect(hostnameFromUrl('file:///c:/secret.txt')).toBeNull();
    expect(hostnameFromUrl('chrome-extension://abc/popup.html')).toBeNull();
  });

  it('returns null for empty/invalid input', () => {
    expect(hostnameFromUrl('')).toBeNull();
    expect(hostnameFromUrl(undefined)).toBeNull();
    expect(hostnameFromUrl(null)).toBeNull();
    expect(hostnameFromUrl('not a url')).toBeNull();
  });
});

describe('isHostDisabled', () => {
  it('matches an exact entry', () => {
    expect(isHostDisabled('example.com', ['example.com'])).toBe(true);
  });

  it('matches a parent-domain entry (subdomain disabled by parent)', () => {
    expect(isHostDisabled('mail.google.com', ['google.com'])).toBe(true);
  });

  it('does not treat a subdomain entry as disabling the parent', () => {
    expect(isHostDisabled('google.com', ['mail.google.com'])).toBe(false);
  });

  it('normalizes www on both sides', () => {
    expect(isHostDisabled('www.example.com', ['example.com'])).toBe(true);
    expect(isHostDisabled('example.com', ['www.example.com'])).toBe(true);
  });

  it('returns false when unrelated or empty', () => {
    expect(isHostDisabled('example.com', ['other.com'])).toBe(false);
    expect(isHostDisabled('example.com', [])).toBe(false);
    expect(isHostDisabled('', ['example.com'])).toBe(false);
  });
});

describe('addDisabledSite', () => {
  it('adds a normalized host', () => {
    expect(addDisabledSite('www.Example.com', [])).toEqual(['example.com']);
  });

  it('does not add a duplicate or an already-covered host', () => {
    expect(addDisabledSite('example.com', ['example.com'])).toEqual(['example.com']);
    expect(addDisabledSite('mail.google.com', ['google.com'])).toEqual(['google.com']);
  });

  it('preserves existing entries', () => {
    expect(addDisabledSite('b.com', ['a.com'])).toEqual(['a.com', 'b.com']);
  });

  it('does not mutate the input array', () => {
    const input = ['a.com'];
    addDisabledSite('b.com', input);
    expect(input).toEqual(['a.com']);
  });
});

describe('removeDisabledSite', () => {
  it('removes an exact entry', () => {
    expect(removeDisabledSite('example.com', ['example.com'])).toEqual([]);
  });

  it('removes a parent entry so the host is re-enabled', () => {
    expect(removeDisabledSite('mail.google.com', ['google.com'])).toEqual([]);
  });

  it('keeps unrelated entries', () => {
    expect(removeDisabledSite('example.com', ['example.com', 'other.com'])).toEqual([
      'other.com',
    ]);
  });

  it('is a no-op (content-wise) when the host is not present', () => {
    expect(removeDisabledSite('absent.com', ['a.com', 'b.com'])).toEqual([
      'a.com',
      'b.com',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = ['example.com'];
    removeDisabledSite('example.com', input);
    expect(input).toEqual(['example.com']);
  });

  it('round-trips with addDisabledSite (add then remove returns to enabled)', () => {
    const added = addDisabledSite('site.com', []);
    expect(isHostDisabled('site.com', added)).toBe(true);
    const removed = removeDisabledSite('site.com', added);
    expect(isHostDisabled('site.com', removed)).toBe(false);
  });
});
