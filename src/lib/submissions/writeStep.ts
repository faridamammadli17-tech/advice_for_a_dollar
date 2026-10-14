import { visitorApi } from '../api/client';
import { screen } from '../safety/screen';
import { MAX_BODY_CHARS } from './types';

/**
 * What the Write step checks before anyone may move on.
 *
 * ONE function, the only way out of the writing box: "Get advice" on the
 * home page calls it, and the box with the rest of the flow (secret word,
 * private or public, pay) cannot open unless it says ok. A reload with the
 * box open calls it again before the box may reopen.
 *
 * In order:
 *   1. length: at least 20 characters of real text, and under the maximum;
 *   2. the safety screen on the server, which catches someone writing about
 *      self-harm or danger and sends them to the crisis screen instead of
 *      onwards. Nothing is created and nothing is charged on that path.
 *
 * `api.createSubmission` screens again regardless, so this is the first
 * gate, not the only one. The messages themselves live in the language
 * dictionaries (ui.*.ts, `write`); this returns which one.
 */
export type WriteOutcome =
  /** Fine to go on to the secret word. */
  | { readonly kind: 'ok' }
  /** Stay where you are and show this message by the box. */
  | { readonly kind: 'problem'; readonly reason: 'too-short' | 'too-long' | 'unreachable' }
  /** Show the crisis screen. Create nothing, charge nothing. */
  | { readonly kind: 'flagged'; readonly category: string | null };

export const MIN_BODY_CHARS = 20;

export async function checkWriting(text: string): Promise<WriteOutcome> {
  if (text.trim().length < MIN_BODY_CHARS) {
    return { kind: 'problem', reason: 'too-short' };
  }
  if (text.length > MAX_BODY_CHARS) {
    return { kind: 'problem', reason: 'too-long' };
  }

  const verdict = await screenOnServer(text);
  if (verdict === null) {
    return { kind: 'problem', reason: 'unreachable' };
  }
  if (verdict.flagged) {
    return { kind: 'flagged', category: verdict.category };
  }
  return { kind: 'ok' };
}

/**
 * The server's verdict, or null when it cannot be reached.
 *
 * The design preview (a static page built with VITE_PREVIEW_ROUTER=hash, see
 * App.tsx) has no server at all, so there the same rules run in the browser:
 * `screen` is the very function the server's /api/screen route calls, on
 * the same cleaned text. That flag is never set for a real build, and on
 * the real site nothing can be created without the server screening it
 * again on submit regardless.
 */
async function screenOnServer(
  text: string,
): Promise<{ flagged: boolean; category: string | null } | null> {
  if (import.meta.env.VITE_PREVIEW_ROUTER === 'hash') {
    return screen(text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim());
  }
  const result = await visitorApi.screen(text);
  return result.ok ? result.data : null;
}
