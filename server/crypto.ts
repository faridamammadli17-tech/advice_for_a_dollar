import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Server-side hashing and token generation.
 *
 * ---------------------------------------------------------------------------
 * WHY SCRYPT AND NOT ARGON2
 * ---------------------------------------------------------------------------
 * The plan said argon2id. argon2 needs native compilation, which is the kind
 * of dependency that breaks on a machine upgrade and strands a non-engineer
 * owner with a project that will not build.
 *
 * scrypt is built into Node, is memory-hard in the same way argon2 is, and is
 * what the parameters below are tuned for. argon2id is marginally preferred by
 * cryptographers today, but "slightly better algorithm that sometimes will not
 * install" loses to "very good algorithm that always works" for a project one
 * person maintains. Documented so the choice is visible rather than silent.
 *
 * This replaces the Phase 2 browser SHA-256 placeholder entirely. Secret words
 * are now hashed on the server, and the plaintext never reaches storage.
 */

/**
 * ~64 MB of memory per hash. Deliberately expensive: the thing being protected
 * is a short, human-chosen word, which is exactly what an offline attacker is
 * good at guessing quickly.
 */
const SCRYPT_PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 96 * 1024 * 1024 } as const;
const KEY_LENGTH = 32;

export type Digest = { readonly hash: string; readonly salt: string };

/** Normalise so casing and stray spaces never lock somebody out of their own submission. */
export function normalizeSecretWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function hashSecret(word: string): Promise<Digest> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(normalizeSecretWord(word), salt, KEY_LENGTH, SCRYPT_PARAMS);
  return { hash: derived.toString('hex'), salt };
}

export async function verifySecret(word: string, digest: Digest): Promise<boolean> {
  const derived = await scryptAsync(
    normalizeSecretWord(word),
    digest.salt,
    KEY_LENGTH,
    SCRYPT_PARAMS,
  );
  const expected = Buffer.from(digest.hash, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/* ------------------------------------------------------------------ tokens */

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

/**
 * A magic-link token: 32 bytes from the OS CSPRNG.
 *
 * Never sequential, never derived from the submission id, never from
 * Math.random. This value IS the credential.
 */
export function createToken(): string {
  return base64url(randomBytes(32));
}

/** A submission id. Independent randomness — not related to the token. */
export function createId(): string {
  return base64url(randomBytes(12));
}

/** An admin session id. */
export function createSessionId(): string {
  return base64url(randomBytes(32));
}

export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(value);
}

/**
 * Compare two secrets without leaking their difference through timing.
 * Used for session ids, which are compared far more often than passwords.
 */
export function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
