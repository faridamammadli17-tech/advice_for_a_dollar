import { createRequire } from 'node:module';

/*
 * `node:sqlite` is new enough that it does not appear in
 * `module.builtinModules`, so Vite's resolver strips the `node:` prefix and
 * then fails looking for a package called "sqlite". Loading it through
 * createRequire keeps it out of the bundler's static analysis and hands it
 * straight to the Node runtime, where it has been available since Node 22.
 */
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire('node:sqlite') as typeof import('node:sqlite');

/**
 * ===========================================================================
 * THE DATABASE
 * ===========================================================================
 *
 * SQLite, through Node's built-in `node:sqlite`. See NOTES.md for why this
 * replaced the earlier Postgres/Supabase recommendation: no service to run, no
 * native compilation, and a backup is "copy one file" — which matters when the
 * person operating it is not an engineer. At this volume the usual reasons to
 * reach for Postgres do not apply.
 *
 * ---------------------------------------------------------------------------
 * THE PUBLIC VIEW IS THE POINT OF THIS FILE
 * ---------------------------------------------------------------------------
 * `public_submissions` hard-codes the publication rule in SQL. Application
 * code reads the archive through the view and never through the table, so a
 * careless query in TypeScript cannot leak a private, unreviewed, flagged or
 * deleted row. That is the defence-in-depth the spec asks for: the rule holds
 * even if `queries.ts` is wrong.
 */

export type Database = InstanceType<typeof DatabaseSync>;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS submissions (
  id                 TEXT PRIMARY KEY,
  token              TEXT NOT NULL UNIQUE,
  body               TEXT NOT NULL,
  email              TEXT,
  email_purge_after  TEXT,

  visibility         TEXT NOT NULL CHECK (visibility IN ('public','private')),
  status             TEXT NOT NULL CHECK (status IN ('pending','answered','deleted')),
  public_state       TEXT NOT NULL CHECK (public_state IN ('not_requested','in_review','approved','rejected')),

  safety_flagged     INTEGER NOT NULL DEFAULT 0 CHECK (safety_flagged IN (0,1)),
  safety_category    TEXT,
  safety_rules       TEXT,
  screened_at        TEXT,

  secret_word_hash   TEXT NOT NULL,
  secret_word_salt   TEXT NOT NULL,

  amount_minor_units INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'AZN',
  transaction_id     TEXT,

  category           TEXT,
  created_at         TEXT NOT NULL,
  answered_at        TEXT,
  answer             TEXT,

  follow_up_body     TEXT,
  follow_up_at       TEXT,
  follow_up_reply    TEXT,
  follow_up_reply_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_public  ON submissions (visibility, public_state, status);
CREATE INDEX IF NOT EXISTS idx_submissions_purge   ON submissions (email_purge_after);

/*
 * The publication rule, in SQL.
 *
 * Every condition must hold:
 *   - the visitor asked for it            (visibility = 'public')
 *   - the owner granted it                (public_state = 'approved')
 *   - it is not safety flagged            (safety_flagged = 0)
 *   - it has not been deleted             (status = 'answered')
 *   - there is an actual answer to show
 *
 * Do not add columns to this view without thinking about what becomes public.
 * The token, the hashes, the salt and the email are deliberately absent.
 */
CREATE VIEW IF NOT EXISTS public_submissions AS
SELECT
  id,
  body,
  answer,
  category,
  created_at,
  answered_at
FROM submissions
WHERE visibility    = 'public'
  AND public_state  = 'approved'
  AND safety_flagged = 0
  AND status        = 'answered'
  AND answer IS NOT NULL
  AND TRIM(answer) <> '';

/*
 * Payment attempts — every one, not only the successful ones.
 *
 * A failed payment is a fact worth keeping: it is how you find out that a
 * provider is rejecting cards, or that someone tried three times and gave up
 * on writing something difficult. Kept separate from submissions so that a
 * deleted submission still leaves its payment record for refunds and
 * accounting.
 */
CREATE TABLE IF NOT EXISTS payments (
  transaction_id     TEXT PRIMARY KEY,
  submission_id      TEXT,
  provider           TEXT NOT NULL,
  amount_minor_units INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'AZN',
  state              TEXT NOT NULL CHECK (state IN ('attempted','captured','failed','refunded')),
  failure_reason     TEXT,
  created_at         TEXT NOT NULL,
  settled_at         TEXT,
  refunded_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_state   ON payments (state);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket      TEXT NOT NULL,
  key         TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count       INTEGER NOT NULL,
  PRIMARY KEY (bucket, key)
);
`;

export function openDatabase(path = 'data/advice.db'): Database {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

/** In-memory database for tests. Same schema, no file. */
export function openTestDatabase(): Database {
  return openDatabase(':memory:');
}
