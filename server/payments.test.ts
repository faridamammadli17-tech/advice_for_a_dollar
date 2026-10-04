import { beforeEach, describe, expect, it } from 'vitest';
import { openTestDatabase, type Database } from './db';
import {
  confirmCapture,
  listPayments,
  markRefunded,
  paymentStats,
  recordAttempt,
  recordFailure,
} from './payments';
import { EpointProvider } from './providers/epoint';
import { PayriffProvider } from './providers/payriff';

/**
 * Payment rules.
 *
 * The amount tests are the important ones. "Trust the provider, never the
 * browser" is easy to say and easy to get wrong, and getting it wrong means
 * someone pays 1 qəpik and the system records a manat — or worse, a stranger
 * forges a callback and marks a submission paid.
 */

let db: Database;

beforeEach(() => {
  db = openTestDatabase();
});

const attempt = (transactionId: string, amount: number) =>
  recordAttempt(db, { transactionId, provider: 'mock', amountMinorUnits: amount });

describe('amount verification', () => {
  it('captures when the provider reports the amount that was attempted', () => {
    attempt('tx_1', 100);
    expect(confirmCapture(db, 'tx_1', 100, 'sub_1')).toEqual({ ok: true });
    expect(listPayments(db)[0]?.state).toBe('captured');
  });

  it('REFUSES when the provider reports less than was attempted', () => {
    attempt('tx_2', 500);
    const result = confirmCapture(db, 'tx_2', 1, 'sub_2');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('amount-mismatch');
    expect(listPayments(db)[0]?.state).toBe('failed');
  });

  it('REFUSES when the provider reports more than was attempted', () => {
    // Also a mismatch. A surprise overcharge is a bug worth stopping on, not
    // a windfall to accept quietly.
    attempt('tx_3', 100);
    expect(confirmCapture(db, 'tx_3', 100000, null).ok).toBe(false);
  });

  it('records why it failed, so a mismatch can be investigated', () => {
    attempt('tx_4', 300);
    confirmCapture(db, 'tx_4', 100, null);
    expect(listPayments(db)[0]?.failure_reason).toMatch(/attempted 300.*reported 100/);
  });

  it('refuses a callback for a transaction that was never attempted', () => {
    // A forged callback naming a transaction we never created.
    const result = confirmCapture(db, 'tx_never_seen', 100, 'sub_x');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unknown-transaction');
  });
});

describe('callback replay', () => {
  it('is idempotent — providers retry, and capturing twice must not double', () => {
    attempt('tx_5', 100);
    expect(confirmCapture(db, 'tx_5', 100, 'sub_5').ok).toBe(true);
    expect(confirmCapture(db, 'tx_5', 100, 'sub_5').ok).toBe(true);
    expect(listPayments(db)).toHaveLength(1);
    expect(paymentStats(db).captured).toBe(1);
  });

  it('does not let a replayed callback resurrect a refunded payment', () => {
    attempt('tx_6', 100);
    confirmCapture(db, 'tx_6', 100, null);
    markRefunded(db, 'tx_6');
    confirmCapture(db, 'tx_6', 100, null);
    expect(listPayments(db)[0]?.state).toBe('refunded');
  });
});

describe('one payment, one submission', () => {
  it('refuses a transaction that already paid for another submission', () => {
    attempt('tx_used', 100);
    expect(confirmCapture(db, 'tx_used', 100, 'sub_a').ok).toBe(true);
    const reuse = confirmCapture(db, 'tx_used', 100, 'sub_b');
    expect(reuse).toEqual({ ok: false, reason: 'already-used' });
    expect(listPayments(db)[0]?.submission_id).toBe('sub_a');
  });

  it('treats a failed payment as final', () => {
    attempt('tx_bad', 500);
    confirmCapture(db, 'tx_bad', 100, null);
    expect(confirmCapture(db, 'tx_bad', 500, null)).toEqual({ ok: false, reason: 'failed' });
  });
});

describe('refunds', () => {
  it('works from the transaction id alone, with no visitor contact details', () => {
    attempt('tx_7', 100);
    confirmCapture(db, 'tx_7', 100, null);
    expect(markRefunded(db, 'tx_7')).toBe(true);
    expect(listPayments(db)[0]?.refunded_at).not.toBeNull();
  });

  it('refuses to refund something that was never captured', () => {
    attempt('tx_8', 100);
    expect(markRefunded(db, 'tx_8')).toBe(false);
  });
});

describe('failures are kept, not discarded', () => {
  it('records a declined attempt', () => {
    attempt('tx_9', 100);
    recordFailure(db, 'tx_9', 'declined');
    expect(listPayments(db)[0]?.state).toBe('failed');
  });

  it('reports attempts, captures, failures and revenue', () => {
    attempt('a', 100);
    confirmCapture(db, 'a', 100, null);
    attempt('b', 300);
    confirmCapture(db, 'b', 300, null);
    attempt('c', 100);
    recordFailure(db, 'c', 'declined');

    const stats = paymentStats(db);
    expect(stats.attempts).toBe(3);
    expect(stats.captured).toBe(2);
    expect(stats.failed).toBe(1);
    // Only captured money counts as revenue.
    expect(stats.captured_minor_units).toBe(400);
  });
});

describe('the real providers refuse to run rather than guessing', () => {
  // Their API details must come from their own documentation. An adapter that
  // invents an endpoint would fail in production; one that throws here fails
  // in development, with a message naming exactly what is missing.
  it('Epoint throws a clear error at every entry point', async () => {
    const provider = new EpointProvider();
    await expect(
      provider.createCheckout({
        amountMinorUnits: 100,
        currency: 'AZN',
        submissionId: null,
        returnUrl: '/',
      }),
    ).rejects.toThrow(/not configured/i);
    await expect(provider.verifyCallback({}, {})).rejects.toThrow(/signature scheme/i);
    await expect(provider.refund('tx')).rejects.toThrow(/refund endpoint/i);
  });

  it('Payriff does the same', async () => {
    const provider = new PayriffProvider();
    await expect(provider.refund('tx')).rejects.toThrow(/not configured/i);
  });
});
