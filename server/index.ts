import { existsSync, mkdirSync } from 'node:fs';
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

/*
 * Settings live in a `.env` file in the project folder, when there is one.
 * That is where the README tells the owner to paste the two admin-password
 * lines, so it has to be read here, before anything below looks at
 * process.env. Values already present in the environment win over the file,
 * which is how a hosting service can set them without a file at all.
 */
if (existsSync('.env')) process.loadEnvFile('.env');

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
