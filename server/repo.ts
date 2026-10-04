import { type Database } from './db';
import { createId, createToken, hashSecret, verifySecret } from './crypto';

/**
 * The data layer.
 *
 * One rule shapes the whole file: **public reads go through the
 * `public_submissions` view, admin reads go through the table.** There is no
 * function here that reads the table for public display, so there is nothing
 * to misuse.
 *
 * `db.ts` hard-codes the publication rule in the view itself, so even if a
 * query here were written carelessly it still could not return a private,
 * unreviewed, flagged or deleted row.
 */

export type Visibility = 'public' | 'private';
export type Status = 'pending' | 'answered' | 'deleted';
export type PublicState = 'not_requested' | 'in_review' | 'approved' | 'rejected';

export type PublicProblem = {
  id: string;
  body: string;
  answer: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
};

export type AdminRow = {
  id: string;
  body: string;
  visibility: Visibility;
  status: Status;
  public_state: PublicState;
  safety_flagged: number;
  safety_category: string | null;
  /** 1 when a screening rule matched below the flag threshold. A nudge to read carefully. */
  safety_noticed: number;
  amount_minor_units: number;
  currency: string;
  category: string | null;
  created_at: string;
  answered_at: string | null;
  answer: string | null;
  follow_up_body: string | null;
  follow_up_reply: string | null;
};

export type CreateInput = {
  body: string;
  secretWord: string;
  visibility: Visibility;
  amountMinorUnits: number;
  email: string | null;
  transactionId: string | null;
  safety: { flagged: boolean; category: string | null; matchedRuleIds: readonly string[] };
};

/** Email retention, per Farida's decision: six months, then purged. */
const EMAIL_RETENTION_DAYS = 183;

export async function createSubmission(db: Database, input: CreateInput) {
  // A flagged submission must never be created as a normal, payable,
  // publishable record. The API layer refuses first; this is the backstop.
  if (input.safety.flagged) {
    throw new Error('Refusing to create a submission that failed safety screening.');
  }

  const now = new Date();
  const digest = await hashSecret(input.secretWord);
  const id = createId();
  const token = createToken();

  const purgeAfter =
    input.email === null
      ? null
      : new Date(now.getTime() + EMAIL_RETENTION_DAYS * 86_400_000).toISOString();

  db.prepare(
    `INSERT INTO submissions (
       id, token, body, email, email_purge_after,
       visibility, status, public_state,
       safety_flagged, safety_category, safety_rules, screened_at,
       secret_word_hash, secret_word_salt,
       amount_minor_units, currency, transaction_id,
       category, created_at
     ) VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?)`,
  ).run(
    id,
    token,
    input.body.trim(),
    input.email,
    purgeAfter,
    input.visibility,
    'pending',
    // Asking is not approval. A public request enters review; a private one
    // never enters the review pipeline at all.
    input.visibility === 'public' ? 'in_review' : 'not_requested',
    0,
    input.safety.category,
    JSON.stringify(input.safety.matchedRuleIds),
    now.toISOString(),
    digest.hash,
    digest.salt,
    input.amountMinorUnits,
    'AZN',
    input.transactionId,
    null,
    now.toISOString(),
  );

  return { id, token };
}

/* ----------------------------------------------------------- public reads */

/** THE public listing. Reads the view, never the table. */
export function listPublic(
  db: Database,
  options: { category?: string; sort?: 'newest' | 'oldest'; limit?: number } = {},
): PublicProblem[] {
  const { category, sort = 'newest', limit = 100 } = options;
  const order = sort === 'newest' ? 'DESC' : 'ASC';

  if (category !== undefined && category !== 'all') {
    return db
      .prepare(
        `SELECT * FROM public_submissions WHERE category = ? ORDER BY created_at ${order} LIMIT ?`,
      )
      .all(category, limit) as PublicProblem[];
  }
  return db
    .prepare(`SELECT * FROM public_submissions ORDER BY created_at ${order} LIMIT ?`)
    .all(limit) as PublicProblem[];
}

/** A single public problem, by public id. Reads the view, never the table. */
export function getPublic(db: Database, id: string): PublicProblem | null {
  const row = db.prepare('SELECT * FROM public_submissions WHERE id = ?').get(id);
  return (row as PublicProblem | undefined) ?? null;
}

/* -------------------------------------------------------- visitor by token */

export function getByToken(db: Database, token: string) {
  return db.prepare('SELECT * FROM submissions WHERE token = ?').get(token) as
    | Record<string, unknown>
    | undefined;
}

export function addFollowUp(db: Database, token: string, body: string): boolean {
  const row = getByToken(db, token);
  if (row === undefined) return false;
  if (row.status !== 'answered') return false;
  if (row.follow_up_body !== null) return false; // exactly one, ever

  db.prepare('UPDATE submissions SET follow_up_body = ?, follow_up_at = ? WHERE token = ?').run(
    body.trim(),
    new Date().toISOString(),
    token,
  );
  return true;
}

/**
 * Delete through the magic link.
 *
 * Destroys the text, the answer, the follow-up and the email, and forgets
 * the secret word's hash and salt, which protect nothing once recovery skips
 * the row. Keeps a tombstone carrying the amount, the dates and the
 * transaction id, because refunds and accounting need them — and a refund
 * must be possible from the transaction alone, with no contact details.
 */
export function deleteByToken(db: Database, token: string): boolean {
  const result = db
    .prepare(
      `UPDATE submissions
          SET body = '', answer = NULL, email = NULL, email_purge_after = NULL,
              follow_up_body = NULL, follow_up_reply = NULL,
              follow_up_at = NULL, follow_up_reply_at = NULL,
              secret_word_hash = '', secret_word_salt = '',
              safety_rules = NULL, category = NULL,
              status = 'deleted', public_state = 'rejected'
        WHERE token = ?`,
    )
    .run(token);
  return result.changes > 0;
}

/* -------------------------------------------------------------- recovery */

/** How far back a lost-link search may look, and how wide one window may be. */
const RECOVERY_MAX_AGE_MS = 365 * 86_400_000;
const RECOVERY_MAX_WINDOW_MS = 92 * 86_400_000;
/**
 * The most candidates one search will check. The bound exists so that neither
 * the cost of a search nor the time it takes can be chosen by the requester:
 * before it, a window of "1970 to 2100" tested a guessed word against every
 * submission ever made.
 */
const RECOVERY_MAX_CANDIDATES = 48;

function clampTime(value: string | undefined, fallback: number, now: number): number {
  if (value === undefined) return fallback;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : Math.min(parsed, now);
}

/**
 * Lost-link recovery.
 *
 * Returns the token ONLY on a genuine match. The caller must return an
 * identical response either way — this function deliberately gives the caller
 * nothing it could accidentally use to vary its wording.
 *
 * Candidates are narrowed by the date window first (at most three months
 * wide and a year back, whatever was asked), newest first, and capped. Every
 * candidate is then checked, in parallel, with no early return, so the time
 * taken does not say where in the list the match was. There is no global
 * "does this secret word exist" lookup, because a salted hash cannot support
 * one and building one would mean storing something weaker.
 */
export async function recoverToken(
  db: Database,
  secretWord: string,
  window: { from?: string; to?: string },
  email: string | null,
): Promise<string | null> {
  const now = Date.now();
  const to = clampTime(window.to, now, now);
  const from = Math.max(
    clampTime(window.from, to - RECOVERY_MAX_WINDOW_MS, now),
    to - RECOVERY_MAX_WINDOW_MS,
    now - RECOVERY_MAX_AGE_MS,
  );

  const rows = (
    email === null
      ? db
          .prepare(
            `SELECT token, secret_word_hash, secret_word_salt FROM submissions
              WHERE created_at >= ? AND created_at <= ? AND status <> 'deleted'
              ORDER BY created_at DESC LIMIT ?`,
          )
          .all(new Date(from).toISOString(), new Date(to).toISOString(), RECOVERY_MAX_CANDIDATES)
      : db
          .prepare(
            `SELECT token, secret_word_hash, secret_word_salt FROM submissions
              WHERE email = ? AND status <> 'deleted'
              ORDER BY created_at DESC LIMIT ?`,
          )
          .all(email, RECOVERY_MAX_CANDIDATES)
  ) as { token: string; secret_word_hash: string; secret_word_salt: string }[];

  const matches = await Promise.all(
    rows.map((row) =>
      verifySecret(secretWord, { hash: row.secret_word_hash, salt: row.secret_word_salt }),
    ),
  );
  const index = matches.indexOf(true);
  return index === -1 ? null : (rows[index]?.token ?? null);
}

/* ----------------------------------------------------------------- admin */

/**
 * The admin listing.
 *
 * Named columns, never SELECT *. The visitor's magic-link token, the
 * secret-word hash and salt, the email address and the screening details have
 * no use on the dashboard, so they are not sent to the browser at all. What
 * the browser never receives cannot leak from it. (Email is used for one thing
 * only, the "your answer is ready" note, and that is sent by the server.)
 */
export function listForAdmin(db: Database, limit = 200): AdminRow[] {
  return db
    .prepare(
      `SELECT id, body, visibility, status, public_state,
              safety_flagged, safety_category,
              CASE WHEN safety_rules IS NOT NULL AND safety_rules <> '[]' THEN 1 ELSE 0 END
                AS safety_noticed,
              amount_minor_units, currency,
              category, created_at, answered_at, answer,
              follow_up_body, follow_up_reply
         FROM submissions
        ORDER BY created_at DESC
        LIMIT ?`,
    )
    .all(limit) as AdminRow[];
}

export function answerSubmission(db: Database, id: string, answer: string): boolean {
  const result = db
    .prepare(
      `UPDATE submissions SET answer = ?, answered_at = ?, status = 'answered'
        WHERE id = ? AND status <> 'deleted'`,
    )
    .run(answer, new Date().toISOString(), id);
  return result.changes > 0;
}

export function replyToFollowUp(db: Database, id: string, reply: string): boolean {
  const result = db
    .prepare(
      `UPDATE submissions SET follow_up_reply = ?, follow_up_reply_at = ?
        WHERE id = ? AND follow_up_body IS NOT NULL AND follow_up_reply IS NULL`,
    )
    .run(reply, new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Approve for publication.
 *
 * Refuses on two grounds that are not negotiable: a safety-flagged submission
 * can never be published, and a submission the visitor asked to keep private
 * can never be published no matter who clicks what.
 */
export function approveForPublication(db: Database, id: string): boolean {
  const result = db
    .prepare(
      `UPDATE submissions SET public_state = 'approved'
        WHERE id = ?
          AND visibility = 'public'
          AND safety_flagged = 0
          AND status <> 'deleted'`,
    )
    .run(id);
  return result.changes > 0;
}

export function rejectForPublication(db: Database, id: string): boolean {
  const result = db
    .prepare(`UPDATE submissions SET public_state = 'rejected' WHERE id = ? AND status <> 'deleted'`)
    .run(id);
  return result.changes > 0;
}

export function setCategory(db: Database, id: string, category: string | null): boolean {
  const result = db
    .prepare(`UPDATE submissions SET category = ? WHERE id = ? AND status <> 'deleted'`)
    .run(category, id);
  return result.changes > 0;
}

export function setSafetyFlag(db: Database, id: string, flagged: boolean, category: string | null) {
  // Flagging forces the submission out of the public pipeline immediately.
  const result = db
    .prepare(
      `UPDATE submissions
          SET safety_flagged = ?, safety_category = ?,
              public_state = CASE WHEN ? = 1 THEN 'rejected' ELSE public_state END
        WHERE id = ?`,
    )
    .run(flagged ? 1 : 0, category, flagged ? 1 : 0, id);
  return result.changes > 0;
}

/* ------------------------------------------------------- email retention */

/**
 * Purge email addresses past their six-month retention.
 * Must actually run — a retention promise nobody executes is just a claim on
 * a privacy page.
 */
export function purgeExpiredEmails(db: Database): number {
  const result = db
    .prepare(
      `UPDATE submissions SET email = NULL, email_purge_after = NULL
        WHERE email IS NOT NULL AND email_purge_after IS NOT NULL AND email_purge_after <= ?`,
    )
    .run(new Date().toISOString());
  // node:sqlite reports `changes` as number | bigint; these counts are small.
  return Number(result.changes);
}

/* ------------------------------------------------------------- analytics */

export function analytics(db: Database) {
  const row = db
    .prepare(
      // Every SUM is wrapped: SQLite returns NULL rather than 0 when there are
      // no rows, which would show an empty dashboard as blank instead of zero.
      `SELECT
         COUNT(*)                                                                AS total,
         COALESCE(SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END), 0)       AS answered,
         COALESCE(SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END), 0)       AS pending,
         COALESCE(SUM(CASE WHEN safety_flagged = 1  THEN 1 ELSE 0 END), 0)       AS flagged,
         COALESCE(SUM(CASE WHEN public_state = 'in_review' THEN 1 ELSE 0 END), 0) AS awaiting_review,
         -- Revenue is what was actually captured, never what a submission claims.
         (SELECT COALESCE(SUM(amount_minor_units), 0) FROM payments WHERE state = 'captured')
                                                                                 AS revenue_minor_units
       FROM submissions`,
    )
    .get();
  return row as Record<string, number>;
}
