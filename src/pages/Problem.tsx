import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { visitorApi, type PublicProblem } from '../lib/api/client';
import { categoryLabel } from '../lib/archive/categories';
import { copy } from '../content/placeholder';

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
            <p className="prose">Loading…</p>
          </div>
        </section>
      </PageShell>
    );
  }

  if (problem === null) {
    return (
      <PageShell>
        <section className="problem-page">
          <div className="wrap wrap-narrow stack" style={{ gap: '16px' }}>
            <h1 className="h1">This one isn&rsquo;t here.</h1>
            <p className="prose">
              It may never have been shared publicly, or it may have been taken down. Either way
              there is nothing to see at this address.
            </p>
            <p>
              <Link to="/archive">Back to the other problems</Link>
            </p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="problem-page">
        <article className="wrap wrap-narrow stack" style={{ gap: '26px' }}>
          <header className="stack" style={{ gap: '6px' }}>
            <p className="problem-byline">
              Anonymous · {new Date(problem.created_at).toLocaleDateString()} ·{' '}
              {categoryLabel(problem.category)}
            </p>
          </header>

          <section className="stack" style={{ gap: '10px' }}>
            <h1 className="h3">Problem</h1>
            <hr className="problem-rule" />
            <p className="problem-text">{problem.body}</p>
          </section>

          <section className="stack" style={{ gap: '10px' }}>
            <h2 className="h3">Advice</h2>
            <hr className="problem-rule" />
            <p className="problem-text">{problem.answer}</p>
            <p className="problem-from">From: Farida</p>
          </section>

          <footer className="problem-foot stack" style={{ gap: '14px' }}>
            <p className="one-human">{copy.trust.oneHuman}</p>
            <div className="row">
              <Link to="/ask" className="btn btn-primary">
                Write your own
              </Link>
              <Link to="/archive" className="btn btn-quiet">
                Read another
              </Link>
            </div>
          </footer>
        </article>
      </section>
    </PageShell>
  );
}
