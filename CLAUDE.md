# CLAUDE.md - Working notes for Re-Phraser

Guidance for future Claude Code (and human) work on this repository. Read this before changing behavior.

## Product overview

Re-Phraser is a Manifest V3 browser extension (Chrome + Microsoft Edge) that rewrites text the user has already typed. The user selects all text in an editable field, picks **Quick**, **Normal**, or **Formal**, and the extension sends a personalized rewrite request to the user's **own already-open, signed-in AI chat tab** (for example ChatGPT, Claude, or Gemini). It reads the reply and shows it as a suggestion to **Apply** or **Cancel**.

It is a personal productivity tool. It is **not** an AI provider, uses **no** API key, has **no** backend server, and is **not** affiliated with any AI company.

## Repository structure

```
src/
  manifest.ts            # MV3 manifest (version comes from package.json)
  background/index.ts     # service worker: tab reuse + send/retrieve orchestration
  content/
    index.tsx             # content-script entry: mounts UI, watches selection,
                          #   listens for INJECT_PROMPT on the AI chat tab
    floating-ui.tsx        # toolbar (Quick/Normal/Formal) + panel + recovery cards
    selection.ts           # detects a full selection in an editable field
    editable.ts            # editable-element + selection helpers
    replace.ts             # safely replace the field's text on Apply
    chatInjector.ts        # runs on the AI chat tab: types prompt, sends, reads reply
    siteCheck.ts           # per-site enable/disable
  options/                 # React settings page (OptionsApp.tsx, useSettings.ts)
  shared/
    types.ts               # ExtensionSettings, RewriteMode, etc.
    messages.ts            # typed runtime messages + sendMessage helper
    settings.ts            # DEFAULT_SETTINGS and default prompt text
    storage.ts             # chrome.storage load/save/subscribe
    promptBuilder.ts       # builds the rewrite prompt from settings + selection
    validation.ts          # AI chat URL validation
  assets/
    icon-source.png        # canonical source artwork (NOT shipped in ZIP)
    icons/                 # generated icon16/32/48/128 (shipped)
scripts/
  generate-icons.mjs       # sharp-based icon generator (npm run icons)
  pack.mjs                 # builds store ZIPs (--target=chrome|edge)
docs/                      # privacy policy, store listings, assets (NOT shipped)
tests/                     # vitest unit tests
```

## Runtime architecture

- **Content script** (`content/index.tsx`) runs on `<all_urls>`. It mounts the floating UI, watches selection/keyboard/navigation, and - because the same content script also runs on the AI chat tab - listens for `INJECT_PROMPT` messages and calls `chatInjector.injectAndSend`.
- **Floating UI** (`content/floating-ui.tsx`) shows the Quick/Normal/Formal toolbar on full selection, and a panel for the loading spinner, the returned suggestion (Apply/Cancel), and the recovery cards.
- **Background service worker** (`background/index.ts`) owns tab reuse and orchestration. On `SEND_PROMPT_TO_AI` it opens/focuses the configured AI chat tab (in the background), waits for it to load, sends `INJECT_PROMPT` to that tab, and returns the reply text. It also handles `OPEN_OR_FOCUS_AI_TAB` and `OPEN_OPTIONS`.
- **chatInjector** (`content/chatInjector.ts`) runs on the AI chat tab: finds the composer, types the prompt, clicks send, waits for the reply to finish, and returns the text.
- **Options page** (`options/`) edits settings, validates the AI chat URL, and has a **Save and open AI chat** button.
- **Shared** utilities are framework-free and unit-tested.

## Current direct rewrite flow (do not break)

1. User selects all text in an editable field.
2. The toolbar shows **Quick / Normal / Formal immediately** (no intermediate "Rephrase" trigger, no second click).
3. Clicking a mode builds the prompt and sends `SEND_PROMPT_TO_AI` to the background automatically.
4. The background delivers it to the configured AI chat tab and retrieves the reply.
5. The panel shows the reply as an **AI Suggestion** with **Apply** and **Cancel**.

### Critical rules

- **Quick, Normal, and Formal MUST appear immediately after a full selection.** Do not gate them behind another button or step.
- **Do NOT replace the automatic send/retrieve flow with a manual copy/paste flow.** No "Copy Prompt", "paste into chat", or "Apply Clipboard Result" workflow. (A clipboard *write* fallback already exists inside the automatic flow; that is fine.)
- Do not refactor automatic sending, response retrieval, tab reuse, or selection behavior without an explicit request.

## Recovery behavior (after failure only)

The panel state has `recovery: 'none' | 'missing-url' | 'open-ai-chat'`. It is set **only** when a rewrite fails, and reset to `'none'` on a new request, success, Apply, Cancel, or close.

- `SEND_PROMPT_TO_AI` returns `no-url` -> `recovery = 'missing-url'` -> card "Set up your AI chat" with **Open settings** and **Close** (no auto-open of settings).
- Any other failure (`no-response`, `no-editor`, `no-send-button`, `inject-failed`, connection error) -> `recovery = 'open-ai-chat'` -> card "Could not reach your AI chat" with **Open AI chat** (uses `OPEN_OR_FOCUS_AI_TAB`, reuses the tab, no auto-retry), **Open settings**, and **Close**. On success it shows "AI chat opened. Return here and select a mode again."

## Settings and AI chat URL

- Settings: `aiChatUrl`, `aboutMe`, `globalPrompt`, `avoidPrompt`, `defaultMode`, `autoOpenAiTab`, `buttonPosition`, `enableOnAllSites`, `disabledSites`.
- Stored via `chrome.storage.sync` (local fallback). The user saves the **conversation URL** of their AI chat; the background reuses that tab and avoids duplicates.
- `validation.ts` only allows `http`/`https` URLs.

## Privacy constraints (must stay true)

- No analytics, no telemetry, no backend server, no account, no API-key field.
- The extension does not store selected text or AI replies; only settings are stored.
- Selected text **is** sent to the user-configured third-party AI chat through its normal website. Be honest about this in all docs; never claim the AI provider does not process the text. The user decides what to send.
- No remote code. No network requests originated by the extension itself.

## Store-release constraints

- Keep the manifest description accurate (the extension automates the user's own chat tab; do not claim "no automation").
- Do not claim affiliation/endorsement with any AI provider, guaranteed compatibility with every site, "free forever"/"unlimited", or store approval before it exists. Use "Coming soon" until live store URLs exist.
- Keep permissions minimal and honestly justified: `storage`, `tabs`, `clipboardWrite`, and the `<all_urls>` content script. No `host_permissions`, no `activeTab`, no `clipboardRead`, no `scripting`.

## Commands

```bash
npm run typecheck        # tsc --noEmit
npm run test             # vitest
npm run lint             # eslint (must be zero warnings and zero errors)
npm run build            # typecheck + vite build -> dist/
npm run icons            # regenerate icons from src/assets/icon-source.png
npm run release:check    # typecheck + test + lint + build
npm run package:chrome   # release:check + ZIP -> releases/re-phraser-v<version>-chrome.zip
npm run package:edge     # release:check + ZIP -> releases/re-phraser-v<version>-edge.zip
npm run package:stores   # both ZIPs
```

## Coding conventions

- TypeScript strict mode; React function components and hooks in the UI.
- Keep shared logic in `src/shared/` framework-free and unit-tested.
- No `console.log`/`console.debug` in runtime source. `console.warn`/`console.error` are allowed for genuine error paths, but never log selected text, prompts, AI replies, conversation URLs, or other user content.
- Do not silence ESLint with broad `eslint-disable` directives; fix the underlying issue.
- Reuse existing CSS classes in the floating UI (`pr-panel`, `pr-confirm`, `pr-confirm-actions`, `pr-confirm-yes`, `pr-confirm-no`, plus the small `pr-recovery-*` classes) rather than inventing parallel styles.

## Do not add

- Telemetry or analytics of any kind.
- Remote code, remotely hosted scripts, or eval of fetched content.
- API keys, API integrations, or a backend server.
- Unnecessary permissions or `host_permissions`.
- Automatic retries of a failed rewrite, or auto-opening settings without a user click.
