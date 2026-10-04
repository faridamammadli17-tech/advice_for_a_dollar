import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';

import './Recover.css';

/**
 * Lost magic link.
 *
 * The spec asks for this to stay warm and playful — "the bunny shrugs" — and
 * specifically not to look like a corporate password reset. Someone arriving
 * here has lost the link to something difficult they wrote, and the tone
 * should not add to that.
 *
 * Two factors, because one is not enough and a salted hash cannot be looked up
 * globally:
 *
 *   - the secret word they chose, and
 *   - roughly when they wrote, which narrows the search to a small set
 *
 * Anything that does not verify gets the same answer, after the same delay.
 */
export function Recover() {
  const [secretWord, setSecretWord] = useState('');
  const [month, setMonth] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    { searched: true; link: string | null; unreachable?: boolean } | null
  >(null);

  const search = async () => {
    setBusy(true);
    setResult(null);

    // A month becomes a window with a month of slack either side, because
    // "roughly when" is the most anyone remembers about a bad week.
    let from: string | undefined;
    let to: string | undefined;
    if (month !== '') {
      const picked = new Date(`${month}-01T00:00:00.000Z`);
      if (!Number.isNaN(picked.getTime())) {
        const start = new Date(picked);
        start.setUTCMonth(start.getUTCMonth() - 1);
        const end = new Date(picked);
        end.setUTCMonth(end.getUTCMonth() + 2);
        from = start.toISOString();
        to = end.toISOString();
      }
    }

    try {
      const response = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secretWord, from, to }),
      });
      if (!response.ok) {
        setResult({ searched: true, link: null, unreachable: true });
        return;
      }
      const data = (await response.json()) as { link?: unknown };
      setResult({ searched: true, link: typeof data.link === 'string' ? data.link : null });
    } catch {
      // Offline, or the server is down. Say so, rather than "nothing matched",
      // which would send someone off to doubt a secret word that was right.
      setResult({ searched: true, link: null, unreachable: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="recover">
        <div className="wrap wrap-narrow stack" style={{ gap: '22px' }}>
          <header className="stack" style={{ gap: '10px' }}>
            <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
            <h1 className="h1">Lost your link?</h1>
            <p className="lede">
              It happens. If you remember your secret word and roughly when you wrote, we can look.
            </p>
          </header>

          <form
            className="panel stack"
            style={{ gap: '18px' }}
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <div className="field">
              <label className="field-label" htmlFor="recover-word">
                Your secret word
              </label>
              <input
                id="recover-word"
                className="input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={secretWord}
                onChange={(event) => setSecretWord(event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="recover-month">
                Roughly when did you write?
              </label>
              <input
                id="recover-month"
                className="input"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                aria-describedby="recover-month-help"
              />
              <p className="field-help" id="recover-month-help">
                Near enough is fine — we look a month either side. Leaving it blank searches the
                last three months.
              </p>
            </div>

            <div className="row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || secretWord.trim() === ''}
              >
                {busy ? 'Looking…' : 'Look for it'}
              </button>
            </div>
          </form>

          {result !== null && (
            <div className="panel recover-result" aria-live="polite">
              {result.unreachable === true ? (
                <>
                  <h2 className="h3">Could not reach the server.</h2>
                  <p className="prose">Nothing was searched. Please try again in a moment.</p>
                </>
              ) : result.link !== null ? (
                <>
                  <h2 className="h3">Found it.</h2>
                  <p className="prose">Here is your link. Save it somewhere this time.</p>
                  <Link className="btn btn-primary" to={result.link}>
                    Open my submission
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="h3">Nothing matched those details.</h2>
                  <p className="prose">
                    The bunny had a look and came back empty-pawed. It might be a different word, or
                    a different month — it is worth trying again with another guess at the date.
                  </p>
                  <p className="field-help">
                    If a submission was deleted, it is gone for good and cannot be found this way.
                  </p>
                </>
              )}
            </div>
          )}

          {/*
            Both of these are stated upfront, for everybody, rather than shown
            when they become relevant.

            The second one exists because of a genuine tension. The rate limit
            has to be invisible — if being throttled looked different from not
            matching, that difference would itself answer "does a submission
            exist for this word". But an invisible limit means someone who
            mistypes a few times gets the same "nothing matched" answer
            forever and concludes their word is wrong, which is a miserable
            outcome for exactly the person this page is for.

            Saying it unconditionally resolves both: the throttled visitor
            knows to come back, and nothing is revealed, because the sentence
            is the same whether or not they matched.
          */}
          <p className="field-help">
            We never say whether a submission exists for a word that does not match. Every
            unsuccessful search gets this same answer.
          </p>
          <p className="field-help">
            Searches are limited to a handful every quarter of an hour. If you have tried several
            times already, wait a little and try again — after that many attempts the answer stops
            being meaningful.
          </p>

          <p>
            <Link to="/ask">Write something new instead</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
