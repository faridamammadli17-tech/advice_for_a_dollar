import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useT } from '../i18n';

/**
 * A warm 404. The spec is explicit that an unknown route — and an unknown
 * magic-link token — must never show a stack trace or a technical error. It
 * sits in the same frame as every other page.
 */
export function NotFound() {
  const t = useT();
  return (
    <PageShell>
      <section className="static">
        <div className="wrap wrap-narrow">
          <div className="page-panel stack" style={{ gap: '16px' }}>
            <h1 className="h1">{t.ui.notFound.title}</h1>
            <p className="prose">{t.ui.notFound.body}</p>
            <p>
              <Link to="/">{t.ui.notFound.back}</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
