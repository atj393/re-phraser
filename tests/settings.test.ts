import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/settings';
import { loadSettings, resetSettings, saveSettings } from '@/shared/storage';
import { installChromeMock } from './helpers/chromeMock';

describe('settings defaults', () => {
  it('has expected default mode and personalization defaults', () => {
    expect(DEFAULT_SETTINGS.defaultMode).toBe('normal');
    expect(DEFAULT_SETTINGS.aiChatUrl).toBe('');
    expect(DEFAULT_SETTINGS.enableOnAllSites).toBe(true);
    expect(DEFAULT_SETTINGS.disabledSites).toEqual([]);
    expect(DEFAULT_SETTINGS.aboutMe).toMatch(/English is not my first language/);
    expect(DEFAULT_SETTINGS.globalPrompt).toMatch(/Preserve my original meaning/);
    expect(DEFAULT_SETTINGS.avoidPrompt).toMatch(/Avoid robotic language/);
  });
});

describe('storage round-trip', () => {
  let teardown: () => void;
  beforeEach(() => {
    teardown = installChromeMock().reset;
  });
  afterEach(() => {
    teardown();
  });

  it('returns DEFAULT_SETTINGS when nothing is stored', async () => {
    const out = await loadSettings();
    expect(out).toEqual(DEFAULT_SETTINGS);
  });

  it('persists and merges partial saved settings with defaults', async () => {
    await saveSettings({
      ...DEFAULT_SETTINGS,
      aiChatUrl: 'https://chat.example.com/',
      defaultMode: 'formal',
    });
    const out = await loadSettings();
    expect(out.aiChatUrl).toBe('https://chat.example.com/');
    expect(out.defaultMode).toBe('formal');
    expect(out.aboutMe).toBe(DEFAULT_SETTINGS.aboutMe);
  });

  it('resetSettings overwrites stored values back to defaults', async () => {
    await saveSettings({
      ...DEFAULT_SETTINGS,
      aiChatUrl: 'https://other.example/',
    });
    const reset = await resetSettings();
    expect(reset).toEqual(DEFAULT_SETTINGS);
    const out = await loadSettings();
    expect(out).toEqual(DEFAULT_SETTINGS);
  });
});
