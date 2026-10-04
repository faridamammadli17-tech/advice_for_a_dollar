/**
 * Magic-link tokens and submission ids.
 *
 * The token IS the credential: anyone holding it can read the submission,
 * send the follow-up and delete it. So it must be unguessable, and it must
 * never be derived from the submission id or from anything sequential — a
 * token you can count up to is not a secret.
 *
 * 32 bytes from the platform CSPRNG, base64url encoded. Never Math.random.
 */

const TOKEN_BYTES = 32;

function randomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A magic-link token. 32 random bytes, ~43 base64url characters. */
export function createToken(): string {
  return toBase64Url(randomBytes(TOKEN_BYTES));
}

/** A submission id. Separate value, separate randomness, never linked to the token. */
export function createId(): string {
  return toBase64Url(randomBytes(12));
}

/**
 * Cheap shape check before touching storage, so an obviously malformed URL
 * never reaches a lookup.
 */
export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(value);
}
