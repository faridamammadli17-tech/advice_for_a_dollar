import { type Database } from './db';
import { createSessionId, hashSecret, verifySecret, safeEquals } from './crypto';

/**
 * Admin authentication.
 *
 * One owner, one password, per Farida's decision. The password itself is never
 * stored — only a scrypt hash, supplied through ADMIN_PASSWORD_HASH and
 * ADMIN_PASSWORD_SALT in the environment.
 *
 * Sessions live in the database rather than in a signed cookie, so that
 * signing out actually revokes access instead of merely asking the browser to
 * forget. Small project, but a stolen cookie you cannot revoke is a bad trade
 * for a few milliseconds.
 */

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_COOKIE = 'afad_admin';

/** Attempts allowed per key inside the window, for login and for recovery. */
const RATE_LIMITS = {
  login: { max: 8, windowMs: 15 * 60 * 1000 },
  recover: { max: 6, windowMs: 15 * 60 * 1000 },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

/**
 * A simple fixed-window rate limiter kept in the database.
 *
 * Applied to login and to lost-link recovery. Recovery especially: without it,
 * the date-window narrowing that makes recovery possible would also make it
 * cheap to grind through secret words.
 */
export function rateLimit(db: Database, bucket: RateBucket, key: string): boolean {
  const limit = RATE_LIMITS[bucket];
  const now = Date.now();

  const row = db
    .prepare('SELECT window_start, count FROM rate_limits WHERE bucket = ? AND key = ?')
    .get(bucket, key) as { window_start: string; count: number } | undefined;

  if (row === undefined || now - Date.parse(row.window_start) > limit.windowMs) {
    db.prepare(
      `INSERT INTO rate_limits (bucket, key, window_start, count) VALUES (?,?,?,1)
       ON CONFLICT(bucket, key) DO UPDATE SET window_start = excluded.window_start, count = 1`,
    ).run(bucket, key, new Date(now).toISOString());
    return true;
  }

  if (row.count >= limit.max) return false;

  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE bucket = ? AND key = ?').run(
    bucket,
    key,
  );
  return true;
}

/* ------------------------------------------------------------- passwords */

/**
 * Generate the two environment values for a new admin password.
 * Run through `npm run admin:hash` — the password never touches the codebase.
 */
export async function generatePasswordEnv(password: string) {
  const digest = await hashSecret(password);
  return { ADMIN_PASSWORD_HASH: digest.hash, ADMIN_PASSWORD_SALT: digest.salt };
}

export type AdminConfig = {
  readonly passwordHash: string;
  readonly passwordSalt: string;
};

export function readAdminConfig(env: NodeJS.ProcessEnv): AdminConfig | null {
  const passwordHash = env.ADMIN_PASSWORD_HASH;
  const passwordSalt = env.ADMIN_PASSWORD_SALT;
  if (!passwordHash || !passwordSalt) return null;
  return { passwordHash, passwordSalt };
}

/* -------------------------------------------------------------- sessions */

export async function login(
  db: Database,
  config: AdminConfig,
  password: string,
  ipKey: string,
): Promise<string | null> {
  if (!rateLimit(db, 'login', ipKey)) return null;

  const ok = await verifySecret(password, {
    hash: config.passwordHash,
    salt: config.passwordSalt,
  });
  if (!ok) return null;

  const id = createSessionId();
  const now = new Date();
  db.prepare('INSERT INTO admin_sessions (id, created_at, expires_at) VALUES (?,?,?)').run(
    id,
    now.toISOString(),
    new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  );
  return id;
}

export function isValidSession(db: Database, sessionId: string | undefined): boolean {
  if (sessionId === undefined || sessionId === '') return false;

  const row = db.prepare('SELECT id, expires_at FROM admin_sessions WHERE id = ?').get(sessionId) as
    | { id: string; expires_at: string }
    | undefined;

  if (row === undefined) return false;
  if (Date.parse(row.expires_at) < Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId);
    return false;
  }
  // Compared in constant time even though it was just looked up by primary key.
  return safeEquals(row.id, sessionId);
}

export function logout(db: Database, sessionId: string | undefined): void {
  if (sessionId === undefined) return;
  db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId);
}

export function purgeExpiredSessions(db: Database): number {
  // node:sqlite reports `changes` as number | bigint; these counts are small.
  const { changes } = db
    .prepare('DELETE FROM admin_sessions WHERE expires_at <= ?')
    .run(new Date().toISOString());
  return Number(changes);
}
