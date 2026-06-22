# Reviewer Test Instructions

These steps let a store reviewer exercise Re-Phraser end to end. Re-Phraser is a personal productivity extension and is **not affiliated with any AI provider**. It uses **your own signed-in AI chat session** - you will need access to a web-based AI chat (for example ChatGPT, Claude, or Gemini) to test the full flow.

## 1. First-install setup

1. Install/load the extension.
2. On install, the options (settings) page opens automatically. You can also reach it by right-clicking the toolbar icon and choosing the extension's options, or by clicking the gear button in the in-page toolbar.

## 2. Configure an AI chat URL

1. In a separate tab, open a web-based AI chat you have an account for and are signed in to.
2. Start a new conversation and send a short message such as "Hi" so the conversation has its own URL.
3. Copy that conversation URL from the browser address bar.
4. Paste it into the **AI chat URL** field in Re-Phraser settings and save.

Tip: you can use the **Save and open AI chat** button in settings to confirm the URL opens and focuses the correct tab.

## 3. Try the three rewrite modes

1. Go to any page with an editable text field (an email compose box, a comment box, a plain `<textarea>` test page, etc.).
2. Type a rough sentence, for example: `hey just checking if we are still on for tmrw`.
3. Select **all** of the text. A small toolbar appears immediately with three buttons:
   - **Quick** - light cleanup, stays close to the original.
   - **Normal** - clearer, more natural rewrite.
   - **Formal** - polished, professional tone.
4. Click a mode. Re-Phraser sends the request to your AI chat tab, waits for the reply, and shows it as a **suggestion**.
5. Click **Apply** to replace the field text, or **Cancel** to leave it unchanged.

Keep the AI chat tab open and signed in while testing.

## 4. Test the recovery states

**Missing URL recovery:**
1. Open settings and clear the AI chat URL (leave it blank), then save.
2. Select text in a field and choose any mode.
3. Expected: a **"Set up your AI chat"** card with an **Open settings** button (no rewrite is attempted).

**Unreachable chat recovery:**
1. Save a valid AI chat URL again, but close the AI chat tab.
2. Select text and choose a mode.
3. Expected: a **"Could not reach your AI chat"** card with **Open AI chat** and **Open settings** buttons. Clicking **Open AI chat** opens/focuses the chat tab (reusing it, not duplicating it). After it loads, return to the page and choose a mode again.

## 5. Notes for reviewers

- Re-Phraser does not provide AI itself and includes no API key. It relies entirely on the reviewer's own AI chat session.
- If a rewrite does not return, confirm the AI chat tab is open, signed in, on the saved conversation, and not rate-limited, then try again.
- The extension makes no network requests of its own and contains no analytics or remote code.
