import { beforeEach, describe, expect, it } from 'vitest';
import { openTestDatabase, type Database } from './db';
import { confirmCapture, recordAttempt } from './payments';
import {
  addFollowUp,
  analytics,
  answerSubmission,
  approveForPublication,
  createSubmission,
  deleteByToken,
  getByToken,
  getPublic,
  listPublic,
  purgeExpiredEmails,
  recoverToken,
  replyToFollowUp,
  setSafetyFlag,
} from './repo';

/**
 * Server data-layer tests.
 *
 * The important ones insert illegal states DIRECTLY with SQL, bypassing every
 * guard in `repo.ts`. That is the point: if the only thing protecting private
 * submissions were TypeScript, these would pass while the system was still one
 * careless query away from a leak. The `public_submissions` view has to hold
 * on its own.
 */

let db: Database;

beforeEach(() => {
  db = openTestDatabase();
});

/** Insert straight into the table, bypassing repo.ts entirely. */
function rawInsert(overrides: Record<string, unknown> = {}) {
  const row = {
    id: 'id_' + Math.random().toString(36).slice(2, 10),
    token: 'tok_' + Math.random().toString(36).slice(2, 10),
    body: 'A problem.',
    email: null,
    email_purge_after: null,
    visibility: 'public',
    status: 'answered',
    public_state: 'approved',
    safety_flagged: 0,
    safety_category: null,
    safety_rules: '[]',
    screened_at: '2026-01-01T00:00:00.000Z',
    secret_word_hash: 'hash',
    secret_word_salt: 'salt',
    amount_minor_units: 100,
    currency: 'AZN',
    transaction_id: 'tx',
    category: 'life',
    created_at: '2026-01-01T00:00:00.000Z',
    answered_at: '2026-01-02T00:00:00.000Z',
    answer: 'A reply.',
    ...overrides,
  };

  db.prepare(
    `INSERT INTO submissions (
       id, token, body, email, email_purge_after, visibility, status, public_state,
       safety_flagged, safety_category, safety_rules, screened_at,
       secret_word_hash, secret_word_salt, amount_minor_units, currency, transaction_id,
       category, created_at, answered_at, answer
     ) VALUES (?,?,?,?,?,?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?)`,
  ).run(
    row.id, row.token, row.body, row.email, row.email_purge_after,
    row.visibility, row.status, row.public_state,
    row.safety_flagged, row.safety_category, row.safety_rules, row.screened_at,
    row.secret_word_hash, row.secret_word_salt, row.amount_minor_units, row.currency, row.transaction_id,
    row.category, row.created_at, row.answered_at, row.answer,
  );
  return row;
}

describe('the public view holds the publication rule on its own', () => {
  it('hides a private submission even when approved in the table', () => {
    const row = rawInsert({ visibility: 'private', body: 'PRIVATE LEAK' });
    expect(listPublic(db)).toHaveLength(0);
    expect(getPublic(db, row.id)).toBeNull();
  });

  it('hides a public submission that is only awaiting review', () => {
    rawInsert({ public_state: 'in_review', body: 'UNREVIEWED LEAK' });
    expect(listPublic(db)).toHaveLength(0);
  });

  it('hides a rejected submission', () => {
    rawInsert({ public_state: 'rejected' });
    expect(listPublic(db)).toHaveLength(0);
  });

  it('hides a safety-flagged submission even when approved', () => {
    const row = rawInsert({ safety_flagged: 1, safety_category: 'self_harm' });
    expect(listPublic(db)).toHaveLength(0);
    expect(getPublic(db, row.id)).toBeNull();
  });

  it('hides a deleted submission', () => {
    rawInsert({ status: 'deleted' });
    expect(listPublic(db)).toHaveLength(0);
  });

  it('hides an approved submission with no answer', () => {
    rawInsert({ answer: null, status: 'pending' });
    rawInsert({ answer: '   ' });
    expect(listPublic(db)).toHaveLength(0);
  });

  it('shows only the one legal combination out of a mixed table', () => {
    const good = rawInsert({ body: 'PUBLISHABLE' });
    rawInsert({ visibility: 'private' });
    rawInsert({ public_state: 'in_review' });
    rawInsert({ public_state: 'rejected' });
    rawInsert({ safety_flagged: 1 });
    rawInsert({ status: 'deleted' });
    rawInsert({ answer: null, status: 'pending' });

    const visible = listPublic(db);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.id).toBe(good.id);
  });

  it('never exposes the token, hashes, salt or email through the view', () => {
    rawInsert({ email: 'someone@example.com', token: 'tok_secret' });
    const [problem] = listPublic(db);
    expect(Object.keys(problem ?? {}).sort()).toEqual([
      'answer',
      'answered_at',
      'body',
      'category',
      'created_at',
      'id',
    ]);
    expect(JSON.stringify(problem)).not.toContain('tok_secret');
    expect(JSON.stringify(problem)).not.toContain('someone@example.com');
  });
});

describe('approval refuses what it must', () => {
  it('will not publish a submission the visitor kept private', () => {
    const row = rawInsert({ visibility: 'private', public_state: 'not_requested' });
    expect(approveForPublication(db, row.id)).toBe(false);
    expect(listPublic(db)).toHaveLength(0);
  });

  it('will not publish a safety-flagged submission', () => {
    const row = rawInsert({ safety_flagged: 1, public_state: 'in_review' });
    expect(approveForPublication(db, row.id)).toBe(false);
    expect(listPublic(db)).toHaveLength(0);
  });

  it('publishes a clean public submission awaiting review', () => {
    const row = rawInsert({ public_state: 'in_review' });
    expect(approveForPublication(db, row.id)).toBe(true);
    expect(listPublic(db)).toHaveLength(1);
  });

  it('flagging an already-approved submission removes it from the archive', () => {
    const row = rawInsert();
    expect(listPublic(db)).toHaveLength(1);
    setSafetyFlag(db, row.id, true, 'self_harm');
    expect(listPublic(db)).toHaveLength(0);
  });
});

describe('createSubmission', () => {
  const base = {
    body: 'Something I have been carrying.',
    secretWord: 'roundabout',
    amountMinorUnits: 100,
    email: null,
    transactionId: 'tx_1',
    safety: { flagged: false, category: null, matchedRuleIds: [] },
  };

  it('stores the secret word hashed and salted, never in plaintext', async () => {
    const { token } = await createSubmission(db, { ...base, visibility: 'private' });
    const row = getByToken(db, token);
    expect(row).toBeDefined();
    expect(JSON.stringify(row)).not.toContain('roundabout');
    expect(String(row?.secret_word_hash)).toHaveLength(64);
    expect(String(row?.secret_word_salt)).toHaveLength(32);
  });

  it('issues a token that is not the id and is long enough to be unguessable', async () => {
    const { id, token } = await createSubmission(db, { ...base, visibility: 'private' });
    expect(token).not.toBe(id);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('puts a public request into review, never straight into approved', async () => {
    const { token } = await createSubmission(db, { ...base, visibility: 'public' });
    expect(getByToken(db, token)?.public_state).toBe('in_review');
    expect(listPublic(db)).toHaveLength(0);
  });

  it('leaves a private submission out of the review pipeline entirely', async () => {
    const { token } = await createSubmission(db, { ...base, visibility: 'private' });
    expect(getByToken(db, token)?.public_state).toBe('not_requested');
  });

  it('refuses outright to create a flagged submission', async () => {
    await expect(
      createSubmission(db, {
        ...base,
        visibility: 'private',
        safety: { flagged: true, category: 'self_harm', matchedRuleIds: ['x'] },
      }),
    ).rejects.toThrow(/safety screening/i);
  });
});

describe('recovery', () => {
  const window = { from: '2000-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' };

  it('returns the token for the right secret word', async () => {
    const { token } = await createSubmission(db, {
      body: 'x'.repeat(30),
      secretWord: 'harbour',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    expect(await recoverToken(db, 'HARBOUR  ', window, null)).toBe(token);
  });

  it('returns null for the wrong secret word', async () => {
    await createSubmission(db, {
      body: 'x'.repeat(30),
      secretWord: 'harbour',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    expect(await recoverToken(db, 'lighthouse', window, null)).toBeNull();
  });

  it('will not recover a deleted submission', async () => {
    const { token } = await createSubmission(db, {
      body: 'x'.repeat(30),
      secretWord: 'harbour',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    deleteByToken(db, token);
    expect(await recoverToken(db, 'harbour', window, null)).toBeNull();
  });

  it('only searches inside the given date window', async () => {
    await createSubmission(db, {
      body: 'x'.repeat(30),
      secretWord: 'harbour',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    const elsewhere = { from: '1999-01-01T00:00:00.000Z', to: '1999-12-31T00:00:00.000Z' };
    expect(await recoverToken(db, 'harbour', elsewhere, null)).toBeNull();
  });
});

describe('deletion', () => {
  it('destroys the text and answer but keeps the payment record', () => {
    const row = rawInsert({ email: 'gone@example.com' });
    expect(deleteByToken(db, row.token)).toBe(true);

    const after = getByToken(db, row.token);
    expect(after?.body).toBe('');
    expect(after?.answer).toBeNull();
    expect(after?.email).toBeNull();
    expect(after?.status).toBe('deleted');
    // Refunds must work from the transaction alone.
    expect(after?.amount_minor_units).toBe(100);
    expect(after?.transaction_id).toBe('tx');
  });

  it('removes a published problem from the archive', () => {
    const row = rawInsert();
    expect(listPublic(db)).toHaveLength(1);
    deleteByToken(db, row.token);
    expect(listPublic(db)).toHaveLength(0);
  });
});

describe('the follow-up is exactly one exchange', () => {
  it('accepts one follow-up and refuses a second', () => {
    const row = rawInsert();
    expect(addFollowUp(db, row.token, 'One more thing.')).toBe(true);
    expect(addFollowUp(db, row.token, 'And another.')).toBe(false);
  });

  it('refuses a follow-up before there is an answer', () => {
    const row = rawInsert({ status: 'pending', answer: null });
    expect(addFollowUp(db, row.token, 'Hello?')).toBe(false);
  });

  it('allows exactly one reply from Farida, then no more', () => {
    const row = rawInsert();
    addFollowUp(db, row.token, 'One more thing.');
    expect(replyToFollowUp(db, row.id, 'Here is my answer.')).toBe(true);
    expect(replyToFollowUp(db, row.id, 'Actually also this.')).toBe(false);
  });
});

describe('email retention', () => {
  it('purges addresses past six months and leaves the rest alone', () => {
    rawInsert({ email: 'old@example.com', email_purge_after: '2020-01-01T00:00:00.000Z' });
    rawInsert({ email: 'new@example.com', email_purge_after: '2099-01-01T00:00:00.000Z' });

    expect(purgeExpiredEmails(db)).toBe(1);

    const remaining = db
      .prepare('SELECT email FROM submissions WHERE email IS NOT NULL')
      .all() as { email: string }[];
    expect(remaining.map((entry) => entry.email)).toEqual(['new@example.com']);
  });
});

describe('answering and analytics', () => {
  it('marks a submission answered', () => {
    const row = rawInsert({ status: 'pending', answer: null, answered_at: null });
    expect(answerSubmission(db, row.id, 'A reply.')).toBe(true);
    expect(getByToken(db, row.token)?.status).toBe('answered');
  });

  it('refuses to answer a deleted submission', () => {
    const row = rawInsert({ status: 'deleted' });
    expect(answerSubmission(db, row.id, 'A reply.')).toBe(false);
  });

  it('reports counts, and revenue from captured payments only', () => {
    rawInsert();
    rawInsert({ status: 'pending', answer: null });
    rawInsert({ safety_flagged: 1 });
    // What a submission row claims is not revenue; what was captured is.
    recordAttempt(db, { transactionId: 'p1', provider: 'mock', amountMinorUnits: 100 });
    confirmCapture(db, 'p1', 100, null);
    recordAttempt(db, { transactionId: 'p2', provider: 'mock', amountMinorUnits: 300 });
    confirmCapture(db, 'p2', 300, null);
    recordAttempt(db, { transactionId: 'p3', provider: 'mock', amountMinorUnits: 500 });

    const stats = analytics(db);
    expect(stats.total).toBe(3);
    expect(stats.answered).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.flagged).toBe(1);
    expect(stats.revenue_minor_units).toBe(400);
  });
});

describe('analytics on an empty table', () => {
  it('reports zeros rather than nulls', () => {
    // SQLite's SUM returns NULL over zero rows; an empty dashboard should read
    // "0", not blank. Regression test for exactly that.
    const stats = analytics(db);
    expect(stats.total).toBe(0);
    expect(stats.answered).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.flagged).toBe(0);
    expect(stats.awaiting_review).toBe(0);
    expect(stats.revenue_minor_units).toBe(0);
  });
});

describe('exhaustive: only one state combination is publishable', () => {
  it('enumerates all 48 combinations and finds exactly one', () => {
    // Moved here from the old client-side queries.test.ts when the server
    // became the single authority on publication. Rather than checking the
    // cases somebody thought of, this walks every combination of visibility,
    // publicState, status and safety flag — so a new status added later
    // without thought fails this test instead of quietly leaking.
    const visibilities = ['public', 'private'];
    const publicStates = ['not_requested', 'in_review', 'approved', 'rejected'];
    const statuses = ['pending', 'answered', 'deleted'];
    const publishable: string[] = [];

    for (const visibility of visibilities) {
      for (const public_state of publicStates) {
        for (const status of statuses) {
          for (const safety_flagged of [0, 1]) {
            const fresh = openTestDatabase();
            const previous = db;
            db = fresh;
            rawInsert({ visibility, public_state, status, safety_flagged });
            if (listPublic(db).length > 0) {
              publishable.push(`${visibility}/${public_state}/${status}/flagged=${safety_flagged}`);
            }
            db = previous;
          }
        }
      }
    }

    expect(publishable).toEqual(['public/approved/answered/flagged=0']);
  });
});

describe('recovery narrows before it verifies', () => {
  it('only hashes candidates inside the date window', async () => {
    // Two submissions sharing a secret word, months apart. Recovery scoped to
    // one month must find only that one — this is the whole reason the second
    // factor exists, since a salted hash cannot be looked up globally.
    const older = await createSubmission(db, {
      body: 'x'.repeat(30),
      secretWord: 'lighthouse',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    db.prepare('UPDATE submissions SET created_at = ? WHERE token = ?').run(
      '2026-01-15T00:00:00.000Z',
      older.token,
    );

    const newer = await createSubmission(db, {
      body: 'y'.repeat(30),
      secretWord: 'lighthouse',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    db.prepare('UPDATE submissions SET created_at = ? WHERE token = ?').run(
      '2026-06-15T00:00:00.000Z',
      newer.token,
    );

    const january = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.000Z' };
    expect(await recoverToken(db, 'lighthouse', january, null)).toBe(older.token);

    const june = { from: '2026-06-01T00:00:00.000Z', to: '2026-06-30T23:59:59.000Z' };
    expect(await recoverToken(db, 'lighthouse', june, null)).toBe(newer.token);

    const march = { from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T23:59:59.000Z' };
    expect(await recoverToken(db, 'lighthouse', march, null)).toBeNull();
  });

  it('normalises casing and spacing, so a remembered word is not defeated by shift', async () => {
    const created = await createSubmission(db, {
      body: 'z'.repeat(30),
      secretWord: 'Lighthouse',
      visibility: 'private',
      amountMinorUnits: 100,
      email: null,
      transactionId: null,
      safety: { flagged: false, category: null, matchedRuleIds: [] },
    });
    const window = { from: '2000-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' };
    expect(await recoverToken(db, '  LIGHTHOUSE ', window, null)).toBe(created.token);
  });
});
