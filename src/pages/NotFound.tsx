import { Link } from 'react-router-dom';

/**
 * A warm 404. The spec is explicit that an unknown route — and later, an
 * unknown magic-link token — must never show a stack trace or a technical
 * error. This is a placeholder for the real one, which arrives with the
 * visual system in Phase 2.
 */
export function NotFound() {
  return (
    <main style={{ padding: '64px 24px', maxWidth: '40rem', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem' }}>
        There's nothing at this address.
      </h1>
      <p style={{ color: 'var(--muted)' }}>
        The link may have been mistyped, or it may have pointed somewhere that no longer exists.
      </p>
      <p>
        <Link to="/">Back to the start</Link>
      </p>
    </main>
  );
}
