import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { WritingPad } from '../components/WritingPad';
import { SafetyInterstitial } from '../components/SafetyInterstitial';
import { EnvelopeCeremony } from '../components/EnvelopeCeremony';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { copy } from '../content/placeholder';
import { clearDraft, readDraft, writeDraft } from '../lib/submissions/draft';
import { visitorApi } from '../lib/api/client';
import { asSafetyCategory } from '../lib/safety/screen';
import { checkSecretWord } from '../lib/submissions/secretWord';
import { mockPaymentProvider } from '../lib/payments/MockPaymentProvider';
import { MAX_BODY_CHARS, type Visibility } from '../lib/submissions/types';
import {
  checkAmount,
  formatMinorUnits,
  MINIMUM_MINOR_UNITS,
  parseAmountToMinorUnits,
  SUGGESTED_MINOR_UNITS,
} from '../lib/money';

import './Ask.css';

type Step = 'write' | 'secret' | 'visibility' | 'pay' | 'sending' | 'done';

const STEP_LABELS: readonly { step: Step; label: string }[] = [
  { step: 'write', label: 'Write' },
  { step: 'secret', label: 'Secret word' },
  { step: 'visibility', label: 'Private or public' },
  { step: 'pay', label: 'Pay' },
];

/**
 * The submission flow.
 *
 * At every step the visitor is told what happens next, because the spec asks
 * for it and because a flow that hides its own shape is how people abandon
 * halfway through writing something difficult.
 *
 * The safety screen runs at the end of the writing step — before the secret
 * word, before the visibility choice, and before anything resembling a card.
 * `api.createSubmission` screens again regardless, so skipping the UI does not
 * skip the check.
 */
export function Ask() {
  const [step, setStep] = useState<Step>('write');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState(readDraft);
  const [secretWord, setSecretWord] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [amountMinorUnits, setAmountMinorUnits] = useState<number>(MINIMUM_MINOR_UNITS);
  const [customAmount, setCustomAmount] = useState('');

  const [safety, setSafety] = useState<{ category: string | null } | null>(null);
  const [created, setCreated] = useState<{ token: string; body: string; visibility: Visibility } | null>(null);

  // The ceremony and the request race; whichever finishes last reveals the
  // confirmation. The request is never gated on the animation.
  const [ceremonyDone, setCeremonyDone] = useState(false);
  const [requestDone, setRequestDone] = useState(false);

  const handleText = (value: string) => {
    setText(value);
    writeDraft(value);
  };

  /* ------------------------------------------------------------- write step */

  const submitWriting = async () => {
    setError(null);
    if (text.trim().length < 20) {
      setError('A little more to go on would help. Even a few sentences.');
      return;
    }
    if (text.length > MAX_BODY_CHARS) {
      setError(
        `That is longer than can be read in one sitting. Please keep it under ${MAX_BODY_CHARS.toLocaleString('en')} characters.`,
      );
      return;
    }

    setBusy(true);
    const result = await visitorApi.screen(text);
    setBusy(false);

    if (!result.ok) {
      setError('Could not reach the server. Your words are saved — try again in a moment.');
      return;
    }
    if (result.data.flagged) {
      // Stop here. Nothing created, nothing charged, text untouched.
      setSafety({ category: result.data.category });
      return;
    }
    setStep('secret');
  };

  /* ------------------------------------------------------------ secret step */

  const submitSecret = () => {
    const problem = checkSecretWord(secretWord);
    if (problem === 'empty') {
      setError('Please choose a word.');
      return;
    }
    if (problem === 'too-short') {
      setError('A little longer — at least four characters.');
      return;
    }
    if (problem === 'too-long') {
      setError('That is longer than it needs to be.');
      return;
    }
    setError(null);
    setStep('visibility');
  };

  /* --------------------------------------------------------------- pay step */

  const resolveAmount = (): number | null => {
    if (customAmount.trim() !== '') {
      return parseAmountToMinorUnits(customAmount);
    }
    return amountMinorUnits;
  };

  const pay = async () => {
    setError(null);
    const amount = resolveAmount();
    const problem = checkAmount(amount);

    if (problem === 'not-a-number') {
      setError('That does not look like an amount.');
      return;
    }
    if (problem === 'below-minimum') {
      setError(`The minimum is ${formatMinorUnits(MINIMUM_MINOR_UNITS)}.`);
      return;
    }
    if (problem === 'above-maximum') {
      setError('That is a very large amount — please check it.');
      return;
    }
    if (amount === null) return;

    setStep('sending');
    setCeremonyDone(false);
    setRequestDone(false);

    try {
      const checkout = await mockPaymentProvider.createCheckout({
        amountMinorUnits: amount,
        currency: 'AZN',
        submissionId: 'pending',
      });

      const result = await visitorApi.submit({
        body: text,
        secretWord,
        visibility,
        amountMinorUnits: amount,
        email: null,
        transactionId: checkout.transactionId,
      });

      if (!result.ok) {
        setError('The server could not take it just now. Nothing was charged, and your words are safe.');
        setStep('pay');
        return;
      }
      if (result.data.ok === false) {
        // The server screened again and refused. It always wins.
        setSafety({ category: result.data.category });
        setStep('write');
        return;
      }

      setCreated({ token: result.data.token, body: text, visibility });
      clearDraft();
      setRequestDone(true);
    } catch {
      // The text is untouched, and the draft is still in storage. Nothing the
      // visitor wrote is lost because a card failed.
      setError('The payment did not go through. Nothing was charged, and your words are safe.');
      setStep('pay');
    }
  };

  const handleCeremonyDone = useCallback(() => setCeremonyDone(true), []);

  if (step === 'sending' && ceremonyDone && requestDone && created !== null) {
    return <Confirmation view={created} secretWord={secretWord} />;
  }
  if (step === 'done' && created !== null) {
    return <Confirmation view={created} secretWord={secretWord} />;
  }

  /* ------------------------------------------------------------ safety stop */

  if (safety !== null) {
    return (
      <SafetyInterstitial
        category={asSafetyCategory(safety.category)}
        onBack={() => {
          setSafety(null);
          setStep('write');
        }}
      />
    );
  }

  /* ----------------------------------------------------------------- render */

  return (
    <PageShell>
      <section className="ask">
        <div className="wrap wrap-narrow ask-inner">
          {step !== 'sending' && <StepTrail current={step} />}

          {step === 'write' && (
            <div className="stack" style={{ gap: '18px' }}>
              <h1 className="h1">What is going on?</h1>
              <p className="field-help">{copy.ask.privacyNudge}</p>

              <div className="panel">
                <WritingPad
                  id="ask-write"
                  label={copy.hero.writePrompt}
                  placeholder={copy.hero.writePlaceholder}
                  value={text}
                  onChange={handleText}
                  autoFocus
                />
              </div>

              {error !== null && <p className="field-error">{error}</p>}

              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitWriting}
                  disabled={busy}
                >
                  {busy ? 'Just a moment…' : 'Continue'}
                </button>
                <span className="ask-next">Next: choose a secret word.</span>
              </div>
            </div>
          )}

          {step === 'secret' && (
            <div className="stack" style={{ gap: '18px' }}>
              <h1 className="h1">{copy.ask.secretWordHeading}</h1>
              <p className="prose">{copy.ask.secretWordWhy}</p>

              <div className="panel field">
                <label className="field-label" htmlFor="secret-word">
                  Your secret word
                </label>
                <input
                  id="secret-word"
                  className="input"
                  type="text"
                  value={secretWord}
                  onChange={(event) => setSecretWord(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="field-help">
                  It is stored scrambled, never in plain text, and never shown to anyone else.
                </p>
              </div>

              {error !== null && <p className="field-error">{error}</p>}

              <div className="row">
                <button type="button" className="btn btn-primary" onClick={submitSecret}>
                  Continue
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setStep('write')}>
                  Back
                </button>
                <span className="ask-next">Next: private or public.</span>
              </div>
            </div>
          )}

          {step === 'visibility' && (
            <div className="stack" style={{ gap: '18px' }}>
              <h1 className="h1">{copy.ask.visibilityHeading}</h1>
              <p className="prose">{copy.ask.visibilityWhy}</p>

              <div className="choices">
                <ChoiceCard
                  selected={visibility === 'private'}
                  onSelect={() => setVisibility('private')}
                  title="Keep it private"
                  body="Only you and Farida ever see it. It never appears anywhere else."
                />
                <ChoiceCard
                  selected={visibility === 'public'}
                  onSelect={() => setVisibility('public')}
                  title="Let it be published"
                  body="Farida reads it first and decides. If she publishes it, it appears without your name — and you can still delete it."
                />
              </div>

              <div className="row">
                <button type="button" className="btn btn-primary" onClick={() => setStep('pay')}>
                  Continue
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setStep('secret')}>
                  Back
                </button>
                <span className="ask-next">Next: pay what you want.</span>
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="stack" style={{ gap: '18px' }}>
              <h1 className="h1">{copy.ask.paymentHeading}</h1>
              <p className="prose">{copy.ask.paymentWhy}</p>

              <div className="panel stack" style={{ gap: '16px' }}>
                <div className="amounts">
                  {SUGGESTED_MINOR_UNITS.map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      className="amount"
                      aria-pressed={customAmount.trim() === '' && amountMinorUnits === suggested}
                      onClick={() => {
                        setAmountMinorUnits(suggested);
                        setCustomAmount('');
                      }}
                    >
                      {formatMinorUnits(suggested)}
                    </button>
                  ))}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="custom-amount">
                    Or another amount
                  </label>
                  <input
                    id="custom-amount"
                    className="input"
                    type="text"
                    inputMode="decimal"
                    placeholder={`e.g. 2.50 — minimum ${formatMinorUnits(MINIMUM_MINOR_UNITS)}`}
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                  />
                </div>

                {import.meta.env.DEV && (
                  <p className="ask-devnote">
                    Mock provider — no real money. Any amount ending in .13 simulates a declined
                    card, so the failure path can be walked.
                  </p>
                )}
              </div>

              {error !== null && <p className="field-error">{error}</p>}

              <div className="row">
                <button type="button" className="btn btn-primary" onClick={pay}>
                  Send it
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setStep('visibility')}
                >
                  Back
                </button>
                <span className="ask-next">Next: your private link.</span>
              </div>
            </div>
          )}

          {step === 'sending' && <EnvelopeCeremony onDone={handleCeremonyDone} />}
        </div>
      </section>
    </PageShell>
  );
}

/* ---------------------------------------------------------------- fragments */

function StepTrail({ current }: { current: Step }) {
  const currentIndex = STEP_LABELS.findIndex((entry) => entry.step === current);
  return (
    <ol className="trail" aria-label="Where you are">
      {STEP_LABELS.map((entry, index) => (
        <li
          key={entry.step}
          className="trail-step"
          aria-current={entry.step === current ? 'step' : undefined}
          data-state={index < currentIndex ? 'done' : index === currentIndex ? 'now' : 'todo'}
        >
          <span className="trail-num">{index + 1}</span>
          {entry.label}
        </li>
      ))}
    </ol>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button type="button" className="choice" aria-pressed={selected} onClick={onSelect}>
      <span className="choice-title">{title}</span>
      <span className="choice-body">{body}</span>
    </button>
  );
}

/* ------------------------------------------------------------- confirmation */

function Confirmation({
  view,
  secretWord,
}: {
  view: { token: string; body: string; visibility: Visibility };
  secretWord: string;
}) {
  const [copied, setCopied] = useState(false);
  const magicLink = `${window.location.origin}/a/${view.token}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PageShell>
      <section className="ask">
        <div className="wrap wrap-narrow ask-inner stack" style={{ gap: '22px' }}>
          <div className="confirm-head">
            <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
            <h1 className="h1">Here&rsquo;s your magic link.</h1>
          </div>

          <div className="panel stack" style={{ gap: '10px' }}>
            <span className="field-label">Your private link</span>
            <code className="magic-link">{magicLink}</code>
            <div className="row">
              <button type="button" className="btn" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <Link to={`/a/${view.token}`} className="btn btn-quiet">
                Open it
              </Link>
            </div>
            <p className="field-help">
              Save this somewhere. It is the only way back to your submission, and it is not sent to
              you anywhere else.
            </p>
          </div>

          <div className="panel stack" style={{ gap: '10px' }}>
            <span className="field-label">Your secret word</span>
            <code className="secret-shown">{secretWord}</code>
            <p className="field-help">
              Shown once, here. If you lose the link, this is how you prove the submission is yours.
              If you ever write again, choose a different word.
            </p>
          </div>

          <div className="panel panel-flat stack" style={{ gap: '10px' }}>
            <span className="field-label">What you sent</span>
            <p className="prose confirm-body">{view.body}</p>
          </div>

          <div className="stack" style={{ gap: '8px' }}>
            <h2 className="h3">What happens now</h2>
            <ul className="next-list">
              <li>Farida reads it and writes back. {copy.responseTime}</li>
              {view.visibility === 'public' && (
                <li>
                  You asked for this to be published. She reads it first and decides — it is not
                  public yet.
                </li>
              )}
              <li>Come back through your link to read the reply.</li>
              <li>You can delete it at any time through that link.</li>
            </ul>
          </div>

          <div className="row">
            <Link to="/ask" className="btn">
              Submit another
            </Link>
            <Link to="/" className="btn btn-quiet">
              Back to the start
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
