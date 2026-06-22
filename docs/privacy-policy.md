# Re-Phraser Privacy Policy

**Last updated: June 22, 2026**

Re-Phraser is a personal productivity browser extension that helps you rewrite text you have already typed. This policy explains, in plain language, what the extension accesses, what it stores, and what it does not do.

Re-Phraser is **not** an AI provider and is **not** affiliated with any AI company.

## Summary

- Re-Phraser has **no backend server**, **no analytics**, and **no telemetry**.
- It has **no account system** and **no API-key field**.
- It does **not** sell or share your data, because it does not collect it.
- To rewrite text, it **sends your selected text to the AI chat you configured**, using that chat's normal website in your own signed-in tab. You choose what to send.

## What the extension accesses

- **The text you select** in an editable field, at the moment you choose Quick, Normal, or Formal. This text is placed into a rewrite request.
- **Your configured AI chat tab.** When you trigger a rewrite, the extension sends the request to your AI chat (for example ChatGPT, Claude, or Gemini) through that chat's web page in your own browser tab, and reads the reply it shows so it can present it to you as a suggestion.
- **Your settings**, which you enter yourself: About Me, Global Prompt, Avoid These Things, and the AI chat URL.

## What is stored

- **Your settings** are stored in your browser's extension storage (`chrome.storage.sync`, or local storage as a fallback). If you use browser sync, your browser may sync these settings across your own devices under your browser account.

That is all the extension stores.

## What is not stored

- The extension does **not** store the text you select.
- The extension does **not** store the AI's replies.
- The extension does **not** keep logs, usage statistics, analytics, or telemetry.
- The extension does **not** transmit your data to any server operated by Re-Phraser, because there is none.

## Third-party AI chat services

To produce a rewrite, your selected text is sent to the third-party AI chat you configured, through that service's normal website. That provider receives and processes your text under **its own terms of service and privacy policy**, which are outside Re-Phraser's control.

**You are responsible for deciding what content you send** to your chosen AI chat. Do not select content you are not comfortable sharing with that service. Re-Phraser does not bypass the provider's login; you must be signed in to your own account.

## Permissions

Re-Phraser requests only the permissions it uses: `storage` (save your settings), `tabs` (find, open, and focus your AI chat tab), `clipboardWrite` (copy the prompt as a manual fallback), and a content script that can run on the pages where you type so the in-page toolbar can appear. It declares no `host_permissions` and runs no remote code. See [Permission justifications](store/permission-justifications.md) for details.

## Children

Re-Phraser is a general-purpose writing tool and is not directed at children.

## Changes to this policy

If this policy changes, the "Last updated" date above will change. Material changes will be noted in the [Changelog](../CHANGELOG.md).

## Contact

Questions about privacy can be raised through [GitHub Issues](https://github.com/atj393/local-rephraser/issues). Please do not post passwords, private messages, AI conversation URLs, tokens, or other confidential content in a public issue.
