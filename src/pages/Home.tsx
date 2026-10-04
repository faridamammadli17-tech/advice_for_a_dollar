import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { WritingPad } from '../components/WritingPad';
import { ForestScene } from '../components/ForestScene';
import { PortraitBunny, StandingBunny } from '../components/Bunny';
import { copy } from '../content/placeholder';
import { FEATURES } from '../config/features';
import { readDraft, writeDraft } from '../lib/submissions/draft';
import { formatMinorUnits, MINIMUM_MINOR_UNITS } from '../lib/money';

import './Home.css';

/**
 * The homepage.
 *
 * The forest fills the whole page. In the middle of it sits the writing box;
 * the bunny stands at its top-right corner, close enough to be listening, and
 * her portrait sits centred beneath the staff she holds. Then: who is writing
 * back, why it costs what it costs, a real example, and a final invitation.
 *
 * The writing box is the hero rather than a thing below it. Someone arriving
 * mid-crisis should not have to read a landing page before they find out
 * where to put the sentence they came here to write.
 */
export function Home() {
  const navigate = useNavigate();
  const [text, setText] = useState(readDraft);

  const handleChange = (value: string) => {
    setText(value);
    // Persisted on every keystroke so nothing is lost between here and /ask.
    writeDraft(value);
  };

  const startAsking = () => {
    writeDraft(text);
    navigate('/ask');
  };

  return (
    <PageShell backdrop="forest">
      <ForestScene />

      {/* ------------------------------------------------------------ hero */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-stage">
            <div className="hero-card">
              <div className="hero-words">
                <span className="eyebrow">{copy.siteName}</span>
                <h1 className="h1">{copy.hero.headline}</h1>
                <p className="lede">{copy.hero.subhead}</p>
              </div>

              {/* No frog on this box: the bunny beside it is the character
                  here, and his 128px row would push the box below the fold.
                  He types along on the /ask page, where writing is the job. */}
              <WritingPad
                id="home-write"
                label={copy.hero.writePrompt}
                placeholder={copy.hero.writePlaceholder}
                value={text}
                onChange={handleChange}
                showTypist={false}
              />

              <div className="row hero-actions">
                <button type="button" className="btn btn-primary" onClick={startAsking}>
                  {copy.hero.primaryCta}
                </button>
                <span className="hero-price">
                  {formatMinorUnits(MINIMUM_MINOR_UNITS)} minimum · pay what you want
                </span>
              </div>

              <p className="hero-assurance">
                A real person reads this and writes back. {copy.responseTime}
              </p>
            </div>

            {/* The cast stands beside the card on a wide screen (top-right,
                portrait under the staff) and steps above and below it on
                narrower ones. Order and placement live in Home.css. */}
            <div className="hero-cast">
              <StandingBunny />
              <PortraitBunny />
            </div>
          </div>

          {FEATURES.archive ? (
            <p className="hero-alt">
              Or <Link to="/archive">{copy.hero.secondaryCta.toLowerCase()}</Link> first.
            </p>
          ) : (
            <p className="hero-alt hero-alt-muted">
              Reading other people’s problems is coming soon.
            </p>
          )}
        </div>
      </section>

      {/* -------------------------------------------- who is writing back */}
      <section className="section on-forest meet">
        <div className="wrap meet-inner">
          <div className="stack meet-words">
            <h2 className="h2">{copy.trust.heading}</h2>
            {/* Specified verbatim in the brief. */}
            <p className="one-human">{copy.trust.oneHuman}</p>
          </div>

          <div className="trust-grid">
            {copy.trust.points.map((point) => (
              <div className="panel panel-flat trust-card" key={point.title}>
                <h3 className="h3">{point.title}</h3>
                <p className="prose">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- why 1 AZN */}
      <section className="section on-forest on-forest-alt">
        <div className="wrap wrap-narrow stack" style={{ gap: '16px' }}>
          <h2 className="h2">{copy.whyADollar.heading}</h2>
          {copy.whyADollar.body.map((paragraph) => (
            <p className="prose" key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}
          <p className="not-therapy">{copy.whyADollar.notTherapy}</p>
        </div>
      </section>

      {/* ---------------------------------------------------------- example */}
      <section className="section on-forest">
        <div className="wrap wrap-narrow stack" style={{ gap: '18px' }}>
          <span className="eyebrow">A real example</span>

          {copy.example.awaitingOwnerContent ? (
            /* No invented advice. An empty slot with a label on it is honest;
               a convincing fake is the one thing the spec forbids outright. */
            <div className="panel example example-awaiting">
              <p className="example-awaiting-title">This is where a real exchange goes.</p>
              <p className="prose">
                Nothing is generated for this space. It stays empty until Farida chooses a real
                problem and writes the reply herself.
              </p>
            </div>
          ) : (
            <article className="panel example">
              <span className="example-category">{copy.example.category}</span>
              <h3 className="h3">The problem</h3>
              <p className="prose">{copy.example.problem}</p>
              <hr className="example-rule" />
              <h3 className="h3">The advice</h3>
              <p className="prose">{copy.example.advice}</p>
              <p className="example-from">From: Farida</p>
            </article>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- final cta */}
      <section className="section on-forest on-forest-alt final">
        <div className="wrap wrap-narrow stack" style={{ gap: '16px', alignItems: 'flex-start' }}>
          <h2 className="h2">{copy.finalCta.heading}</h2>
          <p className="lede">{copy.finalCta.body}</p>
          <Link to="/ask" className="btn btn-primary">
            {copy.finalCta.button}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
