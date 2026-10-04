import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { type StaticPage as StaticPageContent } from '../content/pages';

import './StaticPage.css';

/**
 * Renders a content page from data.
 *
 * One component rather than six near-identical ones, because these pages
 * differ only in words. A page still waiting on Farida carries a visible
 * notice — an unfinished page should look unfinished, not quietly ship.
 */
export function StaticPageView({ page }: { page: StaticPageContent }) {
  return (
    <PageShell>
      <section className="static">
        <article className="wrap wrap-narrow stack" style={{ gap: '28px' }}>
          <header className="stack" style={{ gap: '12px' }}>
            <h1 className="h1">{page.title}</h1>
            {page.intro !== undefined && <p className="lede">{page.intro}</p>}
            {page.awaitingOwnerContent === true && (
              <p className="awaiting">
                This page is unfinished. The words here are placeholders and are not Farida&rsquo;s.
              </p>
            )}
          </header>

          {page.sections.map((section) => (
            <section className="stack" key={section.heading} style={{ gap: '12px' }}>
              <h2 className="h3">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p className="prose" key={paragraph.slice(0, 28)}>
                  {paragraph}
                </p>
              ))}
              {section.bullets !== undefined && (
                <ul className="static-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 28)}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <footer className="static-foot">
            <Link to="/ask" className="btn btn-primary">
              Write your problem
            </Link>
          </footer>
        </article>
      </section>
    </PageShell>
  );
}
