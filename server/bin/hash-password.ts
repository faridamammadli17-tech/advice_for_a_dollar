import { createInterface } from 'node:readline/promises';
import { generatePasswordEnv } from '../auth';

/**
 * Generate the two environment values for the admin password.
 *
 * Run with `npm run admin:hash`. The password is typed here and never written
 * to a file, never committed, and never stored — only its scrypt hash and salt
 * go into the environment.
 */
const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question('New admin password: ');
rl.close();

if (password.trim().length < 12) {
  console.error('\nToo short. Use at least 12 characters — this is the only lock on the door.');
  process.exit(1);
}

const env = await generatePasswordEnv(password);
console.log('\nAdd these two lines to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${env.ADMIN_PASSWORD_HASH}`);
console.log(`ADMIN_PASSWORD_SALT=${env.ADMIN_PASSWORD_SALT}`);
console.log('\nThe password itself is not stored anywhere. Keep it in a password manager.');
