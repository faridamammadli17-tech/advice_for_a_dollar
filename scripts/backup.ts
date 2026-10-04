import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/*
 * Loaded through createRequire for the same reason as server/db.ts: Vite's
 * resolver does not know `node:sqlite` yet.
 */
const { DatabaseSync, backup } = createRequire(import.meta.url)(
  'node:sqlite',
) as typeof import('node:sqlite');

/**
 * Back up the database: `npm run backup`.
 *
 * Safe to run while the server is running. The database uses SQLite's
 * write-ahead log, which means the newest submissions live in `advice.db-wal`
 * until the server closes or checkpoints, so copying `advice.db` by hand can
 * produce a file that is stale or even empty. SQLite's own backup API copies
 * a consistent snapshot of everything, every time.
 *
 * The copy lands in `backups/`, which Git ignores. Copy it somewhere safe.
 */

const source = process.env.DATABASE_PATH ?? 'data/advice.db';
const folder = 'backups';
const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
const destination = join(folder, `advice-${stamp}.db`);

let live: InstanceType<typeof DatabaseSync>;
try {
  live = new DatabaseSync(source, { readOnly: true });
} catch {
  console.error(`\nNo database found at ${source}.`);
  console.error('It is created the first time the server runs, so there is nothing to back up yet.\n');
  process.exit(1);
}

mkdirSync(folder, { recursive: true });
await backup(live, destination);
live.close();

const copy = new DatabaseSync(destination, { readOnly: true });
const { n } = copy.prepare('SELECT COUNT(*) AS n FROM submissions').get() as { n: number };
copy.close();

console.log(`\nBacked up ${n} submission${n === 1 ? '' : 's'} to ${destination}`);
console.log('Copy that file somewhere safe (a USB stick, a cloud drive). It is the whole database.\n');
