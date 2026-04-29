import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS } from '@/shared/settings';
import { resetSettings, saveSettings } from '@/shared/storage';
import { buildRewritePrompt, MODE_INSTRUCTIONS } from '@/shared/promptBuilder';
import { parseDisabledSites, validateAiChatUrl } from '@/shared/validation';
import type {
  ButtonPositionPreference,
  ExtensionSettings,
  RewriteMode,
} from '@/shared/types';
import { useSettings } from './useSettings';

const MODE_LABELS: Record<RewriteMode, string> = {
  quick: 'Quick',
  normal: 'Normal',
  formal: 'Formal',
};

const POSITION_LABELS: Record<ButtonPositionPreference, string> = {
  auto: 'Auto',
  above: 'Above field',
  below: 'Below field',
};

const PREVIEW_SAMPLE_TEXT = 'hi i wanted to ask about the meeting tmrw can we move it to 3pm';

export function OptionsApp(): JSX.Element {
  const { settings: stored, loaded } = useSettings();
  const [draft, setDraft] = useState<ExtensionSettings>(stored);
  const [status, setStatus] = useState<string>('');
  const [statusKind, setStatusKind] = useState<'info' | 'error'>('info');

  // Sync local draft when storage finishes loading or remotely changes.
  useEffect(() => {
    if (loaded) setDraft(stored);
  }, [loaded, stored]);

  const urlValidation = useMemo(() => validateAiChatUrl(draft.aiChatUrl), [draft.aiChatUrl]);

  const previewPrompt = useMemo(
    () =>
      buildRewritePrompt({
        selectedText: PREVIEW_SAMPLE_TEXT,
        mode: draft.defaultMode,
        aboutMe: draft.aboutMe,
        globalPrompt: draft.globalPrompt,
        avoidPrompt: draft.avoidPrompt,
      }),
    [draft.defaultMode, draft.aboutMe, draft.globalPrompt, draft.avoidPrompt],
  );

  function update<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]): void {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function showStatus(message: string, kind: 'info' | 'error' = 'info'): void {
    setStatus(message);
    setStatusKind(kind);
    if (message) {
      window.setTimeout(() => setStatus(''), 4000);
    }
  }

  async function handleSave(): Promise<void> {
    if (!urlValidation.ok) {
      showStatus(urlValidation.message, 'error');
      return;
    }
    try {
      await saveSettings(draft);
      showStatus('Settings saved.');
    } catch (err) {
      showStatus(`Failed to save: ${(err as Error).message}`, 'error');
    }
  }

  async function handleReset(): Promise<void> {
    try {
      const next = await resetSettings();
      setDraft(next);
      showStatus('Reset to defaults.');
    } catch (err) {
      showStatus(`Failed to reset: ${(err as Error).message}`, 'error');
    }
  }

  const disabledSitesText = draft.disabledSites.join('\n');

  const needsSetup = loaded && !draft.aiChatUrl.trim();

  return (
    <main className="pr-options">
      <header className="pr-options__header">
        <div className="pr-options__title-row">
          <img
            src={chrome.runtime.getURL('src/assets/icons/icon48.png')}
            alt="Re-Phraser"
            width={36}
            height={36}
            style={{ borderRadius: 8 }}
          />
          <h1>Re-Phraser</h1>
        </div>
        <p className="pr-muted">
          Personalize how your selected text is rewritten. Settings are stored locally.
          Nothing is sent to any server.
        </p>
      </header>

      {needsSetup && (
        <section className="pr-card pr-welcome">
          <h2>👋 Welcome - one quick setup step</h2>
          <p className="pr-muted">
            Re-Phraser works by sending your text to an AI chat tab you already have open.
            You just need to tell it which tab to use.
          </p>
          <ol className="pr-steps">
            <li>
              <strong>Open your AI chat and start a conversation</strong>
              <span>
                Go to <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a> (or
                Claude, Gemini, etc.) and send any message - even just "Hi". A conversation URL will be created.
              </span>
            </li>
            <li>
              <strong>Copy the URL from the browser bar</strong>
              <span>
                It will look something like <code>chatgpt.com/c/abc-123</code>.
                Copy the full URL including <code>https://</code>.
              </span>
            </li>
            <li>
              <strong>Paste it into the "AI chat URL" field below and click Save</strong>
              <span>
                That's all the setup needed. The extension will reuse that conversation tab every time.
              </span>
            </li>
            <li>
              <strong>Select text on any page and start rewriting</strong>
              <span>
                Highlight something you typed, then pick <strong>Quick</strong>, <strong>Normal</strong>,
                or <strong>Formal</strong>. The AI rewrites it and the result appears right in the popup - one click to apply.
              </span>
            </li>
          </ol>
        </section>
      )}

      <section className="pr-card">
        <h2>AI chat</h2>
        <label className="pr-field">
          <span>AI chat URL</span>
          <input
            type="url"
            placeholder="https://chat.example.com/"
            value={draft.aiChatUrl}
            onChange={(e) => update('aiChatUrl', e.target.value)}
          />
          {urlValidation.message && (
            <span className="pr-error">{urlValidation.message}</span>
          )}
          {urlValidation.warning && !urlValidation.message && (
            <span className="pr-warn">{urlValidation.warning}</span>
          )}
          <span className="pr-help">
            The extension only opens or focuses this URL after you click. It does not
            paste, scrape, or read anything from the AI site.
          </span>
        </label>

        <label className="pr-field pr-field--row">
          <input
            type="checkbox"
            checked={draft.autoOpenAiTab}
            onChange={(e) => update('autoOpenAiTab', e.target.checked)}
          />
          <span>Automatically open AI tab after copying the prompt</span>
        </label>
      </section>

      <section className="pr-card">
        <h2>Personalization</h2>

        <label className="pr-field">
          <span>About Me</span>
          <textarea
            rows={4}
            value={draft.aboutMe}
            onChange={(e) => update('aboutMe', e.target.value)}
          />
        </label>

        <label className="pr-field">
          <span>Global Prompt</span>
          <textarea
            rows={6}
            value={draft.globalPrompt}
            onChange={(e) => update('globalPrompt', e.target.value)}
          />
        </label>

        <label className="pr-field">
          <span>Avoid These Things</span>
          <textarea
            rows={6}
            value={draft.avoidPrompt}
            onChange={(e) => update('avoidPrompt', e.target.value)}
          />
        </label>
      </section>

      <section className="pr-card">
        <h2>Behavior</h2>

        <label className="pr-field">
          <span>Default mode</span>
          <select
            value={draft.defaultMode}
            onChange={(e) => update('defaultMode', e.target.value as RewriteMode)}
          >
            {(Object.keys(MODE_LABELS) as RewriteMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]} - {MODE_INSTRUCTIONS[m]}
              </option>
            ))}
          </select>
        </label>

        <label className="pr-field">
          <span>Button position preference</span>
          <select
            value={draft.buttonPosition}
            onChange={(e) =>
              update('buttonPosition', e.target.value as ButtonPositionPreference)
            }
          >
            {(Object.keys(POSITION_LABELS) as ButtonPositionPreference[]).map((p) => (
              <option key={p} value={p}>
                {POSITION_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="pr-field pr-field--row">
          <input
            type="checkbox"
            checked={draft.enableOnAllSites}
            onChange={(e) => update('enableOnAllSites', e.target.checked)}
          />
          <span>Enable on all sites</span>
        </label>

        <label className="pr-field">
          <span>Disabled sites (one host per line, e.g. example.com)</span>
          <textarea
            rows={4}
            value={disabledSitesText}
            onChange={(e) => update('disabledSites', parseDisabledSites(e.target.value))}
          />
          <span className="pr-help">
            The Rewrite button never appears on listed hostnames. Leading "www." is matched.
          </span>
        </label>
      </section>

      <section className="pr-card">
        <h2>Prompt preview</h2>
        <p className="pr-muted">
          A read-only preview using sample text and your current settings.
        </p>
        <pre className="pr-preview">{previewPrompt}</pre>
      </section>

      <footer className="pr-actions">
        <button type="button" className="pr-btn pr-btn--primary" onClick={handleSave}>
          Save
        </button>
        <button type="button" className="pr-btn" onClick={handleReset}>
          Reset to defaults
        </button>
        <button
          type="button"
          className="pr-btn pr-btn--ghost"
          onClick={() => setDraft(DEFAULT_SETTINGS)}
        >
          Restore defaults to form (no save)
        </button>
        {status && (
          <span
            className={statusKind === 'error' ? 'pr-status pr-status--error' : 'pr-status'}
            role="status"
          >
            {status}
          </span>
        )}
      </footer>
    </main>
  );
}
