import type { BuildPromptInput, RewriteMode } from './types';

export const MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  quick:
    'Fix grammar and lightly rephrase. Keep close to the original. Keep the same length or shorter.',
  normal:
    'Rewrite naturally. Improve clarity, grammar, flow, and tone. Preserve meaning. Do not add new facts.',
  formal:
    'Rewrite professionally and politely. Suitable for workplace, official, broker, public office, or formal communication. Still natural, not overly corporate.',
};

export const MODE_LABELS: Record<RewriteMode, string> = {
  quick: 'Quick',
  normal: 'Normal',
  formal: 'Formal',
};

// Coerce null/undefined to '' without mutating the original.
// Defensive runtime guard - TypeScript types are strict, but callers
// from content scripts cross page boundaries where runtime types can diverge.
function safe(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value);
}

export function buildRewritePrompt(input: Readonly<BuildPromptInput>): string {
  const aboutMe = safe(input.aboutMe).trim();
  const globalPrompt = safe(input.globalPrompt).trim();
  const avoidPrompt = safe(input.avoidPrompt).trim();
  // Preserve internal newlines; only remove leading/trailing whitespace so
  // multi-line drafts are passed to the AI intact.
  const selectedText = safe(input.selectedText).replace(/^\s+|\s+$/g, '');
  // Fallback to normal if the caller somehow passes an unrecognized mode.
  const modeInstruction = MODE_INSTRUCTIONS[input.mode] ?? MODE_INSTRUCTIONS.normal;

  return [
    'You are my personal writing assistant.',
    '',
    'About me:',
    aboutMe || '(none)',
    '',
    'Global writing rules:',
    globalPrompt || '(none)',
    '',
    'Avoid:',
    avoidPrompt || '(none)',
    '',
    'Mode:',
    modeInstruction,
    '',
    'Task:',
    'Rewrite the text below.',
    '',
    'Output rules:',
    'Return only the rewritten text.',
    'Do not explain your changes.',
    'Do not include markdown.',
    'Do not include quotes around the final text.',
    'Do not add information that is not present in the original text.',
    '',
    'Text:',
    '"""',
    selectedText,
    '"""',
  ].join('\n');
}
