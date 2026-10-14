import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { visitorApi, type PublicProblem } from '../lib/api/client';
import { useT } from '../i18n';

import './Problem.css';

/**
 * A single public problem.
 *
 * Layout comes straight from the spec:
 *
 *   Anonymous · Date · Category
 *   Problem
 *   ────────
 *   Advice
 *   ────────
 *   From: Farida
 *
 * Looked up by public id, never by token, and served from the
 * `public_submissions` view. A private or flagged submission returns 404 from
 * the server even when its id is known — this page cannot reach one.
 *
 * There is no reply box: visitors may not respond to someone else's problem,
 * and this is not a comment system.
 */
export function Problem() {
  const { id = '' } = useParams();

  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    void visitorApi.problem(id).then((result) => {
      if (cancelled) return;
      setProblem(result.ok ? result.data.problem : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <section className="problem-page">
          <div className="wrap wrap-narrow">
            <div className="page-panel">
              <p className="prose">{t.ui.problem.loading}</p>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  if (problem === null) {
    return (
      <PageShell>
        <section className="problem-page">
          <div className="wrap wrap-narrow">
            <div className="page-panel stack" style={{ gap: '16px' }}>
              <h1 className="h1">{t.ui.problem.missingTitle}</h1>
              <p className="prose">{t.ui.problem.missingBody}</p>
              <p>
                <Link to="/archive">{t.ui.problem.backToOthers}</Link>
              </p>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="problem-page">
        <div className="wrap wrap-narrow">
          <article className="page-panel stack" style={{ gap: '26px' }}>
            <header className="stack" style={{ gap: '6px' }}>
              <p className="problem-byline">
                {t.ui.archive.anonymous} · {t.formatDate(problem.created_at)} ·{' '}
                {t.categoryLabel(problem.category)}
              </p>
            </header>

            <section className="stack" style={{ gap: '10px' }}>
              <h1 className="h3">{t.ui.problem.problem}</h1>
              <hr className="problem-rule" />
              <p className="problem-text">{problem.body}</p>
            </section>

            <section className="stack" style={{ gap: '10px' }}>
              <h2 className="h3">{t.ui.problem.advice}</h2>
              <hr className="problem-rule" />
              <p className="problem-text">{problem.answer}</p>
              <p className="problem-from">{t.ui.problem.from}</p>
            </section>

            <footer className="problem-foot stack" style={{ gap: '14px' }}>
              <p className="one-human">{t.copy.trust.oneHuman}</p>
              <div className="row">
                <Link to="/ask" className="btn btn-primary">
                  {t.ui.problem.writeYourOwn}
                </Link>
                <Link to="/archive" className="btn btn-quiet">
                  {t.ui.problem.readAnother}
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
