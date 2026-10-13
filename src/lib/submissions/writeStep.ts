import { visitorApi } from '../api/client';
import { MAX_BODY_CHARS } from './types';

/**
 * What the Write step checks before anyone may move on.
 *
 * ONE function, called from both places that let someone leave the writing
 * box: the "Continue" button on step 1 of /ask and "Get advice" on the home
 * page (which skips step 1 and lands on the secret word). The two paths can
 * never drift apart because there is only one path.
 *
 * In order:
 *   1. length: at least 20 characters of real text, and under the maximum;
 *   2. the safety screen on the server, which catches someone writing about
 *      self-harm or danger and sends them to the crisis screen instead of
 *      onwards. Nothing is created and nothing is charged on that path.
 *
 * `api.createSubmission` screens again regardless, so this is the first
 * gate, not the only one.
 */
export type WriteOutcome =
  /** Fine to go on to the secret word. */
  | { readonly kind: 'ok' }
  /** Stay where you are and show this message by the box. */
  | { readonly kind: 'problem'; readonly message: string }
  /** Show the crisis screen. Create nothing, charge nothing. */
  | { readonly kind: 'flagged'; readonly category: string | null };

export const MIN_BODY_CHARS = 20;

export async function checkWriting(text: string): Promise<WriteOutcome> {
  if (text.trim().length < MIN_BODY_CHARS) {
    return {
      kind: 'problem',
      message: 'A little more to go on would help. Even a few sentences.',
    };
  }
  if (text.length > MAX_BODY_CHARS) {
    return {
      kind: 'problem',
      message: `That is longer than can be read in one sitting. Please keep it under ${MAX_BODY_CHARS.toLocaleString('en')} characters.`,
    };
  }

  const result = await visitorApi.screen(text);
  if (!result.ok) {
    return {
      kind: 'problem',
      message: 'Could not reach the server. Your words are saved — try again in a moment.',
    };
  }
  if (result.data.flagged) {
    return { kind: 'flagged', category: result.data.category };
  }
  return { kind: 'ok' };
}

/**
 * The router state the home page sends along when its text has already
 * passed `checkWriting`, so /ask may open on the secret word. Anything else
 * (a direct visit, a typed address, a reload) starts at step 1.
 */
export const SCREENED_STATE = { screened: true } as const;

export function cameScreened(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { screened?: unknown }).screened === true
  );
}
