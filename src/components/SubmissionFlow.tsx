import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeCeremony } from './EnvelopeCeremony';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { useT } from '../i18n';
import { clearDraft } from '../lib/submissions/draft';
import { visitorApi } from '../lib/api/client';
import { checkSecretWord } from '../lib/submissions/secretWord';
import { IS_PREVIEW, previewCreate } from '../lib/preview/fakeSubmissions';
import { mockPaymentProvider } from '../lib/payments/MockPaymentProvider';
import { type Visibility } from '../lib/submissions/types';
import {
  checkAmount,
  formatMinorUnits,
  MINIMUM_MINOR_UNITS,
  parseAmountToMinorUnits,
  SUGGESTED_MINOR_UNITS,
} from '../lib/money';

import './SubmissionFlow.css';

type Step = 'secret' | 'visibility' | 'pay' | 'sending' | 'done';

const STEP_LABELS: readonly { step: 'write' | 'secret' | 'visibility' | 'pay' }[] = [
  { step: 'write' },
  { step: 'secret' },
  { step: 'visibility' },
  { step: 'pay' },
];

export type SubmissionFlowProps = {
  /** The text that passed `checkWriting`. Writing happens outside this box. */
  text: string;
  /** "Change what I wrote": close the box and go back to the writing area. */
  onChangeWriting: () => void;
  /** The box is closed by hand; nothing is lost. */
  onClose: () => void;
  /** Set while something is being sent, so the box cannot be closed. */
  onLocked: (locked: boolean) => void;
  /** The server refused on submit: show the crisis screen instead. */
  onSafety: (category: string | null) => void;
  /** A submission exists now; the draft is cleared. */
  onCreated: () => void;
};

/**
 * The steps after writing: secret word, private or public, pay, then the
 * magic link. Shown in a box over the home page (FlowDialog), with the step
 * indicator at the top and step 1 marked done, because the text was checked
 * (length and the safety screen, `checkWriting`) before this box could open.
 *
 * At every step the visitor is told what happens next. The envelope ceremony
 * and the request race; whichever finishes last reveals the confirmation,
 * and the request is never gated on the animation. The server screens the
 * text again on submit regardless of what happened before.
 */
export function SubmissionFlow({
  text,
  onChangeWriting,
  onClose,
  onLocked,
  onSafety,
  onCreated,
}: SubmissionFlowProps) {
  const t = useT();
  const copy = t.copy;
  const [step, setStep] = useState<Step>('secret');
  const [error, setError] = useState<string | null>(null);

  const [secretWord, setSecretWord] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [amountMinorUnits, setAmountMinorUnits] = useState<number>(MINIMUM_MINOR_UNITS);
  const [customAmount, setCustomAmount] = useState('');

  const [created, setCreated] = useState<{
    token: string;
    body: string;
    visibility: Visibility;
  } | null>(null);
  const [ceremonyDone, setCeremonyDone] = useState(false);
  const [requestDone, setRequestDone] = useState(false);

  const firstField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstField.current?.focus();
  }, []);

  useEffect(() => {
    onLocked(step === 'sending');
  }, [step, onLocked]);

  /* ------------------------------------------------------------ secret step */

  const submitSecret = () => {
    const problem = checkSecretWord(secretWord);
    if (problem === 'empty') {
      setError(t.ui.flow.secretEmpty);
      return;
    }
    if (problem === 'too-short') {
      setError(t.ui.flow.secretShort);
      return;
    }
    if (problem === 'too-long') {
      setError(t.ui.flow.secretLong);
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
      setError(t.ui.flow.amountNaN);
      return;
    }
    if (problem === 'below-minimum') {
      setError(t.ui.flow.amountBelow(formatMinorUnits(MINIMUM_MINOR_UNITS)));
      return;
    }
    if (problem === 'above-maximum') {
      setError(t.ui.flow.amountAbove);
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

      if (IS_PREVIEW) {
        // The static design preview has no server: keep a pretend submission
        // in the browser so the magic-link page can be seen. Never a real build.
        const token = previewCreate({ body: text, visibility, amountMinorUnits: amount });
        setCreated({ token, body: text, visibility });
        clearDraft();
        onCreated();
        setRequestDone(true);
        return;
      }

      const result = await visitorApi.submit({
        body: text,
        secretWord,
        visibility,
        amountMinorUnits: amount,
        email: null,
        transactionId: checkout.transactionId,
      });

      if (!result.ok) {
        setError(t.ui.flow.serverRefused);
        setStep('pay');
        return;
      }
      if (result.data.ok === false) {
        // The server screened again and refused. It always wins.
        onSafety(result.data.category);
        return;
      }

      setCreated({ token: result.data.token, body: text, visibility });
      clearDraft();
      onCreated();
      setRequestDone(true);
    } catch {
      // The text is untouched, and the draft is still in storage. Nothing the
      // visitor wrote is lost because a card failed.
      setError(t.ui.flow.paymentFailed);
      setStep('pay');
    }
  };

  const handleCeremonyDone = useCallback(() => setCeremonyDone(true), []);

  if (step === 'sending' && ceremonyDone && requestDone && created !== null) {
    return <Confirmation view={created} secretWord={secretWord} onClose={onClose} />;
  }

  /* ----------------------------------------------------------------- render */

  return (
    <div className="flow">
      {step !== 'sending' && (
        <StepTrail current={step} labels={t.ui.flow.steps} ariaLabel={t.ui.flow.whereYouAre} />
      )}

      {step === 'secret' && (
        <div className="stack" style={{ gap: '18px' }}>
          <h2 className="h1">{copy.ask.secretWordHeading}</h2>
          <p className="prose">{copy.ask.secretWordWhy}</p>

          <div className="panel field">
            <label className="field-label" htmlFor="secret-word">
              {t.ui.flow.secretLabel}
            </label>
            <input
              ref={firstField}
              id="secret-word"
              className="input"
              type="text"
              value={secretWord}
              onChange={(event) => setSecretWord(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="field-help">{t.ui.flow.secretHelp}</p>
          </div>

          {error !== null && <p className="field-error">{error}</p>}

          <div className="row">
            <button type="button" className="btn btn-primary" onClick={submitSecret}>
              {t.ui.flow.continue}
            </button>
            {/* The writing step was done in the box behind, so this is the
                way back to a typo. The text is still there. */}
            <button type="button" className="btn btn-quiet" onClick={onChangeWriting}>
              {t.ui.flow.changeWriting}
            </button>
            <span className="flow-next">{t.ui.flow.nextVisibility}</span>
          </div>
        </div>
      )}

      {step === 'visibility' && (
        <div className="stack" style={{ gap: '18px' }}>
          <h2 className="h1">{copy.ask.visibilityHeading}</h2>
          <p className="prose">{copy.ask.visibilityWhy}</p>

          <div className="choices">
            <ChoiceCard
              selected={visibility === 'private'}
              onSelect={() => setVisibility('private')}
              title={t.ui.flow.privateTitle}
              body={t.ui.flow.privateBody}
            />
            <ChoiceCard
              selected={visibility === 'public'}
              onSelect={() => setVisibility('public')}
              title={t.ui.flow.publicTitle}
              body={t.ui.flow.publicBody}
            />
          </div>

          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => setStep('pay')}>
              {t.ui.flow.continue}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setStep('secret')}>
              {t.ui.flow.back}
            </button>
            <span className="flow-next">{t.ui.flow.nextPay}</span>
          </div>
        </div>
      )}

      {step === 'pay' && (
        <div className="stack" style={{ gap: '18px' }}>
          <h2 className="h1">{copy.ask.paymentHeading}</h2>
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
                {t.ui.flow.otherAmount}
              </label>
              <input
                id="custom-amount"
                className="input"
                type="text"
                inputMode="decimal"
                placeholder={t.ui.flow.amountPlaceholder(formatMinorUnits(MINIMUM_MINOR_UNITS))}
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>

            {import.meta.env.DEV && (
              <p className="flow-devnote">
                Mock provider — no real money. Any amount ending in .13 simulates a declined card,
                so the failure path can be walked.
              </p>
            )}
          </div>

          {error !== null && <p className="field-error">{error}</p>}

          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => void pay()}>
              {t.ui.flow.sendIt}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setStep('visibility')}>
              {t.ui.flow.back}
            </button>
            <span className="flow-next">{t.ui.flow.nextLink}</span>
          </div>
        </div>
      )}

      {step === 'sending' && <EnvelopeCeremony onDone={handleCeremonyDone} />}
    </div>
  );
}

/* ---------------------------------------------------------------- fragments */

function StepTrail({
  current,
  labels,
  ariaLabel,
}: {
  current: Step;
  labels: Readonly<Record<'write' | 'secret' | 'visibility' | 'pay', string>>;
  ariaLabel: string;
}) {
  const currentIndex = STEP_LABELS.findIndex((entry) => entry.step === current);
  return (
    <ol className="trail" aria-label={ariaLabel}>
      {STEP_LABELS.map((entry, index) => (
        <li
          key={entry.step}
          className="trail-step"
          aria-current={entry.step === current ? 'step' : undefined}
          data-state={index < currentIndex ? 'done' : index === currentIndex ? 'now' : 'todo'}
        >
          <span className="trail-num">{index + 1}</span>
          {labels[entry.step]}
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
  onClose,
}: {
  view: { token: string; body: string; visibility: Visibility };
  secretWord: string;
  onClose: () => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const magicLink = IS_PREVIEW
    ? `${window.location.origin}${window.location.pathname}#/a/${view.token}`
    : `${window.location.origin}/a/${view.token}`;

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
    <div className="flow stack" style={{ gap: '22px' }}>
      <div className="confirm-head">
        <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
        <h2 className="h1">{t.ui.flow.linkHeading}</h2>
      </div>

      <div className="panel stack" style={{ gap: '10px' }}>
        <span className="field-label">{t.ui.flow.yourLink}</span>
        <code className="magic-link">{magicLink}</code>
        <div className="row">
          <button type="button" className="btn" onClick={() => void copyLink()}>
            {copied ? t.ui.flow.copied : t.ui.flow.copyLink}
          </button>
          <Link to={`/a/${view.token}`} className="btn btn-quiet">
            {t.ui.flow.openIt}
          </Link>
        </div>
        <p className="field-help">{t.ui.flow.saveLink}</p>
      </div>

      <div className="panel stack" style={{ gap: '10px' }}>
        <span className="field-label">{t.ui.flow.secretLabel}</span>
        <code className="secret-shown">{secretWord}</code>
        <p className="field-help">{t.ui.flow.secretShownHelp}</p>
      </div>

      <div className="panel panel-flat stack" style={{ gap: '10px' }}>
        <span className="field-label">{t.ui.flow.whatYouSent}</span>
        <p className="prose confirm-body">{view.body}</p>
      </div>

      <div className="stack" style={{ gap: '8px' }}>
        <h3 className="h3">{t.ui.flow.whatNow}</h3>
        <ul className="next-list">
          <li>
            {t.ui.flow.nowReads} {t.copy.responseTime}
          </li>
          {view.visibility === 'public' && <li>{t.ui.flow.nowPublic}</li>}
          <li>{t.ui.flow.nowReturn}</li>
          <li>{t.ui.flow.nowDelete}</li>
        </ul>
      </div>

      <div className="row">
        <button type="button" className="btn" onClick={onClose}>
          {t.ui.flow.submitAnother}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          {t.ui.flow.backToStart}
        </button>
      </div>
    </div>
  );
}
