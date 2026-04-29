<div align="center">

<img src="src/assets/image.png" alt="Re-Phraser" width="96" />

# Re-Phraser

**A Chrome extension that rewrites your selected text using any AI chat - no API key, no automation beyond your own open tab.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](package.json)
[![No telemetry](https://img.shields.io/badge/telemetry-none-lightgrey)](#privacy)

</div>

---

> **Personal hobby project.** Not affiliated with, endorsed by, or related to any company or organization. Built for personal use and shared as-is.

Select text in any editable field. Re-Phraser builds a personalized prompt, injects it into your open AI chat tab, waits for the response, and brings the rewritten text back - ready to apply with one click. Nothing is sent to any server. No API key needed.

---

## Table of Contents

- [How it works](#how-it-works)
- [What it does NOT do](#what-it-does-not-do)
- [Privacy](#privacy)
- [Permissions](#permissions)
- [Installation](#installation)
- [Configuration](#configuration)
- [Modes](#modes)
- [Step-by-step usage](#step-by-step-usage)
- [Supported field types](#supported-field-types)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Stack](#stack)
- [License](#license)

---

## How it works

1. Select all the text in any editable field on any page.
2. A floating toolbar appears - click **Quick**, **Normal**, or **Formal**.
3. Re-Phraser builds a personalized prompt and injects it into your open AI chat tab in the background.
4. A spinner shows while it waits for the AI to respond.
5. The rewritten text appears in a preview panel - read it, then click **Apply** or **Cancel**.

Your original tab never loses focus. The AI tab works silently in the background.

---

## What it does NOT do

- Does **not** call any AI API - paid, free, or local.
- Does **not** require a ChatGPT, Claude, or Gemini account with any special permissions.
- Does **not** scrape or read anything from AI websites beyond the response to the prompt it just sent.
- Does **not** send your text to any server of its own.
- Does **not** store analytics, telemetry, or crash reports.
- Does **not** load any remote scripts.

---

## Privacy

| Data | Fate |
|---|---|
| Selected text | Built into a prompt string, sent only to the AI tab you configured. Never persisted. |
| Rewritten text | Returned from your AI tab and shown in the preview panel. Never stored. |
| Settings | Stored in `chrome.storage.sync` - on your device / Google account only. |
| Network requests | None of its own. The only outbound action is navigating to the URL you configure in settings. |

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist your settings across browser sessions. |
| `tabs` | Find and focus your configured AI chat tab - avoids opening duplicates. |
| `activeTab` | Operate on the current page when the floating panel is open. |
| `clipboardWrite` | Copies the prompt as a fallback in case auto-inject fails. |
| `clipboardRead` | Reserved for manual clipboard apply fallback. |
| `<all_urls>` (content script) | Editable fields exist on every website. The script only reads your selection on user gesture and makes no network requests. |

No `host_permissions` are requested. The extension never connects to any external host on its own.

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/re-phraser-extension
cd re-phraser-extension
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions` and enable **Developer mode** (top-right toggle).
2. Click **Load unpacked** and select the `dist/` folder.
3. The extension appears as **Re-Phraser**.

To update after changing source files: run `npm run build` again, then click the reload icon on the extension card.

---

## Configuration

Open the options page via:
- `chrome://extensions` → *Re-Phraser* → **Details** → **Extension options**
- Click the extension icon in the toolbar
- Click the **⚙ gear** icon inside the floating toolbar

### First-time setup

On first install the options page opens automatically and shows a setup guide:

1. Open your AI chat (ChatGPT, Claude, Gemini, etc.) and start a conversation.
2. Copy the conversation URL from the browser bar.
3. Paste it into the **AI chat URL** field and click **Save**.

That's it - Re-Phraser will reuse that tab every time.

### Settings

| Field | Default | Notes |
|---|---|---|
| AI chat URL | *(empty)* | The tab Re-Phraser injects prompts into. Must be `http://` or `https://`. |
| About Me | See below | Tells the AI about you so it matches your voice. |
| Global Prompt | See below | Writing rules applied to every rewrite. |
| Avoid These Things | See below | Things the AI should never do. |
| Default Mode | Normal | Mode pre-selected when the panel opens. |
| Auto-open AI tab | Off | When on, also opens/focuses the AI tab after injecting the prompt. |
| Button position | Auto | Where the toolbar appears relative to the field. |
| Enable on all sites | On | Turn off to disable the extension globally. |
| Disabled sites | *(empty)* | One hostname per line - toolbar never appears on these sites. |

### Default prompts

<details>
<summary>About Me (click to expand)</summary>

```
English is not my first language, so I often write rough messages and want
them rewritten naturally. I prefer friendly, clear, respectful, and practical
communication.
```

</details>

<details>
<summary>Global Prompt (click to expand)</summary>

```
Preserve my original meaning.
Do not add fake details.
Make the text grammatically correct and easy to understand.
Keep the message human, warm, and direct.
Use simple natural English.
Keep the output suitable for the same context.
```

</details>

<details>
<summary>Avoid These Things (click to expand)</summary>

```
Avoid robotic language.
Avoid unnecessary fancy words.
Avoid over-apologizing.
Avoid exaggerated compliments.
Avoid emojis unless my original text already has emojis.
Avoid phrases like "I hope this message finds you well."
Avoid changing the emotional meaning.
Avoid making short casual messages sound like corporate emails.
```

</details>

---

## Modes

| Mode | Behavior |
|---|---|
| **Quick** | Fix grammar, light rewrite. Stay close to the original. Same length or shorter. |
| **Normal** | Rewrite naturally. Improve clarity, grammar, flow, and tone. Preserve meaning. |
| **Formal** | Rewrite professionally. Workplace or official communication. Natural, not corporate. |

---

## Step-by-step usage

1. Go to any page with an editable field (Gmail, WhatsApp Web, LinkedIn, any textarea, etc.).
2. Click inside the field and type your message.
3. Select **all** the text (Ctrl+A / Cmd+A).
4. A floating toolbar appears near the field - click **Quick**, **Normal**, or **Formal**.
5. A spinner appears while Re-Phraser sends the prompt to your AI tab and waits for the reply.
6. The rewritten text appears in a preview box - read it and compare.
7. Click **Apply** to replace the field content, or **Cancel** to discard.

> **Tip:** Your original tab keeps focus the whole time. The AI tab works silently in the background.

> **If auto-inject fails:** The prompt is also copied to your clipboard as a fallback - paste it manually into the AI chat.

---

## Supported field types

- `<textarea>`
- `<input type="text">`, `type="search"`, `type="email"`, `type="url"`
- `contenteditable` elements - Gmail compose, WhatsApp Web, LinkedIn editors, and similar rich editors

The toolbar does **not** appear on:

- Password fields
- Read-only or disabled fields
- Partial selections (you must select the full content of the field)
- Fields with fewer than 3 characters

---

## Known limitations

- **Cross-origin iframes** - The content script runs in the main frame only. Fields inside cross-origin iframes (e.g. Google Docs) are not supported.
- **Undo** - The replacement is undoable with Ctrl+Z in most editors. In some React-controlled fields the undo history may be limited.
- **AI tab must be open** - Re-Phraser reuses an existing conversation tab. If the tab is closed or the URL has changed, update it in settings or open a fresh conversation.
- **SPA navigation** - The panel closes on navigation. Re-select your text to reopen it.
- **Single AI URL** - The extension tracks one configured AI chat URL. Update it in settings if you switch services.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Toolbar never appears | Confirm the field is editable and you selected **all** text (not partial). Check *Disabled sites* in settings. |
| "No AI chat URL set" | Open settings and enter a valid `https://` conversation URL. |
| "Could not reach AI tab" | Close the AI tab if it's already open, then reopen a fresh conversation and update the URL in settings. |
| Spinner runs indefinitely | The AI may be slow or the response could not be detected. Click Cancel and try again. |
| Auto-inject failed message | The prompt was copied to your clipboard - paste it manually into the AI chat. |
| Field not updated in a React app | The extension uses the native value setter to trigger React's event system. If the field still doesn't update, click inside it once after applying. |

---

## Development

```bash
npm install           # install dependencies
npm run dev           # Vite dev server with HMR (options page only)
npm run build         # typecheck + production build → dist/
npm run typecheck     # tsc --noEmit only
npm run test          # Vitest unit tests
npm run test:watch    # Vitest watch mode
npm run lint          # ESLint over src/ and tests/
```

### Project structure

```
src/
├── background/       # service worker - tab management, message routing
├── content/          # content script, floating UI, field detection, AI injector
├── options/          # settings page (React)
├── shared/           # types, storage, prompt builder, validation
├── styles/           # global CSS
└── manifest.ts       # Manifest V3 declaration
```

---

## Stack

| Layer | Technology |
|---|---|
| Extension platform | Chrome Manifest V3 |
| UI | React 18 + TypeScript 5 (strict) |
| Build | Vite 5 + `@crxjs/vite-plugin` 2.x |
| Testing | Vitest + jsdom |
| Linting | ESLint + `@typescript-eslint` |

---

## License

[MIT](LICENSE) - provided as-is, no warranties of any kind.
