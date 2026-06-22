# Security Policy

Re-Phraser is a Manifest V3 browser extension. It has no backend server, no analytics, and no remote code. Most issues are ordinary bugs - please report those on [GitHub Issues](https://github.com/atj393/local-rephraser/issues).

This document covers **security vulnerabilities** specifically.

## Reporting a vulnerability

If you believe you have found a security vulnerability, please report it **privately** rather than opening a public issue, so it can be addressed before details are public.

> **Private reporting contact:** _Not yet configured._ The repository owner must add a private security contact here before public release - for example, by enabling **GitHub Private Vulnerability Reporting** for this repository (Settings → Security → Private vulnerability reporting) or by listing a dedicated security email address.
>
> Until a private channel is provided, do not post exploit details in public issues. Open a minimal public issue asking the maintainer to enable a private reporting channel, without including the vulnerability details.

When a private channel is available, please include:

- A clear description of the issue and its impact
- Step-by-step reproduction instructions
- The extension version and browser version
- Any relevant configuration

## Please do not include sensitive data

When reporting, do **not** include:

- Passwords, login details, or tokens
- Private or confidential message content
- Your AI conversation URLs
- Any other personal or confidential information

## Scope

In scope:

- The Re-Phraser extension code in this repository (content script, background service worker, options page, shared utilities)
- The packaged extension distributed to the Chrome Web Store and Microsoft Edge Add-ons

Out of scope:

- Third-party AI chat websites you configure (report those to the respective provider)
- Your browser, operating system, or unrelated extensions
- Issues that require a compromised device or a malicious extension already installed

## Response

This is a best-effort, personal project. There is no guaranteed response time or bug-bounty program. Verified, reproducible reports will be prioritized.
