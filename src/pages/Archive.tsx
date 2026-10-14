import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { visitorApi, type PublicProblem } from '../lib/api/client';
import {
  ALL_CATEGORY_ID,
  CATEGORIES,
  SORT_OPTIONS,
  type SortOrder,
} from '../lib/archive/categories';
import { useT } from '../i18n';

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
  const t = useT();

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
        <div className="wrap">
          <div className="page-panel stack" style={{ gap: '26px' }}>
            <header className="stack" style={{ gap: '10px' }}>
              <span className="eyebrow">{t.ui.archive.eyebrow}</span>
              <h1 className="h1">{t.ui.archive.title}</h1>
              <p className="lede">{t.ui.archive.lede}</p>
            </header>

            <div className="filters">
              <div className="filter-group" role="group" aria-label={t.ui.archive.categoryGroup}>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={category === ALL_CATEGORY_ID}
                  onClick={() => setCategory(ALL_CATEGORY_ID)}
                >
                  {t.ui.archive.all}
                </button>
                {CATEGORIES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="chip"
                    aria-pressed={category === entry.id}
                    onClick={() => setCategory(entry.id)}
                  >
                    {t.categoryLabel(entry.id)}
                  </button>
                ))}
              </div>

              <div className="filter-group" role="group" aria-label={t.ui.archive.orderGroup}>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="chip chip-quiet"
                    aria-pressed={sort === option.id}
                    onClick={() => setSort(option.id)}
                  >
                    {t.ui.sort[option.id]}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="prose">{t.ui.archive.loading}</p>
            ) : problems.length === 0 ? (
              <div className="panel empty">
                <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
                <div className="stack" style={{ gap: '8px' }}>
                  <h2 className="h3">{t.ui.archive.emptyTitle}</h2>
                  <p className="prose">
                    {category === ALL_CATEGORY_ID
                      ? t.ui.archive.emptyAll
                      : t.ui.archive.emptyIn(t.categoryLabel(category))}
                  </p>
                  <p>
                    <Link to="/ask">{t.ui.archive.writeYours}</Link>
                  </p>
                </div>
              </div>
            ) : (
              <ul className="problem-list">
                {problems.map((problem) => (
                  <li key={problem.id}>
                    <Link to={`/problem/${problem.id}`} className="problem-card">
                      <span className="problem-meta">
                        {t.ui.archive.anonymous} · {t.formatDate(problem.created_at)} ·{' '}
                        {t.categoryLabel(problem.category)}
                      </span>
                      <span className="problem-excerpt">{problem.body}</span>
                      <span className="problem-more">{t.ui.archive.readReply}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
