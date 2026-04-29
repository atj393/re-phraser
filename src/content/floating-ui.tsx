import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { buildRewritePrompt, MODE_LABELS } from '@/shared/promptBuilder';
import { loadSettings, onSettingsChanged } from '@/shared/storage';
import { DEFAULT_SETTINGS } from '@/shared/settings';
import { sendMessage } from '@/shared/messages';
import type { ButtonPositionPreference, ExtensionSettings, RewriteMode } from '@/shared/types';
import type { EditableSelectionInfo } from './selection';
import { replaceEditableContent } from './replace';

// ---------------------------------------------------------------------------
// Page-level styles - scoped to [data-re-phraser-ui] to avoid leaking
// ---------------------------------------------------------------------------
const PAGE_STYLES = `
[data-re-phraser-ui] *,[data-re-phraser-ui] *::before,[data-re-phraser-ui] *::after{box-sizing:border-box;margin:0;padding:0}
[data-re-phraser-ui]{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:13px;line-height:1.5;color:#0F172A;-webkit-font-smoothing:antialiased}

/* ── Logo ────────────────────────────────── */
[data-re-phraser-ui] .pr-toolbar-logo{
  width:18px;height:18px;border-radius:4px;object-fit:contain;
  flex-shrink:0;margin-left:4px;margin-right:2px;opacity:.85}

/* ── Toolbar ──────────────────────────────── */
[data-re-phraser-ui] .pr-toolbar{
  position:fixed;pointer-events:auto;display:inline-flex;align-items:center;gap:2px;
  padding:4px;background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:12px;
  box-shadow:0 8px 28px rgba(0,0,0,.13),0 2px 8px rgba(0,0,0,.07),0 0 0 .5px rgba(0,0,0,.04);
  user-select:none;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
[data-re-phraser-ui] .pr-tool-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:6px 11px;background:transparent;color:#334155;border:none;border-radius:8px;
  font:500 12px/1 inherit;font-family:inherit;cursor:pointer;white-space:nowrap;
  transition:background .15s,color .15s}
[data-re-phraser-ui] .pr-tool-btn svg{flex-shrink:0;opacity:.7;transition:opacity .15s}
[data-re-phraser-ui] .pr-tool-btn:hover{background:#6366F1;color:#fff}
[data-re-phraser-ui] .pr-tool-btn:hover svg{opacity:1}
[data-re-phraser-ui] .pr-tool-btn:focus-visible{outline:2px solid #6366F1;outline-offset:1px}
[data-re-phraser-ui] .pr-tool-divider{width:1px;height:18px;background:rgba(0,0,0,.08);margin:0 2px;flex-shrink:0}
[data-re-phraser-ui] .pr-tool-settings{padding:6px 8px;color:#94A3B8}
[data-re-phraser-ui] .pr-tool-settings:hover{background:#F1F5F9;color:#6366F1}

/* ── Panel ────────────────────────────────── */
[data-re-phraser-ui] .pr-panel{
  position:fixed;pointer-events:auto;width:300px;overflow:hidden;color:#0F172A;
  background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;
  box-shadow:0 20px 60px rgba(0,0,0,.14),0 8px 20px rgba(0,0,0,.08),0 0 0 .5px rgba(0,0,0,.04)}

/* ── Spinner / loading ────────────────────── */
[data-re-phraser-ui] .pr-loading{
  display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 20px 22px}
[data-re-phraser-ui] .pr-spinner{
  width:32px;height:32px;border:2.5px solid #E2E8F0;border-top-color:#6366F1;
  border-radius:50%;animation:pr-spin .75s linear infinite}
@keyframes pr-spin{to{transform:rotate(360deg)}}
[data-re-phraser-ui] .pr-loading-label{font-size:13px;font-weight:600;color:#0F172A;text-align:center}
[data-re-phraser-ui] .pr-loading-sub{font-size:11px;color:#94A3B8;text-align:center;margin-top:-4px}
[data-re-phraser-ui] .pr-cancel{
  margin-top:2px;background:transparent;border:none;color:#94A3B8;
  font:500 11px/1 inherit;font-family:inherit;cursor:pointer;
  padding:4px 10px;border-radius:6px;transition:color .12s,background .12s}
[data-re-phraser-ui] .pr-cancel:hover{color:#EF4444;background:#FEF2F2}

/* ── Result confirm ───────────────────────── */
[data-re-phraser-ui] .pr-confirm{display:flex;flex-direction:column;gap:10px;padding:16px}
[data-re-phraser-ui] .pr-result-label{
  font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94A3B8}
[data-re-phraser-ui] .pr-result-text{
  background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;
  padding:10px 12px;font-size:13px;line-height:1.6;color:#0F172A;
  max-height:150px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;scrollbar-width:thin}
[data-re-phraser-ui] .pr-confirm-actions{display:flex;gap:8px}
[data-re-phraser-ui] .pr-confirm-yes{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;
  background:#6366F1;color:#fff;border:none;border-radius:8px;
  padding:8px 12px;font:600 12px/1.4 inherit;font-family:inherit;cursor:pointer;
  transition:background .15s}
[data-re-phraser-ui] .pr-confirm-yes:hover{background:#4F46E5}
[data-re-phraser-ui] .pr-confirm-yes:focus-visible{outline:2px solid #6366F1;outline-offset:2px}
[data-re-phraser-ui] .pr-confirm-no{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;
  background:#F1F5F9;color:#475569;border:none;border-radius:8px;
  padding:8px 12px;font:500 12px/1.4 inherit;font-family:inherit;cursor:pointer;
  transition:background .15s}
[data-re-phraser-ui] .pr-confirm-no:hover{background:#E2E8F0}
[data-re-phraser-ui] .pr-confirm-no:focus-visible{outline:2px solid #6366F1;outline-offset:2px}
[data-re-phraser-ui] .pr-status{font-size:11px;color:#64748B;text-align:center}
[data-re-phraser-ui] .pr-status--error{color:#EF4444}
[data-re-phraser-ui] .pr-status--success{color:#10B981}

/* ── Dark mode ────────────────────────────── */
@media(prefers-color-scheme:dark){
  [data-re-phraser-ui]{color:#E2E8F0}
  [data-re-phraser-ui] .pr-toolbar{
    background:rgba(15,15,25,.96);border-color:rgba(255,255,255,.08);
    box-shadow:0 8px 28px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3),0 0 0 .5px rgba(255,255,255,.04)}
  [data-re-phraser-ui] .pr-tool-btn{color:#CBD5E1}
  [data-re-phraser-ui] .pr-tool-btn:hover{background:#6366F1;color:#fff}
  [data-re-phraser-ui] .pr-tool-divider{background:rgba(255,255,255,.1)}
  [data-re-phraser-ui] .pr-tool-settings{color:#475569}
  [data-re-phraser-ui] .pr-tool-settings:hover{background:rgba(99,102,241,.15);color:#818CF8}
  [data-re-phraser-ui] .pr-panel{
    background:#0F0F1A;border-color:rgba(255,255,255,.08);color:#E2E8F0;
    box-shadow:0 20px 60px rgba(0,0,0,.6),0 8px 20px rgba(0,0,0,.4),0 0 0 .5px rgba(255,255,255,.04)}
  [data-re-phraser-ui] .pr-spinner{border-color:rgba(255,255,255,.1);border-top-color:#818CF8}
  [data-re-phraser-ui] .pr-loading-label{color:#E2E8F0}
  [data-re-phraser-ui] .pr-loading-sub{color:#334155}
  [data-re-phraser-ui] .pr-cancel:hover{color:#F87171;background:rgba(239,68,68,.1)}
  [data-re-phraser-ui] .pr-result-text{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08);color:#E2E8F0}
  [data-re-phraser-ui] .pr-confirm-no{background:rgba(255,255,255,.06);color:#94A3B8}
  [data-re-phraser-ui] .pr-confirm-no:hover{background:rgba(255,255,255,.1)}
  [data-re-phraser-ui] .pr-status{color:#475569}
  [data-re-phraser-ui] .pr-status--error{color:#F87171}
  [data-re-phraser-ui] .pr-status--success{color:#34D399}
}
`;

// ---------------------------------------------------------------------------
// Extension icon URL (resolved once at module init, empty string in tests)
// ---------------------------------------------------------------------------
const ICON_URL: string = (() => {
  try {
    return chrome.runtime.getURL('src/assets/icons/icon32.png');
  } catch {
    return '';
  }
})();

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

const BUTTON_W = 270;
const BUTTON_H = 32;
const PANEL_W = 292;
const PANEL_H = 280;
const GAP = 6;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function buttonPos(
  rect: DOMRect,
  pref: ButtonPositionPreference,
): { top: number; left: number } {
  const spaceBelow = window.innerHeight - rect.bottom;
  const above =
    pref === 'above' ||
    (pref === 'auto' &&
      spaceBelow < BUTTON_H + GAP &&
      rect.top > BUTTON_H + GAP);
  const top = above ? rect.top - BUTTON_H - GAP : rect.bottom + GAP;
  const left = clamp(
    rect.right - BUTTON_W,
    8,
    window.innerWidth - BUTTON_W - 8,
  );
  return { top: clamp(top, 8, window.innerHeight - BUTTON_H - 8), left };
}

function panelPos(btn: { top: number; left: number }): {
  top: number;
  left: number;
} {
  return {
    top: clamp(btn.top, 8, window.innerHeight - PANEL_H - 8),
    left: clamp(btn.left, 8, window.innerWidth - PANEL_W - 8),
  };
}

// ---------------------------------------------------------------------------
// Module-level state bridge
// (one floating UI instance per content script - safe to use module scope)
// ---------------------------------------------------------------------------

type FloatingPhase = 'idle' | 'button' | 'panel';

interface FloatingState {
  phase: FloatingPhase;
  info: EditableSelectionInfo | null;
  mode: RewriteMode;
  status: string;
  statusKind: 'info' | 'error' | 'success';
  pendingResult: string | null;
  awaitingResponse: boolean;
}

type StateSetter = React.Dispatch<React.SetStateAction<FloatingState>>;

let _setState: StateSetter | null = null;

function externalSet(updater: (prev: FloatingState) => FloatingState): void {
  _setState?.(updater);
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

interface FloatingUiProps {
  mountEl: HTMLElement;
}

// ---------------------------------------------------------------------------
// SVG icon components
// ---------------------------------------------------------------------------

function IconBolt() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

function IconPen() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const MODE_ICONS: Record<RewriteMode, JSX.Element> = {
  quick: <IconBolt />,
  normal: <IconPen />,
  formal: <IconBriefcase />,
};

function FloatingUiComponent({ mountEl }: FloatingUiProps): JSX.Element | null {
  const [state, setState] = useState<FloatingState>({
    phase: 'idle',
    info: null,
    mode: 'normal',
    status: '',
    statusKind: 'info',
    pendingResult: null,
    awaitingResponse: false,
  });
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const panelRef = useRef<HTMLDivElement>(null);

  // Always-current refs - written synchronously during render so that the
  // stable native event handler always reads the latest values.
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  stateRef.current = state;
  settingsRef.current = settings;

  useEffect(() => {
    console.log('[PR] FloatingUiComponent mounted');
  }, []);

  // Register state setter for external access.
  useEffect(() => {
    _setState = setState;
    return () => {
      if (_setState === setState) _setState = null;
    };
  }, [setState]);

  // Load settings and subscribe to changes.
  useEffect(() => {
    void loadSettings().then((s) => {
      setSettings(s);
      setState((prev) =>
        prev.phase === 'idle' ? { ...prev, mode: s.defaultMode } : prev,
      );
    });
    return onSettingsChanged((s) => {
      setSettings(s);
    });
  }, []);

  // Focus the panel when it opens for keyboard accessibility.
  useEffect(() => {
    if (state.phase === 'panel') {
      panelRef.current?.focus();
    }
  }, [state.phase]);

  // ---- Stable action dispatcher (reads current values via refs) ----
  const handleAction = useCallback(
    async (action: string | null, btn: HTMLElement): Promise<void> => {
      if (!action) return;
      console.log('[PR] handleAction:', action, '- current phase:', stateRef.current.phase);
      const cur = stateRef.current;
      const cfg = settingsRef.current;

      const setStatusMsg = (
        msg: string,
        kind: 'info' | 'error' | 'success' = 'info',
        ms = 3500,
      ) => {
        setState((prev) => ({ ...prev, status: msg, statusKind: kind }));
        if (ms > 0 && msg) {
          setTimeout(() => setState((prev) => ({ ...prev, status: '' })), ms);
        }
      };

      const closeFn = () =>
        setState((prev) => ({
          phase: 'idle',
          info: null,
          mode: prev.mode,
          status: '',
          statusKind: 'info',
          pendingResult: null,
          awaitingResponse: false,
        }));

      const applyText = (target: HTMLElement, text: string) => {
        const ok = replaceEditableContent(target, text);
        setState((prev) => ({ ...prev, pendingResult: null }));
        if (ok) {
          setStatusMsg('Applied!', 'success', 1200);
          setTimeout(closeFn, 1300);
        } else {
          setStatusMsg('Failed to update the field.', 'error');
        }
      };

      switch (action) {
        case 'close':
          closeFn();
          break;

        case 'send-mode': {
          if (!cur.info) break;
          const mode = btn.getAttribute('data-mode') as RewriteMode | null;
          if (!mode) break;
          // Switch to the in-flight panel view immediately so the user sees
          // the spinner without waiting on the round-trip.
          setState((prev) => ({
            ...prev,
            mode,
            phase: 'panel',
            awaitingResponse: true,
            status: '',
            pendingResult: null,
          }));

          const promptText = buildRewritePrompt({
            selectedText: cur.info.text,
            mode,
            aboutMe: cfg.aboutMe,
            globalPrompt: cfg.globalPrompt,
            avoidPrompt: cfg.avoidPrompt,
          });
          // Clipboard fallback so the user can paste manually if auto-inject fails.
          try {
            await navigator.clipboard.writeText(promptText);
          } catch {
            /* ignore */
          }

          const res = await sendMessage({
            type: 'SEND_PROMPT_TO_AI',
            prompt: promptText,
          });
          setState((prev) => ({ ...prev, awaitingResponse: false }));

          if (res.ok) {
            const data = (res as { ok: true; data?: unknown }).data;
            const responseText = typeof data === 'string' ? data.trim() : '';
            if (responseText) {
              setState((prev) => ({ ...prev, pendingResult: responseText }));
            } else {
              setStatusMsg('Sent, but could not read the reply.', 'error');
            }
          } else {
            const reason = (res as { ok: false; error: string }).error;
            if (reason === 'no-url') {
              setStatusMsg('No AI chat URL set. Opening settings…', 'error');
              void sendMessage({ type: 'OPEN_OPTIONS' });
            } else if (reason === 'no-response') {
              setStatusMsg('AI did not reply in time.', 'error');
            } else if (
              reason === 'no-editor' ||
              reason === 'no-send-button' ||
              reason === 'inject-failed'
            ) {
              setStatusMsg(
                'Auto-send failed - prompt copied, paste it manually.',
                'error',
              );
            } else {
              setStatusMsg(
                'Could not reach AI tab - close it, reopen it fresh, then retry.',
                'error',
              );
            }
          }
          break;
        }

        case 'confirm-apply': {
          const target = cur.info?.element;
          const text = cur.pendingResult;
          if (!target || !text) break;
          applyText(target, text);
          break;
        }

        case 'confirm-cancel':
          closeFn();
          break;

        case 'settings':
          void sendMessage({ type: 'OPEN_OPTIONS' });
          break;
      }
    },
    [],
  );

  // Attach native click/keydown delegation on the mount container.
  useEffect(() => {
    console.log('[PR] attaching native click/keydown listeners to mount', mountEl);

    const onClick = (e: Event) => {
      const target = e.target instanceof Element ? e.target : null;
      console.log('[PR] click on mount - target:', target);
      if (!target) return;
      const btn = target.closest('[data-action]') as HTMLElement | null;
      if (!btn) return;
      console.log('[PR] dispatching action:', btn.getAttribute('data-action'));
      void handleAction(btn.getAttribute('data-action'), btn);
    };

    const onKeydown = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Escape' && stateRef.current.phase === 'panel') {
        setState((prev) => ({
          phase: 'idle',
          info: null,
          mode: prev.mode,
          status: '',
          statusKind: 'info',
          pendingResult: null,
          awaitingResponse: false,
        }));
      }
    };

    mountEl.addEventListener('click', onClick);
    mountEl.addEventListener('keydown', onKeydown);
    return () => {
      mountEl.removeEventListener('click', onClick);
      mountEl.removeEventListener('keydown', onKeydown);
    };
  }, [mountEl, handleAction]);

  if (state.phase === 'idle') return null;

  const info = state.info;
  if (!info || !document.contains(info.element)) return null;

  const rect = info.element.getBoundingClientRect();
  const bPos = buttonPos(rect, settings.buttonPosition);

  const modes = Object.keys(MODE_LABELS) as RewriteMode[];

  const statusEl = state.status ? (
    <div
      className={
        'pr-status' +
        (state.statusKind === 'error'
          ? ' pr-status--error'
          : state.statusKind === 'success'
            ? ' pr-status--success'
            : '')
      }
      role="status"
    >
      {state.status}
    </div>
  ) : null;

  // ---- Mode toolbar (selection-triggered quick actions) ----
  if (state.phase === 'button') {
    return (
      <div
        className="pr-toolbar"
        style={{ top: bPos.top, left: bPos.left }}
        role="toolbar"
        aria-label="Rewrite text"
      >
        {ICON_URL && (
          <img
            src={ICON_URL}
            alt=""
            aria-hidden="true"
            className="pr-toolbar-logo"
          />
        )}
        {modes.map((m) => (
          <button
            key={m}
            className="pr-tool-btn"
            data-action="send-mode"
            data-mode={m}
            title={`Rewrite - ${MODE_LABELS[m]}`}
          >
            {MODE_ICONS[m]}
            {MODE_LABELS[m]}
          </button>
        ))}
        <span className="pr-tool-divider" aria-hidden="true" />
        <button
          className="pr-tool-btn pr-tool-settings"
          data-action="settings"
          aria-label="Settings"
          title="Settings"
        >
          <IconGear />
        </button>
      </div>
    );
  }

  // ---- Panel (loading / result) ----
  const pPos = panelPos(bPos);

  return (
    <div
      ref={panelRef}
      className="pr-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Re-Phraser"
      tabIndex={-1}
      style={{ top: pPos.top, left: pPos.left }}
    >
      {state.awaitingResponse ? (
        <div className="pr-loading">
          <div className="pr-spinner" role="status" aria-label="Loading" />
          <div>
            <p className="pr-loading-label">
              Rewriting in {MODE_LABELS[state.mode]} mode
            </p>
            <p className="pr-loading-sub">Waiting for AI response…</p>
          </div>
          <button className="pr-cancel" data-action="close">
            Cancel
          </button>
        </div>
      ) : state.pendingResult !== null ? (
        <div className="pr-confirm">
          <p className="pr-result-label">AI Suggestion</p>
          <div className="pr-result-text">{state.pendingResult}</div>
          <div className="pr-confirm-actions">
            <button className="pr-confirm-yes" data-action="confirm-apply">
              <IconCheck /> Apply
            </button>
            <button className="pr-confirm-no" data-action="confirm-cancel">
              <IconX /> Cancel
            </button>
          </div>
          {statusEl}
        </div>
      ) : (
        <div className="pr-confirm">
          {statusEl ?? <p className="pr-result-label">No result.</p>}
          <div className="pr-confirm-actions">
            <button className="pr-confirm-no" data-action="close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FloatingUiHandle {
  setSelectionInfo: (info: EditableSelectionInfo | null) => void;
  closePanel: () => void;
  destroy: () => void;
}

let _mountedRoot: Root | null = null;
let _hostEl: HTMLElement | null = null;
let _styleEl: HTMLStyleElement | null = null;

export function mountFloatingUi(): FloatingUiHandle {
  // Prevent double-mount.
  if (_hostEl) _hostEl.remove();
  if (_styleEl) _styleEl.remove();

  // Inject scoped styles into document.head (no shadow DOM).
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-re-phraser-styles', '');
  styleEl.textContent = PAGE_STYLES;
  document.head.appendChild(styleEl);
  _styleEl = styleEl;

  // Host element rendered directly into document.body - no shadow DOM.
  // This ensures native click events bubble normally without shadow boundary issues.
  const host = document.createElement('div');
  host.setAttribute('data-re-phraser', 'host');
  host.setAttribute('data-re-phraser-ui', '');
  host.style.cssText =
    'all:unset;position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647';
  document.body.appendChild(host);
  _hostEl = host;

  console.log('[PR] host mounted in document.body (no shadow DOM):', host);

  const root = createRoot(host);
  root.render(<FloatingUiComponent mountEl={host} />);
  _mountedRoot = root;

  return {
    setSelectionInfo(info) {
      externalSet((prev) => {
        if (prev.phase === 'panel') return prev;
        if (!info) return { ...prev, phase: 'idle', info: null };
        return { ...prev, phase: 'button', info };
      });
    },
    closePanel() {
      externalSet((prev) => ({
        phase: 'idle',
        info: null,
        mode: prev.mode,
        status: '',
        statusKind: 'info',
        pendingResult: null,
        awaitingResponse: false,
      }));
    },
    destroy() {
      _mountedRoot?.unmount();
      _mountedRoot = null;
      _hostEl?.remove();
      _hostEl = null;
      _styleEl?.remove();
      _styleEl = null;
      _setState = null;
    },
  };
}
