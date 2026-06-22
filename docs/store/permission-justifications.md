# Permission Justifications

This document explains every permission Re-Phraser declares in its Manifest V3 `manifest.json`, in plain English, for store reviewers and users. Re-Phraser requests only what it uses.

## Declared permissions

### `storage`
Saves your settings - About Me, Global Prompt, Avoid These Things, and your AI chat URL - in the browser's extension storage so they persist between sessions and can sync across your own devices via your browser account. No settings are sent anywhere else.

### `tabs`
Lets the extension find, open, and focus your configured AI chat tab, and avoid opening duplicate tabs. When you choose a rewrite mode, Re-Phraser needs to locate (or open) that tab to deliver the prompt and bring back the reply. It also powers the "Open AI chat" recovery action and the "Save and open AI chat" button in settings.

### `clipboardWrite`
Copies the generated rewrite prompt to your clipboard as a **manual paste fallback** in case automatic sending to the AI chat is unavailable. This lets you paste the prompt into your chat yourself if needed. The extension does not read your clipboard.

## Host access

### Content script on all sites (`<all_urls>` in `content_scripts.matches`)
Editable fields exist on a wide range of websites (email, messaging, forms, document editors, and more), and Re-Phraser cannot know in advance where you will want to rewrite text. The content script must therefore be allowed to run on the pages where you type, so the in-page toolbar can appear when you select text.

On a normal web page the content script only:
- renders Re-Phraser's own in-page toolbar and panel,
- reads the text you have selected when you trigger a rewrite, and
- (on your own AI chat tab) places the prompt and reads the reply the chat displays.

It makes **no network requests of its own** and runs **no remote code**.

## What is NOT requested

- **No `host_permissions`** are declared (no broad host-permission grants beyond the content-script match).
- **No `activeTab`** permission.
- **No `clipboardRead`** permission.
- **No `scripting`**, `webRequest`, `cookies`, `history`, `bookmarks`, `downloads`, or similar permissions.
- **No remote code**, no API host, and no analytics endpoints.

If a reviewer sees a permission in the manifest that is not justified here, treat it as a bug and please report it on [GitHub Issues](https://github.com/atj393/local-rephraser/issues).
