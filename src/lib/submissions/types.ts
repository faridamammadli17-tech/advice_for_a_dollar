import { type SafetyCategory } from '../safety/screen';

/**
 * The submission record.
 *
 * Two fields carry the publication rule and must never be confused:
 *   - `visibility`  — what the VISITOR asked for
 *   - `publicState` — what the OWNER granted
 *
 * Something appears publicly only when visibility is 'public' AND publicState
 * is 'approved'. Never query the archive on visibility alone. Phase 3 puts
 * that rule behind a single query function and a database view.
 */

export type Visibility = 'public' | 'private';
export type SubmissionStatus = 'pending' | 'answered' | 'deleted';
export type PublicState = 'not_requested' | 'in_review' | 'approved' | 'rejected';

export type SafetyFlag = {
  readonly flagged: boolean;
  readonly category: SafetyCategory | null;
  readonly matchedRuleIds: readonly string[];
  readonly screenedAt: string;
};

/**
 * The one follow-up exchange.
 *
 * Decision (NOTES.md): the visitor sends one follow-up and Farida sends one
 * final reply. That closes the conversation — it is not a chat. The spec's
 * original shape had no room for her reply, so `reply` and `repliedAt` were
 * added.
 */
export type FollowUp = {
  readonly body: string;
  readonly createdAt: string;
  readonly reply: string | null;
  readonly repliedAt: string | null;
};

export type Submission = {
  readonly id: string;
  /** The magic-link secret. 32 random bytes, base64url. Never derived from id. */
  readonly token: string;
  readonly body: string;
  readonly email: string | null;

  readonly visibility: Visibility;
  readonly status: SubmissionStatus;
  readonly publicState: PublicState;

  readonly safetyFlag: SafetyFlag | null;

  /** Hash only. The word itself is never stored, logged or displayed. */
  readonly secretWordHash: string;
  readonly secretWordSalt: string;

  /** Minor units (qəpik). 1 AZN is 100. Never a float. */
  readonly amountMinorUnits: number;
  readonly currency: 'AZN';

  readonly createdAt: string;
  readonly answeredAt: string | null;
  readonly answer: string | null;

  readonly followUp: FollowUp | null;

  /** Owner-assigned, once categories land in Phase 3. */
  readonly category: string | null;
};

/**
 * What a visitor actually sees through their magic link.
 *
 * The hash, the salt and the matched safety rule ids are deliberately absent:
 * this is the shape that crosses the wire to the browser, so anything not on
 * it cannot leak by accident.
 */
export type SubmissionView = {
  readonly token: string;
  readonly body: string;
  readonly visibility: Visibility;
  readonly status: SubmissionStatus;
  readonly publicState: PublicState;
  readonly createdAt: string;
  readonly answeredAt: string | null;
  readonly answer: string | null;
  readonly followUp: FollowUp | null;
  readonly amountMinorUnits: number;
  readonly currency: 'AZN';
};

export function toView(submission: Submission): SubmissionView {
  return {
    token: submission.token,
    body: submission.body,
    visibility: submission.visibility,
    status: submission.status,
    publicState: submission.publicState,
    createdAt: submission.createdAt,
    answeredAt: submission.answeredAt,
    answer: submission.answer,
    followUp: submission.followUp,
    amountMinorUnits: submission.amountMinorUnits,
    currency: submission.currency,
  };
}

/**
 * The longest problem and follow-up the server accepts, in characters.
 * Long enough for anything a person writes in one sitting; short enough that
 * nobody can fill the dashboard with megabytes of text.
 */
export const MAX_BODY_CHARS = 10_000;
export const MAX_FOLLOW_UP_CHARS = 5_000;
