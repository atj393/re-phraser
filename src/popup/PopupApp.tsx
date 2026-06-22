import { useEffect, useState } from 'react';
import { loadSettings, onSettingsChanged, saveSettings } from '@/shared/storage';
import { DEFAULT_SETTINGS } from '@/shared/settings';
import type { ExtensionSettings } from '@/shared/types';
import {
  addDisabledSite,
  hostnameFromUrl,
  isHostDisabled,
  removeDisabledSite,
} from './hostname';

const ICON_URL: string = (() => {
  try {
    return chrome.runtime.getURL('src/assets/icons/icon48.png');
  } catch {
    return '';
  }
})();

async function getActiveTabUrl(): Promise<string | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.url ?? null;
  } catch {
    return null;
  }
}

export function PopupApp(): JSX.Element {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [host, setHost] = useState<string | null>(null);
  const [hostResolved, setHostResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoaded(true);
      }
    });
    void getActiveTabUrl().then((url) => {
      if (!cancelled) {
        setHost(hostnameFromUrl(url));
        setHostResolved(true);
      }
    });
    // Keep in sync if settings change elsewhere (e.g. the options page) while open.
    const off = onSettingsChanged((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  // Persist the full settings object (other fields preserved). The content
  // script's existing storage listener handles showing/removing its UI.
  async function persist(next: ExtensionSettings): Promise<void> {
    setSettings(next);
    try {
      await saveSettings(next);
    } catch {
      // Re-read on failure so the UI reflects the actual stored state.
      void loadSettings().then(setSettings);
    }
  }

  function toggleGlobal(): void {
    void persist({ ...settings, enableOnAllSites: !settings.enableOnAllSites });
  }

  function toggleSite(): void {
    if (!host) return;
    const disabled = isHostDisabled(host, settings.disabledSites);
    const disabledSites = disabled
      ? removeDisabledSite(host, settings.disabledSites)
      : addDisabledSite(host, settings.disabledSites);
    void persist({ ...settings, disabledSites });
  }

  function openSettings(): void {
    void chrome.runtime.openOptionsPage();
  }

  const globalOn = settings.enableOnAllSites;
  const siteDisabled = host ? isHostDisabled(host, settings.disabledSites) : false;
  const siteEnabled = globalOn && !siteDisabled;
  const ready = loaded && hostResolved;

  return (
    <main className="pr-popup">
      <header className="pr-popup__head">
        {ICON_URL && <img src={ICON_URL} alt="" aria-hidden="true" width={24} height={24} />}
        <h1>Re-Phraser</h1>
      </header>

      {/* Global enable/disable -> reuses settings.enableOnAllSites */}
      <label className="pr-popup__row">
        <span className="pr-popup__label">
          <strong>Enabled everywhere</strong>
          <small>Turn Re-Phraser on or off on every site.</small>
        </span>
        <input
          type="checkbox"
          className="pr-popup__switch"
          checked={globalOn}
          disabled={!ready}
          onChange={toggleGlobal}
          aria-label="Enable Re-Phraser on all sites"
        />
      </label>

      {/* Per-site enable/disable -> reuses settings.disabledSites */}
      <div className={'pr-popup__row' + (globalOn ? '' : ' pr-popup__row--muted')}>
        <span className="pr-popup__label">
          <strong>This site</strong>
          {host ? (
            <small className="pr-popup__host">{host}</small>
          ) : (
            <small>Not a normal website - per-site toggle unavailable here.</small>
          )}
        </span>
        <input
          type="checkbox"
          className="pr-popup__switch"
          checked={siteEnabled}
          disabled={!ready || !globalOn || !host}
          onChange={toggleSite}
          aria-label="Enable Re-Phraser on this site"
        />
      </div>

      {!globalOn && (
        <p className="pr-popup__note">Re-Phraser is off everywhere. The per-site setting applies once it is on.</p>
      )}
      {globalOn && host && siteDisabled && (
        <p className="pr-popup__note">Ignored on {host}. The floating toolbar will not appear here.</p>
      )}

      <footer className="pr-popup__foot">
        <button type="button" className="pr-btn" onClick={openSettings}>
          Open settings
        </button>
      </footer>
    </main>
  );
}
