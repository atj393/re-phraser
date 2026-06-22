// Popup-only hostname helpers.
//
// These intentionally DUPLICATE the small matching rule used by the content
// script's siteCheck.ts. Per the project's regression-safety rules, the working
// content-script logic is left completely untouched; this popup keeps its own
// copy rather than refactoring shared code to remove minor duplication.
//
// The disabled-site matching mirrors siteCheck.isSiteEnabled: a host is disabled
// when a disabledSites entry equals it, or is a parent domain of it (after
// stripping a leading "www." from both sides).

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '');
}

// Extract a normalized hostname from a tab URL. Returns null for anything that
// is not a normal http(s) page (chrome://, about:, file:, extension pages, etc.),
// where the per-site toggle does not apply.
export function hostnameFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  const host = normalizeHost(parsed.hostname);
  return host.length > 0 ? host : null;
}

// True when `host` is currently disabled by the given list (exact or parent).
export function isHostDisabled(host: string, disabledSites: string[]): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  return disabledSites.some((entry) => {
    const site = normalizeHost(entry);
    return site.length > 0 && (h === site || h.endsWith(`.${site}`));
  });
}

// Return a new list with `host` added (no duplicates, no change if already
// covered by an existing entry).
export function addDisabledSite(host: string, disabledSites: string[]): string[] {
  const h = normalizeHost(host);
  if (!h) return disabledSites.slice();
  if (isHostDisabled(h, disabledSites)) return disabledSites.slice();
  return [...disabledSites, h];
}

// Return a new list with every entry that disables `host` removed (exact match
// or parent domain), so "allow this site" reliably re-enables the current host.
// Unrelated entries are preserved.
export function removeDisabledSite(host: string, disabledSites: string[]): string[] {
  const h = normalizeHost(host);
  if (!h) return disabledSites.slice();
  return disabledSites.filter((entry) => {
    const site = normalizeHost(entry);
    if (site.length === 0) return true; // keep blanks untouched
    return !(h === site || h.endsWith(`.${site}`));
  });
}
