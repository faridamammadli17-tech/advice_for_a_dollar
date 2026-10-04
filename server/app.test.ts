import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { openTestDatabase, type Database } from './db';
import { generatePasswordEnv, purgeStaleRateLimits } from './auth';
import type { FastifyInstance } from 'fastify';

/**
 * Full-stack HTTP tests.
 *
 * Everything below goes through the real routes, the real screening, the real
 * database and the real publication view — `app.inject()` drives Fastify
 * directly, so there is no network and no browser, but nothing is mocked out
 * either.
 *
 * These exist because the important behaviours had only ever been checked by
 * hand in a browser. Walking a flow once proves it worked once; these run on
 * every change. The ones that matter most are the refusals — a test that
 * proves something is *allowed* is far less valuable here than one proving
 * something is *impossible*.
 */

const PASSWORD = 'correct-horse-battery-staple';

let db: Database;
let app: FastifyInstance;

beforeEach(async () => {
  const env = await generatePasswordEnv(PASSWORD);
  process.env.ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_PASSWORD_SALT = env.ADMIN_PASSWORD_SALT;

  db = openTestDatabase();
  app = buildApp(db);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

const ORDINARY =
  'My best friend forgot my birthday and I cannot work out how to raise it without sounding petty.';

// Every submission needs a payment of its own. The mock provider issues a
// fresh transaction id per checkout; the tests do the same.
let transactionCounter = 0;

async function submit(overrides: Record<string, unknown> = {}) {
  transactionCounter += 1;
  return app.inject({
    method: 'POST',
    url: '/api/submissions',
    payload: {
      body: ORDINARY,
      secretWord: 'lighthouse',
      visibility: 'private',
      amountMinorUnits: 100,
      transactionId: `tx_${transactionCounter}`,
      ...overrides,
    },
  });
}

async function signIn(): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/admin/login',
    payload: { password: PASSWORD },
  });
  const cookie = response.cookies.find((c) => c.name === 'afad_admin');
  return cookie?.value ?? '';
}

function countRows(): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM submissions').get() as { n: number }).n;
}

/* ------------------------------------------------------------------ safety */

describe('safety screening cannot be skipped by calling the API directly', () => {
  it('blocks a crisis submission and creates nothing', async () => {
    const response = await submit({
      body: 'I have no reason to live and I do not want to be here anymore.',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: false, blocked: true, category: 'self_harm' });
    // Nothing created means nothing charged and nothing publishable.
    expect(countRows()).toBe(0);
  });

  it('does not block an ordinary problem that merely sounds dramatic', async () => {
    const response = await submit({
      body: 'I am dying of embarrassment about what I said at the work party last night.',
    });
    expect(response.json()).toMatchObject({ ok: true });
    expect(countRows()).toBe(1);
  });
});

/* ----------------------------------------------------------------- amounts */

describe('the amount is verified on the server', () => {
  it('refuses less than the minimum, whatever the client claims', async () => {
    const response = await submit({ amountMinorUnits: 1 });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ reason: 'amount' });
    expect(countRows()).toBe(0);
  });

  it('refuses a non-integer amount', async () => {
    expect((await submit({ amountMinorUnits: 100.5 })).statusCode).toBe(400);
    expect(countRows()).toBe(0);
  });

  it('refuses a submission that is too short to answer', async () => {
    expect((await submit({ body: 'help' })).statusCode).toBe(400);
  });

  it('refuses a secret word that is too short to be a credential', async () => {
    expect((await submit({ secretWord: 'ab' })).statusCode).toBe(400);
  });
});

/* -------------------------------------------------------- publication gate */

describe('the publication rule, over HTTP', () => {
  it('a public request is not public until it is approved AND answered', async () => {
    const created = await submit({ visibility: 'public' });
    const token = created.json().token as string;

    // asked for, but not granted
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(0);

    const session = await signIn();
    const id = (db.prepare('SELECT id FROM submissions').get() as { id: string }).id;

    // approved, but still no answer to show
    await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/approve`,
      cookies: { afad_admin: session },
    });
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(0);

    // answered as well — now it appears
    await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/answer`,
      cookies: { afad_admin: session },
      payload: { answer: 'A reply.' },
    });
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(1);

    // and the visitor's token still works
    expect((await app.inject({ method: 'GET', url: `/api/a/${token}` })).statusCode).toBe(200);
  });

  it('a private submission can never be published, however it is poked', async () => {
    await submit({ visibility: 'private' });
    const session = await signIn();
    const id = (db.prepare('SELECT id FROM submissions').get() as { id: string }).id;

    await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/answer`,
      cookies: { afad_admin: session },
      payload: { answer: 'A reply.' },
    });
    const approve = await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/approve`,
      cookies: { afad_admin: session },
    });

    expect(approve.json()).toMatchObject({ ok: false });
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(0);
    // Not reachable by its id either.
    expect((await app.inject({ method: 'GET', url: `/api/problem/${id}` })).statusCode).toBe(404);
  });

  it('flagging a published problem removes it immediately', async () => {
    await submit({ visibility: 'public' });
    const session = await signIn();
    const id = (db.prepare('SELECT id FROM submissions').get() as { id: string }).id;
    const auth = { afad_admin: session };

    await app.inject({ method: 'POST', url: `/api/admin/${id}/answer`, cookies: auth, payload: { answer: 'A reply.' } });
    await app.inject({ method: 'POST', url: `/api/admin/${id}/approve`, cookies: auth });
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(1);

    await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/flag`,
      cookies: auth,
      payload: { flagged: true, category: 'manual' },
    });
    expect((await app.inject({ method: 'GET', url: '/api/archive' })).json().problems).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------- auth */

describe('admin access', () => {
  const routes: [string, string][] = [
    ['GET', '/api/admin/submissions'],
    ['GET', '/api/admin/analytics'],
    ['GET', '/api/admin/payments'],
    ['POST', '/api/admin/anything/approve'],
    ['POST', '/api/admin/anything/flag'],
  ];

  it.each(routes)('%s %s refuses without a session', async (method, url) => {
    const response = await app.inject({ method: method as 'GET' | 'POST', url });
    expect(response.statusCode).toBe(401);
  });

  it('refuses a wrong password with the same body as any other failure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: 'not-it' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ ok: false });
  });

  it('refuses a forged session cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/submissions',
      cookies: { afad_admin: 'made-up-session-value-that-looks-plausible' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('sets an httpOnly SameSite cookie on success', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: PASSWORD },
    });
    const cookie = response.cookies.find((c) => c.name === 'afad_admin');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Strict');
  });

  it('signing out revokes the session rather than just forgetting it', async () => {
    const session = await signIn();
    const auth = { afad_admin: session };
    expect((await app.inject({ method: 'GET', url: '/api/admin/submissions', cookies: auth })).statusCode).toBe(200);

    await app.inject({ method: 'POST', url: '/api/admin/logout', cookies: auth });
    expect((await app.inject({ method: 'GET', url: '/api/admin/submissions', cookies: auth })).statusCode).toBe(401);
  });
});

/* ---------------------------------------------------------------- recovery */

describe('recovery never confirms existence', () => {
  it('answers identically for a wrong word and an empty one', async () => {
    await submit({ secretWord: 'lighthouse' });

    const wrong = await app.inject({ method: 'POST', url: '/api/recover', payload: { secretWord: 'harbour' } });
    const empty = await app.inject({ method: 'POST', url: '/api/recover', payload: { secretWord: '' } });

    expect(wrong.statusCode).toBe(empty.statusCode);
    expect(wrong.body).toBe(empty.body);
    expect(wrong.json()).toEqual({ ok: true, link: null });
  });

  it('returns the link only when the secret word verifies', async () => {
    const created = await submit({ secretWord: 'lighthouse' });
    const token = created.json().token as string;

    const found = await app.inject({
      method: 'POST',
      url: '/api/recover',
      payload: { secretWord: '  LIGHTHOUSE ' },
    });
    expect(found.json()).toEqual({ ok: true, link: `/a/${token}` });
  });
});

/* ------------------------------------------------------- the visitor's own */

describe('what the magic link gives back', () => {
  it('never exposes the hash, the salt or the email', async () => {
    const created = await submit({ email: 'someone@example.com' });
    const token = created.json().token as string;

    const response = await app.inject({ method: 'GET', url: `/api/a/${token}` });
    const body = response.body;

    expect(body).not.toContain('someone@example.com');
    expect(body).not.toContain('secret_word_hash');
    expect(body).not.toContain('secretWordHash');
    expect(body).not.toContain('lighthouse');
  });

  it('404s an unknown token without saying why', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/a/totallyMadeUpTokenValue123' })).statusCode).toBe(404);
  });

  it('accepts exactly one follow-up', async () => {
    const created = await submit();
    const token = created.json().token as string;
    const session = await signIn();
    const id = (db.prepare('SELECT id FROM submissions').get() as { id: string }).id;

    await app.inject({
      method: 'POST',
      url: `/api/admin/${id}/answer`,
      cookies: { afad_admin: session },
      payload: { answer: 'A reply.' },
    });

    const first = await app.inject({ method: 'POST', url: `/api/a/${token}/follow-up`, payload: { body: 'One more thing.' } });
    const second = await app.inject({ method: 'POST', url: `/api/a/${token}/follow-up`, payload: { body: 'And another.' } });

    expect(first.json()).toMatchObject({ ok: true });
    expect(second.json()).toMatchObject({ ok: false });
  });

  it('deletion destroys the text and kills the link', async () => {
    const created = await submit();
    const token = created.json().token as string;

    await app.inject({ method: 'DELETE', url: `/api/a/${token}` });

    const after = await app.inject({ method: 'GET', url: `/api/a/${token}` });
    expect(after.statusCode).toBe(410);
    expect((db.prepare('SELECT body FROM submissions').get() as { body: string }).body).toBe('');
  });
});

/* -------------------------------------------------------------- payments */

describe('payments', () => {
  it('records the attempt and captures it', async () => {
    await submit({ transactionId: 'tx_abc' });
    const row = db.prepare('SELECT * FROM payments WHERE transaction_id = ?').get('tx_abc') as
      | { state: string; amount_minor_units: number }
      | undefined;
    expect(row?.state).toBe('captured');
    expect(row?.amount_minor_units).toBe(100);
  });

  it('refuses an unverified provider callback rather than believing it', async () => {
    // Until the signature scheme is known, accepting a callback would let
    // anyone who finds this URL mark a submission as paid.
    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/callback/epoint',
      payload: { ok: true, amountMinorUnits: 999999 },
    });
    expect(response.statusCode).toBe(501);
  });
});

/* ------------------------------------------------------- security headers */

describe('security headers', () => {
  it('sends no-referrer, so a magic link cannot leak through Referer', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(String(response.headers['content-security-policy'])).toContain("frame-ancestors 'none'");
  });
});

/* ------------------------------------------------------------ input hygiene */

describe('input hygiene', () => {
  async function adminList(cookie: string) {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/submissions',
      cookies: { afad_admin: cookie },
    });
    return response.json().submissions as Record<string, unknown>[];
  }

  it('never sends the token, the hash or the salt to the dashboard', async () => {
    await submit();
    const [row] = await adminList(await signIn());

    expect(row).toBeDefined();
    expect(row?.body).toBe(ORDINARY);
    for (const secret of ['token', 'secret_word_hash', 'secret_word_salt', 'safety_rules']) {
      expect(row).not.toHaveProperty(secret);
    }
  });

  it('refuses a reply made only of invisible characters', async () => {
    await submit();
    const cookie = await signIn();
    const [row] = await adminList(cookie);

    const response = await app.inject({
      method: 'POST',
      url: `/api/admin/${String(row?.id)}/answer`,
      cookies: { afad_admin: cookie },
      payload: { answer: '​‍ ﻿⁠' },
    });
    expect(response.statusCode).toBe(400);

    const stored = db
      .prepare('SELECT status, answer FROM submissions WHERE id = ?')
      .get(String(row?.id)) as { status: string; answer: string | null };
    expect(stored).toEqual({ status: 'pending', answer: null });
  });

  it('refuses a follow-up made only of invisible characters', async () => {
    const token = (await submit()).json().token as string;
    const cookie = await signIn();
    const [row] = await adminList(cookie);
    await app.inject({
      method: 'POST',
      url: `/api/admin/${String(row?.id)}/answer`,
      cookies: { afad_admin: cookie },
      payload: { answer: 'A real reply.' },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/a/${token}/follow-up`,
      payload: { body: '​​' },
    });
    expect(response.statusCode).toBe(400);
    // The one allowed follow-up is still available afterwards.
    const real = await app.inject({
      method: 'POST',
      url: `/api/a/${token}/follow-up`,
      payload: { body: 'One more thing.' },
    });
    expect(real.json()).toEqual({ ok: true });
  });

  it('answers a malformed payload with a refusal, never a crash', async () => {
    const screen = await app.inject({
      method: 'POST',
      url: '/api/screen',
      payload: { body: ['not', 'text'] },
    });
    expect(screen.statusCode).toBe(200);
    expect(screen.json()).toMatchObject({ flagged: false });

    expect((await submit({ secretWord: 12345 })).statusCode).toBe(400);
    expect((await submit({ body: 12345 })).statusCode).toBe(400);
    expect((await submit({ body: { text: ORDINARY } })).statusCode).toBe(400);

    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { password: { $ne: '' } },
    });
    expect(login.statusCode).toBe(401);

    const recover = await app.inject({
      method: 'POST',
      url: '/api/recover',
      payload: { secretWord: 42, email: 7, from: [], to: {} },
    });
    expect(recover.statusCode).toBe(200);
    expect(recover.json()).toEqual({ ok: true, link: null });
  });
});

/* -------------------------------------------------- payments are the gate */

describe('a submission needs a payment of its own', () => {
  it('refuses a submission with no payment at all', async () => {
    const response = await submit({ transactionId: null });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ reason: 'payment' });
    expect(countRows()).toBe(0);
  });

  it('refuses to let one payment pay for a second submission', async () => {
    expect((await submit({ transactionId: 'tx_once' })).json()).toMatchObject({ ok: true });
    const again = await submit({ transactionId: 'tx_once' });
    expect(again.statusCode).toBe(402);
    expect(again.json()).toMatchObject({ reason: 'already-used' });
    expect(countRows()).toBe(1);
  });

  it('refuses an amount above the form\'s maximum or of the wrong type', async () => {
    expect((await submit({ amountMinorUnits: 1e12 })).statusCode).toBe(400);
    expect((await submit({ amountMinorUnits: '100' })).statusCode).toBe(400);
    expect((await submit({ amountMinorUnits: [100] })).statusCode).toBe(400);
    expect(countRows()).toBe(0);
  });

  it('counts as received only what was actually captured', async () => {
    await submit({ amountMinorUnits: 300 });
    const cookie = await signIn();
    const stats = await app.inject({
      method: 'GET',
      url: '/api/admin/analytics',
      cookies: { afad_admin: cookie },
    });
    expect(stats.json().stats.revenue_minor_units).toBe(300);
  });
});

/* ------------------------------------------------------ admin input checks */

describe('admin actions check their input', () => {
  async function firstRowId(cookie: string): Promise<string> {
    const list = await app.inject({
      method: 'GET',
      url: '/api/admin/submissions',
      cookies: { afad_admin: cookie },
    });
    return String(list.json().submissions[0].id);
  }

  it('accepts only a known category, or none', async () => {
    await submit();
    const cookie = await signIn();
    const id = await firstRowId(cookie);
    const post = (payload: unknown) =>
      app.inject({
        method: 'POST',
        url: `/api/admin/${id}/category`,
        cookies: { afad_admin: cookie },
        payload: payload as Record<string, unknown>,
      });

    expect((await post({ category: 'not-a-real-category' })).statusCode).toBe(400);
    expect((await post({ category: 42 })).statusCode).toBe(400);
    expect((await post(undefined)).statusCode).toBe(400);
    expect((await post({ category: 'money' })).json()).toEqual({ ok: true });
    expect((await post({ category: null })).json()).toEqual({ ok: true });
  });

  it('flags only on a real yes or no', async () => {
    await submit();
    const cookie = await signIn();
    const id = await firstRowId(cookie);
    const post = (payload: unknown) =>
      app.inject({
        method: 'POST',
        url: `/api/admin/${id}/flag`,
        cookies: { afad_admin: cookie },
        payload: payload as Record<string, unknown>,
      });

    expect((await post({ flagged: 'true' })).statusCode).toBe(400);
    expect((await post({ flagged: 1 })).statusCode).toBe(400);
    expect((await post(undefined)).statusCode).toBe(400);
    expect((await post({ flagged: true, category: 'manual' })).json()).toEqual({ ok: true });
    const row = db.prepare('SELECT safety_flagged FROM submissions WHERE id = ?').get(id) as {
      safety_flagged: number;
    };
    expect(row.safety_flagged).toBe(1);
  });

  it('refuses a request another site started, even with a valid session', async () => {
    const cookie = await signIn();
    const crossSite = await app.inject({
      method: 'GET',
      url: '/api/admin/submissions',
      cookies: { afad_admin: cookie },
      headers: { 'sec-fetch-site': 'cross-site' },
    });
    expect(crossSite.statusCode).toBe(401);
    const sameSite = await app.inject({
      method: 'GET',
      url: '/api/admin/submissions',
      cookies: { afad_admin: cookie },
      headers: { 'sec-fetch-site': 'same-origin' },
    });
    expect(sameSite.statusCode).toBe(200);
  });
});

/* -------------------------------------------------------- behind a proxy */

describe('rate limits behind a proxy', () => {
  const wrongLogins = async (count: number) => {
    for (let i = 0; i < count; i += 1) {
      await app.inject({
        method: 'POST',
        url: '/api/admin/login',
        remoteAddress: '127.0.0.1',
        headers: { 'x-forwarded-for': `203.0.113.${i}` },
        payload: { password: 'wrong' },
      });
    }
  };
  const ownerLogin = () =>
    app.inject({
      method: 'POST',
      url: '/api/admin/login',
      remoteAddress: '127.0.0.1',
      headers: { 'x-forwarded-for': '198.51.100.7' },
      payload: { password: PASSWORD },
    });

  it('without TRUST_PROXY, everyone arriving through one proxy shares a limit', async () => {
    await wrongLogins(8);
    expect((await ownerLogin()).statusCode).toBe(401);
  });

  it('with TRUST_PROXY=loopback, the limit follows the forwarded address', async () => {
    await app.close();
    process.env.TRUST_PROXY = 'loopback';
    try {
      app = buildApp(db);
      await app.ready();
      await wrongLogins(8);
      expect((await ownerLogin()).statusCode).toBe(200);
    } finally {
      delete process.env.TRUST_PROXY;
    }
  });
});

/* --------------------------------------------------------- housekeeping */

describe('housekeeping', () => {
  it('forgets rate-limit entries once their window has passed', async () => {
    const stale = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO rate_limits (bucket, key, window_start, count) VALUES (?,?,?,?)').run(
      'recover',
      '203.0.113.9',
      stale,
      3,
    );
    await app.inject({ method: 'POST', url: '/api/recover', payload: { secretWord: 'x' } });
    expect(purgeStaleRateLimits(db)).toBe(1);
    const left = db.prepare('SELECT key FROM rate_limits').all() as { key: string }[];
    expect(left.map((row) => row.key)).not.toContain('203.0.113.9');
    expect(left).toHaveLength(1);
  });

  it('deletion also forgets the secret word and the follow-up timestamps', async () => {
    const token = (await submit()).json().token as string;
    await app.inject({ method: 'DELETE', url: `/api/a/${token}` });
    const row = db
      .prepare('SELECT secret_word_hash, secret_word_salt, follow_up_at, category FROM submissions')
      .get() as Record<string, unknown>;
    expect(row).toEqual({
      secret_word_hash: '',
      secret_word_salt: '',
      follow_up_at: null,
      category: null,
    });
  });
});

/* ------------------------------------------------- limits on public routes */

describe('limits on the public routes', () => {
  it('refuses a problem longer than anyone can read in one sitting', async () => {
    const response = await submit({ body: 'x'.repeat(10_001) });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ reason: 'too-long' });
    expect(countRows()).toBe(0);
  });

  it('slows down a flood of submissions from one address', async () => {
    for (let i = 0; i < 10; i += 1) {
      expect((await submit()).statusCode).toBe(200);
    }
    const eleventh = await submit();
    expect(eleventh.statusCode).toBe(429);
    expect(countRows()).toBe(10);
  });

  it('answers a repeated category parameter without crashing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/archive?category=family&category=money',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ problems: [] });
  });

  it('refuses follow-up and deletion for a token that is not even the right shape', async () => {
    const followUp = await app.inject({
      method: 'POST',
      url: '/api/a/..%2F..%2Fetc/follow-up',
      payload: { body: 'Hello?' },
    });
    expect(followUp.statusCode).toBe(404);
    const deletion = await app.inject({ method: 'DELETE', url: '/api/a/short' });
    expect(deletion.json()).toEqual({ ok: false });
  });

  it('treats a blank email as none, keeps a real one in one spelling, refuses nonsense', async () => {
    await submit({ email: '  Someone@Example.com ' });
    await submit({ email: '   ' });
    const rows = db.prepare('SELECT email FROM submissions ORDER BY rowid').all() as {
      email: string | null;
    }[];
    expect(rows.map((row) => row.email)).toEqual(['someone@example.com', null]);
    expect((await submit({ email: 'not-an-address' })).statusCode).toBe(400);
  });
});

/* ------------------------------------------------------ recovery is bounded */

describe('recovery is bounded', () => {
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
  const recover = (payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/recover', payload });

  it('searches the last three months unless a month is given, never more than a year back', async () => {
    const token = (await submit()).json().token as string;
    db.prepare('UPDATE submissions SET created_at = ?').run(daysAgo(200));

    expect((await recover({ secretWord: 'lighthouse' })).json()).toEqual({ ok: true, link: null });
    const everything = {
      secretWord: 'lighthouse',
      from: '1970-01-01T00:00:00.000Z',
      to: '2100-01-01T00:00:00.000Z',
    };
    expect((await recover(everything)).json()).toEqual({ ok: true, link: null });
    const around = { secretWord: 'lighthouse', from: daysAgo(230), to: daysAgo(170) };
    expect((await recover(around)).json()).toEqual({ ok: true, link: `/a/${token}` });
  });

  it('finds a submission by email however the address was typed', async () => {
    const token = (await submit({ email: 'Someone@Example.com' })).json().token as string;
    const found = await recover({ secretWord: 'lighthouse', email: '  someone@example.COM ' });
    expect(found.json()).toEqual({ ok: true, link: `/a/${token}` });
  });

  it('takes the same time whether the window is empty or busy', async () => {
    for (let i = 0; i < 8; i += 1) await submit({ secretWord: `word-${i}` });
    const time = async (payload: Record<string, unknown>) => {
      const started = Date.now();
      await recover(payload);
      return Date.now() - started;
    };
    const busy = await time({ secretWord: 'not-any-of-them' });
    const empty = await time({ secretWord: 'not-any-of-them', from: daysAgo(300), to: daysAgo(290) });
    expect(busy).toBeGreaterThanOrEqual(1190);
    expect(empty).toBeGreaterThanOrEqual(1190);
    expect(Math.abs(busy - empty)).toBeLessThan(300);
  });
});
