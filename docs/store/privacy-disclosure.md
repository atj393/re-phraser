# Privacy Disclosure (Store Submission)

This is the concise privacy disclosure for the Chrome Web Store and Microsoft Edge Add-ons submission forms. The full public policy is in [docs/privacy-policy.md](../privacy-policy.md).

## Single purpose

Re-Phraser rewrites text the user has selected in an editable field by sending a personalized rewrite request to the user's own configured AI chat tab and returning the reply for the user to review and apply.

## Data handling summary

- **Re-Phraser has no backend server, no analytics, and no telemetry.** It collects no usage data.
- **No account and no API key.** There is nothing to sign in to inside the extension.
- **Settings are stored in browser extension storage** (`chrome.storage.sync`, local fallback): About Me, Global Prompt, Avoid These Things, and the AI chat URL. These may sync across the user's own devices via the browser account.
- **Selected text and AI replies are not stored** by the extension. They are used in the moment to build the request and show the suggestion.
- **Selected text is sent to the third-party AI chat the user configured**, through that chat's normal website in the user's signed-in tab. That provider processes the text under its own terms and privacy policy. The user decides what to send.

## Data use disclosures (typical store form answers)

- Is data sold to third parties? **No.**
- Is data used or transferred for purposes unrelated to the item's single purpose? **No.**
- Is data used or transferred to determine creditworthiness or for lending? **No.**
- Does the extension collect personally identifiable information for the developer? **No - the developer has no server and receives nothing.**

## Permissions

See [permission-justifications.md](permission-justifications.md). Declared: `storage`, `tabs`, `clipboardWrite`, and a content script matching all sites so the in-page toolbar can appear where the user types. No `host_permissions`, no remote code.

## Third-party processing

Re-Phraser does not claim that third-party AI providers avoid processing the user's text. When the user triggers a rewrite, the selected text is delivered to the chosen AI chat and is processed by that provider. Users are responsible for choosing what content to send.

## Privacy policy URL (placeholder)

`https://github.com/atj393/local-rephraser/blob/main/docs/privacy-policy.md`

Replace with the final published URL after the repository's public path is confirmed.
