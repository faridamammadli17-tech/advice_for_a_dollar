import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SafetyInterstitial } from '../components/SafetyInterstitial';
import { FlowDialog } from '../components/FlowDialog';
import { SubmissionFlow } from '../components/SubmissionFlow';
import { WritingPad } from '../components/WritingPad';
import { BunnyPortrait } from '../components/Bunny';
import { TypingFrog } from '../components/TypingFrog';
import { copy } from '../content/placeholder';
import { FEATURES } from '../config/features';
import { readDraft, writeDraft } from '../lib/submissions/draft';
import { asSafetyCategory } from '../lib/safety/screen';
import { checkWriting } from '../lib/submissions/writeStep';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatMinorUnits, MINIMUM_MINOR_UNITS } from '../lib/money';

import './Home.css';

/**
 * The homepage.
 *
 * The forest fills the whole page. In the middle of it sits the writing box:
 * one line, the frog typing at his computer beside it on the top edge of the
 * writing area, the writing area itself, the button, and Chiron's name card
 * hanging off the bottom edge. Then: who is writing back, why it costs what
 * it costs, and a real example. (The final invitation at the foot was
 * deleted by the owner on 2026-10-22.)
 *
 * The writing box is the hero rather than a thing below it. Someone arriving
 * mid-crisis should not have to read a landing page before they find out
 * where to put the sentence they came here to write. Farida cut the headline
 * and the paragraph above the writing area on 2026-10-06 for that reason.
 *
 * The rest of the flow (secret word, private or public, pay, the magic link)
 * opens in a box over this page (FlowDialog + SubmissionFlow) once the text
 * has passed `checkWriting`, so nobody is bounced to another page after
 * writing the hard part. Every "Get advice" link on the site leads here, to
 * the writing area; the old /ask address redirects here too.
 */
export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState(readDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safety, setSafety] = useState<{ category: string | null } | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowLocked, setFlowLocked] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const focusWriting = useCallback(() => {
    const area = document.getElementById('home-write');
    stageRef.current?.scrollIntoView({ block: 'center' });
    area?.focus({ preventScroll: true });
  }, []);
  // Every page shows the forest now (PageShell); this one adds nothing to it.

  /* A link to "Get advice" from anywhere on the site lands on the writing
     area; the back button or a reload closes the box (its flag is in the
     history entry, see openFlow). On a reload with the flag still set, the
     text is checked again before the box may reopen. */
  const state = location.state as { focusWriting?: boolean; flow?: boolean } | null;
  useEffect(() => {
    if (state?.focusWriting === true) {
      navigate('/', { replace: true, state: null });
      focusWriting();
    }
  }, [state, navigate, focusWriting]);

  useEffect(() => {
    if (state?.flow !== true) {
      setFlowOpen(false);
      return;
    }
    if (flowOpen) return;
    let cancelled = false;
    void checkWriting(readDraft()).then((outcome) => {
      if (cancelled) return;
      if (outcome.kind === 'ok') setFlowOpen(true);
      else navigate('/', { replace: true, state: null });
    });
    return () => {
      cancelled = true;
    };
    // Only when the flag changes: the box must not re-check while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.flow]);

  const openFlow = () => {
    setFlowOpen(true);
    navigate('/', { state: { flow: true } });
  };

  const closeFlow = useCallback(() => {
    setFlowOpen(false);
    if (window.history.state?.usr?.flow === true) navigate('/', { replace: true, state: null });
  }, [navigate]);

  // "Change what I wrote": the cursor goes back into the writing area once
  // the box has closed (closing a dialog moves focus itself, so not before).
  const focusAfterClose = useRef(false);
  const changeWriting = () => {
    focusAfterClose.current = true;
    closeFlow();
  };
  const handleClosed = useCallback(() => {
    if (!focusAfterClose.current) return;
    focusAfterClose.current = false;
    focusWriting();
  }, [focusWriting]);
  // The frog is 3x where the box has its full width and 2x below that; the
  // writing on his monitor is the thing that has to stay readable (Farida,
  // 2026-10-06), and Home.css wraps him under the line on a phone.
  const wideBox = useMediaQuery('(min-width: 700px)');

  const handleChange = (value: string) => {
    setText(value);
    // Persisted on every keystroke so nothing is lost between here and /ask.
    writeDraft(value);
  };

  /**
   * "Get advice" runs the one check there is (`checkWriting`): too short and
   * you stay here with the same message; the safety screen runs; flagged
   * means the crisis screen and nothing else; only text that passes opens
   * the box, on the secret word.
   */
  const startAsking = async () => {
    writeDraft(text);
    setError(null);
    setBusy(true);
    const outcome = await checkWriting(text);
    setBusy(false);

    if (outcome.kind === 'problem') {
      setError(outcome.message);
      return;
    }
    if (outcome.kind === 'flagged') {
      setSafety({ category: outcome.category });
      return;
    }
    openFlow();
  };

  if (safety !== null) {
    // Their words stay in the box (and in the draft) for when they come back.
    return (
      <SafetyInterstitial
        category={asSafetyCategory(safety.category)}
        onBack={() => setSafety(null)}
      />
    );
  }

  return (
    <PageShell>
      {/* ------------------------------------------------------------ hero */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-stage" ref={stageRef}>
            <div className="hero-card">
              {/* The one line above the writing area is the textarea's label,
                  so it is also its accessible name. The frog at his computer
                  sits beside it, his desk on the writing area's top edge
                  (TypingFrog; placement in Home.css). */}
              <WritingPad
                id="home-write"
                label={copy.hero.writeLine}
                placeholder={copy.hero.writeHint}
                value={text}
                onChange={handleChange}
                typist={<TypingFrog scale={wideBox ? 3 : 2} className="hero-frog" />}
              />

              {error !== null && <p className="field-error">{error}</p>}

              <div className="row hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void startAsking()}
                  disabled={busy}
                >
                  {busy ? 'Just a moment…' : copy.hero.primaryCta}
                </button>
                <span className="hero-price">
                  {formatMinorUnits(MINIMUM_MINOR_UNITS)} minimum · pay what you want
                </span>
              </div>

              <p className="hero-assurance">
                Chiron reads this and writes back. {copy.responseTime}
              </p>

              {/* Chiron's name card: the bunny's portrait (the same art as the
                  logo) and the name, nothing else. It hangs off the box's
                  bottom edge, below the line above, never over it. */}
              <figure className="chiron">
                <BunnyPortrait label="Chiron" />
                <figcaption className="chiron-name">Chiron</figcaption>
              </figure>
            </div>
          </div>

          {FEATURES.archive ? (
            <p className="hero-alt">
              {copy.hero.secondaryLead} <Link to="/archive">{copy.hero.secondaryCta}</Link>{' '}
              {copy.hero.secondaryTail}
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

      {/* ----------------------------------------------------- why one dollar */}
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
                Nothing is generated for this space. It stays empty until Chiron chooses a real
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
              <p className="example-from">From: Chiron</p>
            </article>
          )}
        </div>
      </section>

      <FlowDialog
        open={flowOpen}
        locked={flowLocked}
        label="Sending your problem"
        onClose={closeFlow}
        onClosed={handleClosed}
      >
        <SubmissionFlow
          text={text}
          onChangeWriting={changeWriting}
          onClose={closeFlow}
          onLocked={setFlowLocked}
          onSafety={(category) => {
            closeFlow();
            setSafety({ category });
          }}
          onCreated={() => setText('')}
        />
      </FlowDialog>
    </PageShell>
  );
}
