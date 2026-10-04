import { Link } from 'react-router-dom';
import { useTheme } from '../theme/useTheme';
import { useReducedMotion } from '../theme/useReducedMotion';
import { undeliveredAssets } from '../pixel/assets';
import { ALL_SPRITES } from '../pixel/sprites';

/**
 * PHASE 1 STATUS PAGE — deliberately not the homepage.
 *
 * The build spec is explicit that Phase 1 builds the visual foundation and
 * does not build the product. The real homepage, with the writing experience
 * and the ambient world, is Phase 2.
 */
export function FoundationHome() {
  const { theme, preference, setPreference } = useTheme();
  const reducedMotion = useReducedMotion();
  const pending = undeliveredAssets();

  return (
    <main
      style={{
        padding: '64px 24px 96px',
        maxWidth: '46rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent-strong)',
            fontWeight: 700,
          }}
        >
          Advice for a Dollar · Phase 1
        </span>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', margin: 0, lineHeight: 1.1 }}>
          Foundation &amp; visual system
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          This is scaffolding, not the site. Phase 1 builds the theme system, the sprite engine and
          the inspector that proves they work. The homepage, the writing experience and the
          submission flow are Phase 2.
        </p>
      </header>

      <section
        style={{
          border: 'var(--border-width) solid var(--border-strong)',
          background: 'var(--surface)',
          boxShadow: '5px 5px 0 var(--shadow)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          What is working
        </h2>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '8px 18px',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          }}
        >
          <dt style={{ color: 'var(--faint)' }}>Theme</dt>
          <dd style={{ margin: 0 }}>
            {theme} (preference: {preference})
          </dd>

          <dt style={{ color: 'var(--faint)' }}>Reduced motion</dt>
          <dd style={{ margin: 0 }}>{reducedMotion ? 'on — sprites are static' : 'off'}</dd>

          <dt style={{ color: 'var(--faint)' }}>Sprites registered</dt>
          <dd style={{ margin: 0 }}>{ALL_SPRITES.length}</dd>

          <dt style={{ color: 'var(--faint)' }}>Art still to come</dt>
          <dd style={{ margin: 0 }}>{pending.length} assets showing DRAFT placeholders</dd>
        </dl>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          {(['system', 'day', 'night'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPreference(option)}
              aria-pressed={preference === option}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '7px 12px',
                cursor: 'pointer',
                border: 'var(--border-width) solid var(--border-strong)',
                background: preference === option ? 'var(--accent)' : 'var(--surface-alt)',
                color: preference === option ? 'var(--on-accent)' : 'var(--text)',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {import.meta.env.DEV && (
        <p style={{ margin: 0 }}>
          <Link to="/dev/sprites" style={{ fontFamily: 'var(--font-mono)' }}>
            Open the sprite inspector &rarr;
          </Link>
        </p>
      )}
    </main>
  );
}
