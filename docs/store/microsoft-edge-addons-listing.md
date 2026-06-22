# Microsoft Edge Add-ons Listing (copy-paste ready)

Version: 1.0.1. Replace placeholder URLs after the repository's public path and store listing are confirmed. Do not invent ratings, user counts, awards, testimonials, or compatibility claims.

---

## Product name

```
Re-Phraser: AI Text Rewriter
```

## Short description

```
Rewrite selected text with your configured AI chat. Choose Quick, Normal, or Formal, then review and apply each suggestion.
```

## Category

```
Productivity
```

## Supported languages

```
English
```

## Detailed description

```
Re-Phraser helps you rewrite text right where you type it, without switching tabs or copying things around by hand.

Select all the text in a message box, choose a tone - Quick, Normal, or Formal - and Re-Phraser sends a personalized rewrite request to your own AI chat tab (one you have already opened and signed in to). It brings the reply back as a suggestion so you can review it and apply it only if you like it.

You stay in control of every change. Nothing is applied to your text until you click Apply.

HOW IT WORKS
1. Open your preferred AI chat (for example ChatGPT, Claude, or Gemini), start a conversation, and copy its URL.
2. Save that URL in Re-Phraser settings. Re-Phraser reuses that same chat tab instead of opening new ones.
3. Select all the text in any editable field and choose Quick, Normal, or Formal.
4. Review the suggestion and click Apply, or Cancel to keep your original.

THE THREE MODES
- Quick: light cleanup and small rephrasing, staying close to your original.
- Normal: clearer, more natural writing that preserves your meaning.
- Formal: polished, professional writing without sounding robotic.

PERSONALIZATION
Three optional settings shape every rewrite: About Me (how you like to write), Global Prompt (rules for every rewrite), and Avoid These Things (what to never do).

IF SOMETHING IS MISSING
- No saved chat URL: Re-Phraser shows a short setup card with an Open settings button.
- Chat tab closed or unreachable: Re-Phraser offers Open AI chat and Open settings, and reuses your existing chat tab instead of duplicating it.

PRIVACY
- No Re-Phraser server, no analytics, no telemetry.
- No account and no API-key field.
- Your settings are stored in your browser. Selected text and AI replies are not stored by the extension.
- To rewrite text, your selected text is sent to the AI chat you configured, through that chat's normal website in your own signed-in tab. That provider processes your text under its own terms. You decide what to send.

IMPORTANT
Re-Phraser is a personal productivity extension. It is not an AI provider and is not affiliated with or endorsed by any AI company. It works with text-based AI chat sites you configure; compatibility with every website or editor is not guaranteed.

Open source under the MIT License. Home and support: https://github.com/atj393/local-rephraser
```

## Permissions justification

```
storage: save the user's settings (About Me, Global Prompt, Avoid These Things, AI chat URL).
tabs: find, open, and focus the user's configured AI chat tab and avoid duplicate tabs.
clipboardWrite: copy the generated prompt to the clipboard as a manual paste fallback.
Content script on all sites: editable fields exist on many websites, so the in-page toolbar must be able to appear where the user types. The script makes no network requests of its own and runs no remote code.
No host_permissions, no remote code, no analytics.
```

Full detail: docs/store/permission-justifications.md

## Privacy policy URL (placeholder)

```
https://github.com/atj393/local-rephraser/blob/main/docs/privacy-policy.md
```

## Support URL

```
https://github.com/atj393/local-rephraser/issues
```

## Build the release ZIP

```bash
npm run package:edge
# -> releases/re-phraser-v1.0.1-edge.zip
```

## Assets still required before submission

- Real screenshots per docs/store/screenshot-plan.md (1280x800), sensitive text removed.
- Store icon (128x128) is generated at src/assets/icons/icon128.png.
- Edge requires a privacy policy URL because the extension handles user text; use the placeholder above until the public URL is final.
