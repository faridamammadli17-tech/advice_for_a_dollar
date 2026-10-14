import { type VisitorSubmission } from '../api/client';
import { type Visibility } from '../submissions/types';

/**
 * PREVIEW ONLY: pretend submissions kept in the browser.
 *
 * The design preview is a static page built with VITE_PREVIEW_ROUTER=hash
 * (see App.tsx) and has no server behind it, so nothing can really be sent
 * or answered there. To let Farida walk the whole flow on the preview, this
 * keeps a pretend submission in localStorage: the sending step stores it,
 * the magic-link page reads it back, and a preview-only button shows the
 * page as it looks once an answer is ready.
 *
 * The pretend "answer" is a labelled stand-in, never advice: nothing on this
 * site is ever generated, and the stand-in says so in its first line.
 *
 * `IS_PREVIEW` is false in every real build, so none of this is reachable on
 * the real site, where the server creates, screens and answers everything.
 */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW_ROUTER === 'hash';

const KEY = (token: string) => `afad:preview:${token}`;

type Stored = VisitorSubmission & { deleted?: boolean };

const STAND_IN_REPLY =
  'PREVIEW ONLY. This is where Farida’s reply appears. Nothing is written here by anyone in the preview; these lines only show what the page looks like once an answer is ready.';

function read(token: string): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY(token));
    return raw === null ? null : (JSON.parse(raw) as Stored);
  } catch {
    return null;
  }
}

function write(token: string, value: Stored): void {
  try {
    window.localStorage.setItem(KEY(token), JSON.stringify(value));
  } catch {
    // Private browsing can refuse; the preview simply forgets.
  }
}

export function previewCreate(input: {
  body: string;
  visibility: Visibility;
  amountMinorUnits: number;
}): string {
  const token = `preview-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  write(token, {
    body: input.body,
    visibility: input.visibility,
    status: 'pending',
    publicState: input.visibility === 'public' ? 'in_review' : 'not_requested',
    createdAt: new Date().toISOString(),
    answeredAt: null,
    answer: null,
    followUp: null,
    amountMinorUnits: input.amountMinorUnits,
    currency: 'AZN',
  });
  return token;
}

/** `deleted` for a pretend submission that was deleted; null for an unknown token. */
export function previewGet(token: string): VisitorSubmission | 'deleted' | null {
  const stored = read(token);
  if (stored === null) return null;
  if (stored.deleted === true) return 'deleted';
  return stored;
}

export function previewMarkAnswered(token: string): void {
  const stored = read(token);
  if (stored === null) return;
  write(token, {
    ...stored,
    status: 'answered',
    answeredAt: new Date().toISOString(),
    answer: STAND_IN_REPLY,
  });
}

export function previewFollowUp(token: string, body: string): void {
  const stored = read(token);
  if (stored === null) return;
  write(token, {
    ...stored,
    followUp: { body, createdAt: new Date().toISOString(), reply: null, repliedAt: null },
  });
}

export function previewDelete(token: string): void {
  const stored = read(token);
  if (stored === null) return;
  write(token, { ...stored, deleted: true });
}
