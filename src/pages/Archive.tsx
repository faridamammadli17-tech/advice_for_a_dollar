import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { visitorApi, type PublicProblem } from '../lib/api/client';
import {
  ALL_CATEGORY_ID,
  CATEGORIES,
  categoryLabel,
  SORT_OPTIONS,
  type SortOrder,
} from '../lib/archive/categories';

import './Archive.css';

/**
 * The public archive.
 *
 * The point is not entertainment. It is that someone reading these should
 * come away feeling less like the only person this has happened to. That is
 * why there are no view counts, no votes and no popularity ranking — ordering
 * other people's worst days by how well they perform would be grotesque.
 *
 * Every row comes from `/api/archive`, which reads the `public_submissions`
 * database view. The publication rule is enforced in SQL, not here — this page
 * renders whatever the server was willing to hand over, and has no ability to
 * ask for anything else.
 */
export function Archive() {
  const [category, setCategory] = useState<string>(ALL_CATEGORY_ID);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [problems, setProblems] = useState<PublicProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void visitorApi.archive(category, sort).then((result) => {
      if (cancelled) return;
      setProblems(result.ok ? result.data.problems : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [category, sort]);

  return (
    <PageShell>
      <section className="archive">
        <div className="wrap stack" style={{ gap: '26px' }}>
          <header className="stack" style={{ gap: '10px' }}>
            <span className="eyebrow">Other people&rsquo;s problems</span>
            <h1 className="h1">You are not the only one.</h1>
            <p className="lede">
              Every problem here was written by someone who chose to share it, and read and approved
              before it appeared. Names never appear — not theirs, not anyone&rsquo;s.
            </p>
          </header>

          <div className="filters">
            <div className="filter-group" role="group" aria-label="Category">
              <button
                type="button"
                className="chip"
                aria-pressed={category === ALL_CATEGORY_ID}
                onClick={() => setCategory(ALL_CATEGORY_ID)}
              >
                All
              </button>
              {CATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="chip"
                  aria-pressed={category === entry.id}
                  onClick={() => setCategory(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="filter-group" role="group" aria-label="Order">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="chip chip-quiet"
                  aria-pressed={sort === option.id}
                  onClick={() => setSort(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="prose">Loading…</p>
          ) : problems.length === 0 ? (
            <div className="panel empty">
              <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
              <div className="stack" style={{ gap: '8px' }}>
                <h2 className="h3">Nothing here yet</h2>
                <p className="prose">
                  {category === ALL_CATEGORY_ID
                    ? 'No problems have been approved for sharing yet. Nothing is invented to fill this space — it stays empty until someone shares theirs and Farida publishes it.'
                    : `Nothing in ${categoryLabel(category)} yet.`}
                </p>
                <p>
                  <Link to="/ask">Write yours</Link>
                </p>
              </div>
            </div>
          ) : (
            <ul className="problem-list">
              {problems.map((problem) => (
                <li key={problem.id}>
                  <Link to={`/problem/${problem.id}`} className="problem-card">
                    <span className="problem-meta">
                      Anonymous · {new Date(problem.created_at).toLocaleDateString()} ·{' '}
                      {categoryLabel(problem.category)}
                    </span>
                    <span className="problem-excerpt">{problem.body}</span>
                    <span className="problem-more">Read the reply →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

        </div>
      </section>
    </PageShell>
  );
}
