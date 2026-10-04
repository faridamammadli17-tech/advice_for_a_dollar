import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import { openDatabase, type Database } from './db';
import { screen } from '../src/lib/safety/screen';
import { looksLikeToken } from './crypto';
import { isKnownCategory } from '../src/lib/archive/categories';
import { MAXIMUM_MINOR_UNITS, MINIMUM_MINOR_UNITS } from '../src/lib/money';
import { MAX_BODY_CHARS, MAX_FOLLOW_UP_CHARS } from '../src/lib/submissions/types';
import {
  isValidSession,
  login,
  logout,
  rateLimit,
  readAdminConfig,
  SESSION_COOKIE,
} from './auth';
import {
  captureProblem,
  confirmCapture,
  listPayments,
  paymentStats,
  recordAttempt,
} from './payments';
import {
  addFollowUp,
  analytics,
  answerSubmission,
  approveForPublication,
  createSubmission,
  deleteByToken,
  getByToken,
  getPublic,
  listForAdmin,
  listPublic,
  purgeExpiredEmails,
  recoverToken,
  rejectForPublication,
  replyToFollowUp,
  setCategory,
  setSafetyFlag,
} from './repo';

/**
 * The API.
 *
 * Two rules the routes exist to enforce, both of which the browser is not
 * trusted with:
 *
 *   1. Safety screening happens HERE, before anything is created or charged.
 *      The client screens too, for a fast interstitial, but the client's
 *      verdict is never believed.
 *
 *   2. Everything public comes from `listPublic` / `getPublic`, which read the
 *      `public_submissions` view. No route reads the submissions table for
 *      public display.
 */

/**
 * The only payment provider that exists today. The real adapters arrive with
 * their documentation; until then nothing is charged, and every payment record
 * says `mock` so it can never be mistaken for real money.
 */
const PAYMENT_PROVIDER = 'mock';

/**
 * Who to believe about a visitor's address.
 *
 * The login and recovery limits key on `request.ip`. Off by default, because
 * trusting X-Forwarded-For from anyone would let a caller invent a fresh
 * address for every attempt. Behind a reverse proxy or a tunnel every
 * connection arrives from the proxy itself, so there TRUST_PROXY must be set
 * (`loopback` is right for a proxy on the same machine); otherwise every
 * visitor shares one limit and eight wrong guesses lock the owner out.
 */
function trustProxySetting(value: string | undefined): boolean | string {
  if (value === undefined || value === '' || value === 'false' || value === '0') return false;
  if (value === 'true' || value === '1') return true;
  return value;
}

/**
 * Text as a person would see it.
 *
 * Anything that is not a string counts as empty, so a payload carrying a
 * number or an array where words were expected is refused rather than
 * crashing the route. Zero-width and other invisible format characters are
 * removed before trimming: phones and rich-text editors can paste them
 * without anyone noticing, and a reply made only of them would otherwise
 * count as an answer and publish as a blank one.
 */
const visibleText = (value: unknown): string =>
  (typeof value === 'string' ? value : '').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();

export function buildApp(db: Database = openDatabase()) {
  const app = Fastify({
    logger: false,
    trustProxy: trustProxySetting(process.env.TRUST_PROXY),
    // The longest legitimate request is a 10,000-character problem. Anything
    // near a megabyte is not a person writing.
    bodyLimit: 64 * 1024,
  });
  void app.register(cookie);

  /**
   * One shape for every error. Fastify's default handler would echo the
   * internal message of an unexpected crash to the visitor and log nothing.
   * This logs anything that is the server's fault and answers plainly.
   */
  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    const status =
      error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;
    if (status >= 500) console.error(error);
    void reply.code(status).send({ ok: false });
  });

  const adminConfig = readAdminConfig(process.env);

  /** Uniform failure. Never says which part was wrong. */
  const deny = (reply: FastifyReply) => reply.code(401).send({ ok: false });

  const requireAdmin = (request: FastifyRequest, reply: FastifyReply): boolean => {
    // A second line behind SameSite=Strict: browsers label every request that
    // another site started, and nothing here is ever called from another site.
    if (request.headers['sec-fetch-site'] === 'cross-site') {
      void deny(reply);
      return false;
    }
    const sessionId = request.cookies[SESSION_COOKIE];
    if (!isValidSession(db, sessionId)) {
      void deny(reply);
      return false;
    }
    return true;
  };

  const clientKey = (request: FastifyRequest) => request.ip || 'unknown';

  /**
   * Security headers on every response.
   *
   * `Referrer-Policy: no-referrer` is the one that matters most here. A magic
   * link IS the credential, and it sits in the URL — without this, following
   * any outbound link from a token page would hand that token to the
   * destination in the Referer header. index.html carries a meta tag too, but
   * the header covers responses the meta tag cannot.
   */
  app.addHook('onSend', async (_request, reply, payload) => {
    void reply.headers({
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      // No inline scripts, no external anything, nothing framed. The site
      // loads its own bundle and talks to its own origin.
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        // Vite injects styles inline in development; the built CSS is a file.
        process.env.NODE_ENV === 'production'
          ? "style-src 'self'"
          : "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join('; '),
    });

    if (process.env.NODE_ENV === 'production') {
      void reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return payload;
  });

  /* ------------------------------------------------------------- public */

  app.get('/api/archive', async (request) => {
    const query = request.query as { category?: unknown; sort?: unknown };
    const sort = query.sort === 'oldest' ? 'oldest' : 'newest';
    // A repeated parameter arrives as an array; only a single name is a filter.
    const category = typeof query.category === 'string' ? query.category : undefined;
    return { problems: listPublic(db, { category, sort }) };
  });

  app.get('/api/problem/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const problem = getPublic(db, id);
    if (problem === null) return reply.code(404).send({ ok: false });
    return { problem };
  });

  /* --------------------------------------------------------- screening */

  app.post('/api/screen', async (request, reply) => {
    if (!rateLimit(db, 'screen', clientKey(request))) {
      return reply.code(429).send({ ok: false, reason: 'rate-limited' });
    }
    const { body } = (request.body ?? {}) as { body?: unknown };
    // Returned so the client can show the interstitial immediately. The
    // verdict is recomputed on submit regardless.
    return screen(visibleText(body));
  });

  /* -------------------------------------------------------- submission */

  app.post('/api/submissions', async (request, reply) => {
    if (!rateLimit(db, 'submit', clientKey(request))) {
      return reply.code(429).send({ ok: false, reason: 'rate-limited' });
    }
    const input = (request.body ?? {}) as {
      body?: unknown;
      secretWord?: unknown;
      visibility?: unknown;
      amountMinorUnits?: unknown;
      email?: unknown;
      transactionId?: unknown;
    };

    const body = visibleText(input.body);
    if (body.length < 20) {
      return reply.code(400).send({ ok: false, reason: 'too-short' });
    }
    if (body.length > MAX_BODY_CHARS) {
      return reply.code(400).send({ ok: false, reason: 'too-long' });
    }
    const secretWord = typeof input.secretWord === 'string' ? input.secretWord : '';
    if (secretWord.trim().length < 4) {
      return reply.code(400).send({ ok: false, reason: 'secret-word' });
    }
    // An email is optional. A blank one is none; a given one is kept in one
    // spelling (trimmed, lower-cased) so that recovery by email matches
    // however it is typed later. Only the loosest sanity check: this is not
    // the place to argue with someone about what an address looks like.
    const emailGiven = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (emailGiven !== '' && (!emailGiven.includes('@') || emailGiven.length > 254)) {
      return reply.code(400).send({ ok: false, reason: 'email' });
    }
    const email = emailGiven === '' ? null : emailGiven;
    const transactionId = typeof input.transactionId === 'string' ? input.transactionId : null;

    // Screened on the server. The client's opinion is not consulted.
    const safety = screen(body);
    if (safety.flagged) {
      return reply.code(200).send({ ok: false, blocked: true, category: safety.category });
    }

    // Amount verified here, never taken from the browser on trust. Phase 5
    // checks it against the provider's reported amount on the callback. The
    // same bounds as the form: a whole number of qəpik, from the minimum up
    // to the typo guard.
    const amount = input.amountMinorUnits;
    if (
      typeof amount !== 'number' ||
      !Number.isSafeInteger(amount) ||
      amount < MINIMUM_MINOR_UNITS ||
      amount > MAXIMUM_MINOR_UNITS
    ) {
      return reply.code(400).send({ ok: false, reason: 'amount' });
    }

    // No payment, no submission. Skipping the website and posting straight to
    // the API must not earn a free reply, and the dashboard's "Received" must
    // never count money that was only claimed.
    if (transactionId === null) {
      return reply.code(400).send({ ok: false, reason: 'payment' });
    }

    // Record the attempt before creating anything, so a payment that is
    // claimed but never confirmed still leaves a trace.
    recordAttempt(db, { transactionId, provider: PAYMENT_PROVIDER, amountMinorUnits: amount });

    // Check the payment BEFORE the submission exists, so a payment that cannot
    // pay (already used for another submission, failed, wrong amount) leaves
    // no stranded text behind with no link to delete it.
    const problem = captureProblem(db, transactionId, amount, null);
    if (problem !== null) {
      return reply.code(402).send({ ok: false, reason: problem });
    }

    const created = await createSubmission(db, {
      body,
      secretWord,
      visibility: input.visibility === 'public' ? 'public' : 'private',
      amountMinorUnits: amount,
      email,
      transactionId,
      safety: {
        flagged: false,
        category: safety.category,
        matchedRuleIds: safety.matchedRuleIds,
      },
    });

    // In Phase 5 the amount compared here comes from the PROVIDER'S verified
    // callback, not from this request. On the mock the two are the same
    // value, so the shape is already right and only the source changes.
    const capture = confirmCapture(db, transactionId, amount, created.id);
    if (!capture.ok) {
      // Only reachable if two requests raced on one transaction. Either way,
      // the text must not be left behind with no link to delete it.
      db.prepare('DELETE FROM submissions WHERE id = ?').run(created.id);
      return reply.code(402).send({ ok: false, reason: capture.reason });
    }

    return { ok: true, token: created.token };
  });

  /* ------------------------------------------------- visitor, by token */

  app.get('/api/a/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    if (!looksLikeToken(token)) return reply.code(404).send({ ok: false });

    const row = getByToken(db, token);
    if (row === undefined) return reply.code(404).send({ ok: false });
    if (row.status === 'deleted') return reply.code(410).send({ ok: false, deleted: true });

    // Built field by field. The hash, salt and email never leave the server.
    return {
      ok: true,
      submission: {
        body: row.body,
        visibility: row.visibility,
        status: row.status,
        publicState: row.public_state,
        createdAt: row.created_at,
        answeredAt: row.answered_at,
        answer: row.answer,
        followUp:
          row.follow_up_body === null
            ? null
            : {
                body: row.follow_up_body,
                createdAt: row.follow_up_at,
                reply: row.follow_up_reply,
                repliedAt: row.follow_up_reply_at,
              },
        amountMinorUnits: row.amount_minor_units,
        currency: row.currency,
      },
    };
  });

  app.post('/api/a/:token/follow-up', async (request, reply) => {
    const { token } = request.params as { token: string };
    if (!looksLikeToken(token)) return reply.code(404).send({ ok: false });
    const { body } = (request.body ?? {}) as { body?: unknown };
    const text = visibleText(body);
    if (text === '') return reply.code(400).send({ ok: false });
    if (text.length > MAX_FOLLOW_UP_CHARS) {
      return reply.code(400).send({ ok: false, reason: 'too-long' });
    }
    return { ok: addFollowUp(db, token, text) };
  });

  app.delete('/api/a/:token', async (request) => {
    const { token } = request.params as { token: string };
    if (!looksLikeToken(token)) return { ok: false };
    return { ok: deleteByToken(db, token) };
  });

  /* ---------------------------------------------------------- recovery */

  /**
   * Lost-link recovery.
   *
   * The response is IDENTICAL whether or not anything matched. It never
   * confirms that a submission exists, because confirming existence is itself
   * a disclosure — "yes, someone using that secret word wrote to this service"
   * is exactly what a controlling partner would want to know.
   *
   * On a genuine match the link is emailed, never returned in the response.
   * Rate limited per IP.
   */
  /*
   * Every recovery answer leaves after the same delay. The search itself is
   * bounded (at most 48 candidates, all checked, in parallel; see
   * recoverToken), and this floor sits comfortably above that bound, so the
   * time taken says nothing about how many submissions matched the window or
   * where in the list the match was.
   */
  const MIN_RECOVERY_MS = 1200;

  app.post('/api/recover', async (request, reply) => {
    const started = Date.now();

    /**
     * Every response leaves after the same minimum delay.
     *
     * Verifying a secret word against a narrowed candidate set takes time
     * proportional to how many candidates there are, and a miss returns
     * sooner than a hit. Without a floor, response time alone would answer
     * "does a submission exist for that date?" — which is the question this
     * endpoint exists not to answer.
     */
    const settle = async (body: unknown) => {
      const elapsed = Date.now() - started;
      if (elapsed < MIN_RECOVERY_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_RECOVERY_MS - elapsed));
      }
      return reply.code(200).send(body);
    };

    const nothing = { ok: true, link: null };

    const raw = (request.body ?? {}) as {
      secretWord?: unknown;
      email?: unknown;
      from?: unknown;
      to?: unknown;
    };
    const emailGiven = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
    const input = {
      secretWord: typeof raw.secretWord === 'string' ? raw.secretWord : '',
      email: emailGiven === '' ? null : emailGiven,
      from: typeof raw.from === 'string' ? raw.from : undefined,
      to: typeof raw.to === 'string' ? raw.to : undefined,
    };

    // Rate limited per IP. The secret word is short and human-chosen, and the
    // date window narrows the candidate set — without a limit that combination
    // would be cheap to grind through.
    if (!rateLimit(db, 'recover', clientKey(request))) {
      return settle(nothing);
    }

    const secretWord = input.secretWord.trim();
    if (secretWord === '') return settle(nothing);

    // The window is clamped inside recoverToken: at most three months wide,
    // never more than a year back, whatever the request asked for.
    const token = await recoverToken(db, secretWord, { from: input.from, to: input.to }, input.email);
    if (token === null) return settle(nothing);

    /**
     * A match returns the link.
     *
     * This is the one place the endpoint says anything, and it is deliberate.
     * The spec allows the link to be shown "only after the second factor
     * verifies server-side", and two factors have verified here: the secret
     * word, plus either the email already on file or the approximate date.
     *
     * The alternative — never revealing anything without email — would make
     * recovery impossible for the visitors who gave no email, which is most of
     * them, and they are exactly the people this feature is for.
     *
     * What is still never revealed: whether a submission exists for a secret
     * word that does not verify. Every failure looks and times the same.
     */
    return settle({ ok: true, link: `/a/${token}` });
  });

  /* ------------------------------------------------------------- admin */

  app.post('/api/admin/login', async (request, reply) => {
    if (adminConfig === null) return deny(reply);
    const { password } = (request.body ?? {}) as { password?: unknown };
    if (typeof password !== 'string' || password === '') return deny(reply);

    const sessionId = await login(db, adminConfig, password, clientKey(request));
    if (sessionId === null) return deny(reply);

    return reply
      .setCookie(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: 'strict',
        // Secure whenever the request itself arrived over HTTPS (behind a
        // proxy that needs TRUST_PROXY), and always in production.
        secure: process.env.NODE_ENV === 'production' ? true : 'auto',
        path: '/',
      })
      .send({ ok: true });
  });

  app.post('/api/admin/logout', async (request, reply) => {
    logout(db, request.cookies[SESSION_COOKIE]);
    return reply.clearCookie(SESSION_COOKIE, { path: '/' }).send({ ok: true });
  });

  app.get('/api/admin/submissions', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return { submissions: listForAdmin(db) };
  });

  app.get('/api/admin/analytics', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return { stats: analytics(db) };
  });

  app.post('/api/admin/:id/answer', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const text = visibleText(((request.body ?? {}) as { answer?: unknown }).answer);
    if (text === '') return reply.code(400).send({ ok: false });
    return { ok: answerSubmission(db, id, text) };
  });

  app.post('/api/admin/:id/follow-up-reply', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const text = visibleText(((request.body ?? {}) as { reply?: unknown }).reply);
    if (text === '') return reply.code(400).send({ ok: false });
    return { ok: replyToFollowUp(db, id, text) };
  });

  app.post('/api/admin/:id/approve', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    // Refuses private and safety-flagged submissions at the data layer.
    return { ok: approveForPublication(db, id) };
  });

  app.post('/api/admin/:id/reject', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    return { ok: rejectForPublication(db, id) };
  });

  app.post('/api/admin/:id/category', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as Record<string, unknown>;
    // An explicit null clears the category; a missing key is a malformed request.
    if (typeof body !== 'object' || !('category' in body)) return reply.code(400).send({ ok: false });
    const { category } = body;
    if (category === null) return { ok: setCategory(db, id, null) };
    if (typeof category !== 'string' || !isKnownCategory(category)) {
      return reply.code(400).send({ ok: false });
    }
    return { ok: setCategory(db, id, category) };
  });

  app.post('/api/admin/:id/flag', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { id } = request.params as { id: string };
    const { flagged, category } = (request.body ?? {}) as { flagged?: unknown; category?: unknown };
    if (typeof flagged !== 'boolean') return reply.code(400).send({ ok: false });
    if (category !== null && category !== undefined) {
      if (typeof category !== 'string' || category.length === 0 || category.length > 40) {
        return reply.code(400).send({ ok: false });
      }
    }
    return { ok: setSafetyFlag(db, id, flagged, typeof category === 'string' ? category : null) };
  });

  /* ---------------------------------------------------------- upkeep */

  app.post('/api/admin/purge-emails', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return { purged: purgeExpiredEmails(db) };
  });

  app.get('/api/admin/payments', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    return { payments: listPayments(db), stats: paymentStats(db) };
  });

  /**
   * Provider callback.
   *
   * TODO(provider-docs): this must verify the provider's signature BEFORE it
   * believes any field in the payload. Until Epoint's and Payriff's signature
   * schemes are known, the route refuses every request rather than accepting
   * an unauthenticated stranger's word that a payment succeeded.
   */
  app.post('/api/payments/callback/:provider', async (_request, reply) => {
    return reply.code(501).send({
      ok: false,
      reason: 'callback-verification-not-configured',
    });
  });

  app.get('/api/health', async () => ({ ok: true }));

  return app;
}
