/**
 * Secret word hashing.
 *
 * ---------------------------------------------------------------------------
 * PHASE 2 PLACEHOLDER — NOT PRODUCTION HASHING
 * ---------------------------------------------------------------------------
 * This uses SHA-256 with a random per-submission salt, in the browser, because
 * Phase 2 has no server. That is NOT adequate for a real credential: SHA-256 is
 * fast by design, which is exactly what makes it weak against an offline
 * guessing attack on a short human-chosen word.
 *
 * Phase 4 replaces this with **argon2id on the server**. The stored shape
 * (`secretWordHash` + `secretWordSalt`) is already right, so that swap is
 * confined to this file plus a migration.
 *
 * What is already correct, and must stay correct:
 *   - the word itself is never stored, never logged, never displayed publicly
 *   - it is never checked for global uniqueness; a salted hash cannot be
 *     looked up, and scoping it to one submission is the whole design
 *     (see NOTES.md on the uniqueness-versus-hashing tension)
 */

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Normalise before hashing so casing and stray spaces never lock someone out. */
export function normalizeSecretWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

export type SecretWordDigest = {
  readonly hash: string;
  readonly salt: string;
};

export async function hashSecretWord(word: string): Promise<SecretWordDigest> {
  const salt = newSalt();
  return { hash: await digest(word, salt), salt };
}

export async function verifySecretWord(
  word: string,
  digestValue: SecretWordDigest,
): Promise<boolean> {
  const candidate = await digest(word, digestValue.salt);
  return constantTimeEquals(candidate, digestValue.hash);
}

async function digest(word: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${normalizeSecretWord(word)}`);
  return toHex(await crypto.subtle.digest('SHA-256', encoded));
}

/**
 * Compare without leaking where two values diverge through timing.
 * Both inputs are fixed-length hex here, but comparing credentials with `===`
 * is a habit worth not forming.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export type SecretWordProblem = 'too-short' | 'too-long' | 'empty';

/** Validate what the visitor typed. Deliberately gentle: this is not a password. */
export function checkSecretWord(word: string): SecretWordProblem | null {
  const normalized = normalizeSecretWord(word);
  if (normalized === '') return 'empty';
  if (normalized.length < 4) return 'too-short';
  if (normalized.length > 64) return 'too-long';
  return null;
}
