# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Changed
- Rebranded from **Personal Rewriter** to **Re-Phraser** across all source files, UI, manifest, and documentation.
- Extension icon (toolbar, options page header, floating toolbar logo) now uses the `rp` pixel-art logo.

---

## [0.2.0] - 2026-04-29

### Added
- **Auto-inject workflow** - prompt is injected directly into the open AI chat tab; no manual copy-paste required.
- **Auto-fetch response** - extension polls the AI tab for the reply and brings it back to the source page automatically.
- **Preview panel** - rewritten text is shown in a scrollable preview box before applying, so you can read and compare.
- **Spinner / loading state** - panel shows a spinner and mode label while waiting for the AI response.
- **Source tab stays focused** - AI tab is opened and used in the background; your original tab never loses focus.
- **First-install onboarding** - options page opens automatically on install and shows a numbered setup guide.
- **Better error messages** - "Could not reach AI tab" now advises closing and reopening the tab.
- **Extension icon** - `rp` pixel-art logo used in toolbar, options page header, and floating toolbar.
- **Icon files** added at 16 × 16, 32 × 32, 48 × 48, and 128 × 128 for Chrome manifest and `web_accessible_resources`.

### Changed
- Floating toolbar redesigned: black → white frosted-glass pill with SVG icons per mode (⚡ Quick, ✏ Normal, 💼 Formal) and a gear settings button.
- Options page welcome card added with accent border and numbered CSS-counter step badges.

### Removed
- Manual **Copy Prompt**, **Open AI Chat**, and **Copy & Open Chat** buttons replaced by the single-click auto-inject flow.
- **Apply Clipboard Result** button replaced by the **Apply** button in the AI-response preview panel.

---

## [0.1.0] - 2026-04-29

### Added
- Initial release.
- Floating rewrite button on any editable field when full text is selected.
- Three rewrite modes: **Quick**, **Normal**, **Formal**.
- Configurable **About Me**, **Global Prompt**, and **Avoid These Things** prompts.
- **Copy Prompt**, **Open AI Chat**, and **Copy & Open Chat** actions.
- **Apply Clipboard Result** - replaces field content with the AI reply from clipboard.
- Confirmation dialog when AI result is significantly longer than the original.
- Support for `<textarea>`, `<input>`, and `contenteditable` fields (Gmail, WhatsApp Web, LinkedIn, etc.).
- Options page with all settings, accessible from the toolbar icon.
- `chrome.storage.sync` persistence with `chrome.storage.local` fallback.
- Per-site disable list (hostname-based).
- Dark mode support.
- Keyboard accessibility: Escape closes the panel, Tab cycles through buttons.
- SPA navigation detection - panel closes automatically on route change.
