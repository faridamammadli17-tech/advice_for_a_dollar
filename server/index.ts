import { mkdirSync } from 'node:fs';
import { buildApp } from './app';
import { openDatabase } from './db';
import { purgeExpiredEmails } from './repo';
import { purgeExpiredSessions } from './auth';

/**
 * Server entry point.
 *
 * Also runs the two pieces of housekeeping that must actually happen rather
 * than merely being promised: expired admin sessions are cleared, and email
 * addresses past their six-month retention are purged. A retention policy
 * nobody executes is a claim on a privacy page, not a practice.
 */

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.DATABASE_PATH ?? 'data/advice.db';
const UPKEEP_INTERVAL_MS = 60 * 60 * 1000;

mkdirSync('data', { recursive: true });

const db = openDatabase(DB_PATH);
const app = buildApp(db);

function upkeep() {
  const sessions = purgeExpiredSessions(db);
  const emails = purgeExpiredEmails(db);
  if (sessions > 0 || emails > 0) {
    console.log(`[upkeep] cleared ${sessions} sessions, purged ${emails} email addresses`);
  }
}

upkeep();
setInterval(upkeep, UPKEEP_INTERVAL_MS).unref();

app
  .listen({ port: PORT, host: '127.0.0.1' })
  .then(() => {
    console.log(`API listening on http://127.0.0.1:${PORT}`);
    if (process.env.ADMIN_PASSWORD_HASH === undefined) {
      console.warn('[admin] ADMIN_PASSWORD_HASH is not set — admin routes will refuse every login.');
    }
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
