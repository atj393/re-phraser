# Store Submission Checklist

A practical final checklist for publishing Re-Phraser to the Chrome Web Store and Microsoft Edge Add-ons. Work top to bottom.

## Identity and version

- [ ] Extension name is **Re-Phraser** (manifest `name`).
- [ ] Version is **1.0.0** and consistent across `package.json`, the generated `manifest.json`, `CHANGELOG.md`, `README.md`, and the store listing docs.
- [ ] Manifest description is accurate and end-user friendly (no "no automation" claim, since the extension does drive your AI chat tab).

## Icons

- [ ] `src/assets/icon-source.png` is the canonical source artwork (1024x1024).
- [ ] Generated icons exist at 16, 32, 48, and 128 px (`npm run icons`).
- [ ] Icons render correctly in the toolbar, the extensions management page, the options header, and the in-page toolbar.
- [ ] `docs/assets/re-phraser-icon-128.png` exists and the README hero image resolves on GitHub.

## Build and package

- [ ] `npm run release:check` passes (typecheck, test, lint, build).
- [ ] `npm run package:chrome` produced `releases/re-phraser-v1.0.0-chrome.zip`.
- [ ] `npm run package:edge` produced `releases/re-phraser-v1.0.0-edge.zip`.
- [ ] Each ZIP has `manifest.json` at its root.
- [ ] Each ZIP contains the runtime PNG icons.
- [ ] Each ZIP contains **no** source maps (`*.map`), **no** `node_modules`, **no** tests, **no** TypeScript sources, **no** `docs/`, and **no** `icon-source.png`.

## Screenshots (must be real)

- [ ] Captured from the **real** extension per `screenshot-plan.md` (1280x800).
- [ ] Clean setup screen, three-mode toolbar, suggestion preview, recovery card, settings screen.
- [ ] All sensitive or private text removed/blurred (no real messages, names, emails, tokens, or AI conversation URLs).
- [ ] **Do not** use mockups or fabricated screenshots.

## Store listing content

- [ ] Chrome listing copy from `chrome-web-store-listing.md`.
- [ ] Edge listing copy from `microsoft-edge-addons-listing.md`.
- [ ] Short description within Chrome's 132-character limit.
- [ ] No inflated claims ("free forever", "unlimited", "works with every AI chat", guaranteed compatibility, affiliation/endorsement).
- [ ] Store availability shown as "Coming soon" anywhere a live URL does not yet exist.

## Privacy and permissions

- [ ] Privacy policy published and reachable; update the placeholder URL `https://github.com/atj393/local-rephraser/blob/main/docs/privacy-policy.md` to the final path.
- [ ] Privacy disclosure form answers match `privacy-disclosure.md` (no data sold, no unrelated use).
- [ ] Permission justifications match `permission-justifications.md` and the actual manifest (`storage`, `tabs`, `clipboardWrite`, content script on all sites; no `host_permissions`, no `activeTab`, no `clipboardRead`).
- [ ] Support URL set to `https://github.com/atj393/local-rephraser/issues`.

## Manual test pass (real browser)

- [ ] Fresh install opens the options page.
- [ ] Saving a valid AI chat URL works; "Save and open AI chat" opens/focuses the tab.
- [ ] Selecting all text shows Quick / Normal / Formal **immediately**.
- [ ] Each mode sends to the AI chat, returns a suggestion, and Apply / Cancel work.
- [ ] Missing-URL recovery card appears with Open settings.
- [ ] Unreachable-chat recovery card appears with Open AI chat / Open settings and does not duplicate tabs.
- [ ] Works in a plain textarea and at least one rich editor (for example Gmail or LinkedIn).

## Upload and post-upload verification

- [ ] Upload the correct ZIP to each store (Chrome ZIP to Chrome, Edge ZIP to Edge).
- [ ] Fill in privacy practices/data-use forms truthfully.
- [ ] After review approval, replace "Coming soon" in `README.md` and listings with the live store URLs.
- [ ] Tag/release in GitHub only when you are ready (not done automatically by these scripts).
- [ ] Re-test the published extension after it goes live.

## Reminder

Screenshots must be captured from the real, running extension. Do not generate or submit fake product screenshots.
