import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

/**
 * A warm 404. The spec is explicit that an unknown route — and an unknown
 * magic-link token — must never show a stack trace or a technical error. It
 * sits in the same frame as every other page.
 */
export function NotFound() {
  return (
    <PageShell>
      <section className="static">
        <div className="wrap wrap-narrow">
          <div className="page-panel stack" style={{ gap: '16px' }}>
            <h1 className="h1">There&rsquo;s nothing at this address.</h1>
            <p className="prose">
              The link may have been mistyped, or it may have pointed somewhere that no longer
              exists.
            </p>
            <p>
              <Link to="/">Back to the start</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
