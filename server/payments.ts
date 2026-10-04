import { type Database } from './db';

/**
 * Payment records.
 *
 * Provider-agnostic on purpose: Epoint and Payriff differ in how a checkout is
 * created and how a callback is signed, but neither changes what we store or
 * the rules below.
 *
 * Two rules that hold whatever the provider does:
 *
 *   1. THE AMOUNT IS NEVER TAKEN FROM THE BROWSER. What the client claims to
 *      have paid is a suggestion. What the provider reports on the callback is
 *      the fact, and the two are compared before anything is treated as paid.
 *
 *   2. EVERY ATTEMPT IS RECORDED, including failures. A failed payment is how
 *      you learn that cards are being declined, or that somebody tried three
 *      times and gave up partway through writing something hard.
 */

export type PaymentState = 'attempted' | 'captured' | 'failed' | 'refunded';

export type PaymentRow = {
  transaction_id: string;
  submission_id: string | null;
  provider: string;
  amount_minor_units: number;
  currency: string;
  state: PaymentState;
  failure_reason: string | null;
  created_at: string;
  settled_at: string | null;
  refunded_at: string | null;
};

export function recordAttempt(
  db: Database,
  input: { transactionId: string; provider: string; amountMinorUnits: number },
): void {
  db.prepare(
    `INSERT INTO payments (transaction_id, provider, amount_minor_units, currency, state, created_at)
     VALUES (?,?,?,'AZN','attempted',?)
     ON CONFLICT(transaction_id) DO NOTHING`,
  ).run(input.transactionId, input.provider, input.amountMinorUnits, new Date().toISOString());
}

/**
 * Confirm a payment against what the PROVIDER reported.
 *
 * Returns false when the reported amount does not match what was attempted.
 * That mismatch is the signal that matters: it means either a bug or a
 * tampered callback, and in both cases the submission must not be treated as
 * paid for.
 */
export function confirmCapture(
  db: Database,
  transactionId: string,
  providerReportedMinorUnits: number,
  submissionId: string | null,
): { ok: boolean; reason?: string } {
  const row = db
    .prepare('SELECT * FROM payments WHERE transaction_id = ?')
    .get(transactionId) as PaymentRow | undefined;

  if (row === undefined) {
    return { ok: false, reason: 'unknown-transaction' };
  }
  if (row.state === 'captured' || row.state === 'refunded') {
    // Providers retry callbacks. Capturing twice must not double anything.
    return { ok: true };
  }
  if (row.amount_minor_units !== providerReportedMinorUnits) {
    db.prepare(
      `UPDATE payments SET state = 'failed', failure_reason = ? WHERE transaction_id = ?`,
    ).run(
      `amount mismatch: attempted ${row.amount_minor_units}, provider reported ${providerReportedMinorUnits}`,
      transactionId,
    );
    return { ok: false, reason: 'amount-mismatch' };
  }

  db.prepare(
    `UPDATE payments SET state = 'captured', settled_at = ?, submission_id = COALESCE(?, submission_id)
      WHERE transaction_id = ?`,
  ).run(new Date().toISOString(), submissionId, transactionId);
  return { ok: true };
}

export function recordFailure(db: Database, transactionId: string, reason: string): void {
  db.prepare(
    `UPDATE payments SET state = 'failed', failure_reason = ? WHERE transaction_id = ? AND state = 'attempted'`,
  ).run(reason, transactionId);
}

/**
 * Mark a payment refunded.
 *
 * Works from the transaction id alone — the spec is explicit that a refund
 * must never require contact details from the visitor, because a private
 * submission may have none and a deleted one certainly has none.
 */
export function markRefunded(db: Database, transactionId: string): boolean {
  const result = db
    .prepare(
      `UPDATE payments SET state = 'refunded', refunded_at = ?
        WHERE transaction_id = ? AND state = 'captured'`,
    )
    .run(new Date().toISOString(), transactionId);
  return Number(result.changes) > 0;
}

export function listPayments(db: Database, limit = 200): PaymentRow[] {
  return db
    .prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT ?')
    .all(limit) as PaymentRow[];
}

/** Attempts, successes, failures and revenue — the spec's payment analytics. */
export function paymentStats(db: Database) {
  return db
    .prepare(
      `SELECT
         COUNT(*)                                                              AS attempts,
         COALESCE(SUM(CASE WHEN state = 'captured' THEN 1 ELSE 0 END), 0)      AS captured,
         COALESCE(SUM(CASE WHEN state = 'failed'   THEN 1 ELSE 0 END), 0)      AS failed,
         COALESCE(SUM(CASE WHEN state = 'refunded' THEN 1 ELSE 0 END), 0)      AS refunded,
         COALESCE(SUM(CASE WHEN state = 'captured' THEN amount_minor_units ELSE 0 END), 0) AS captured_minor_units
       FROM payments`,
    )
    .get() as Record<string, number>;
}
