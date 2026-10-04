import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { copy } from '../content/placeholder';
import { FEATURES } from '../config/features';
import { visitorApi, type VisitorSubmission } from '../lib/api/client';

import './Answer.css';

type Load =
  | { state: 'loading' }
  | { state: 'found'; view: VisitorSubmission }
  | { state: 'not-found' }
  | { state: 'deleted' };

/**
 * The answer page, reached through the magic link.
 *
 * Meant to read like a letter rather than a dashboard. States covered:
 * waiting, answered, follow-up sent, final reply received, deleted, and an
 * unknown link — which gets a warm explanation, never a stack trace.
 */
export function Answer() {
  const { token = '' } = useParams();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [followUpText, setFollowUpText] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const refresh = useCallback(async () => {
    const result = await visitorApi.getByToken(token);
    if (result.ok) {
      setLoad({ state: 'found', view: result.data.submission });
    } else if (result.status === 410) {
      // Gone, deliberately: deleted submissions say so rather than pretending
      // the link was never valid.
      setLoad({ state: 'deleted' });
    } else {
      setLoad({ state: 'not-found' });
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitFollowUp = async () => {
    setFollowUpError(null);
    if (followUpText.trim().length < 2) {
      setFollowUpError('There is nothing written yet.');
      return;
    }
    const result = await visitorApi.sendFollowUp(token, followUpText);
    if (!result.ok || result.data.ok === false) {
      setFollowUpError('That did not send. Your words are still here — try again.');
      return;
    }
    setFollowUpText('');
    await refresh();
  };

  const confirmDelete = async () => {
    await visitorApi.deleteSubmission(token);
    await refresh();
  };

  /* ------------------------------------------------------------- loading */

  if (load.state === 'loading') {
    return (
      <PageShell>
        <section className="letter">
          <div className="wrap wrap-narrow">
            <p className="letter-quiet">Finding your submission…</p>
          </div>
        </section>
      </PageShell>
    );
  }

  /* ------------------------------------------------------- unknown link */

  if (load.state === 'not-found') {
    return (
      <PageShell>
        <section className="letter">
          <div className="wrap wrap-narrow stack" style={{ gap: '16px' }}>
            <SpriteCanvas sprite={bunnySprite} scale={2} alt={null} />
            <h1 className="h1">This link doesn&rsquo;t lead anywhere.</h1>
            <p className="prose">
              It may have been mistyped, or it may belong to a submission that has since been
              deleted. Nothing is wrong on your end.
            </p>
            {FEATURES.recovery && (
              <p className="prose">
                If you still have your secret word, you can recover a submission instead.
              </p>
            )}
            <div className="row">
              {FEATURES.recovery && (
                <Link to="/recover" className="btn">
                  Recover with my secret word
                </Link>
              )}
              <Link to="/" className="btn btn-quiet">
                Back to the start
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  /* ------------------------------------------------------------- deleted */

  if (load.state === 'deleted') {
    return (
      <PageShell>
        <section className="letter">
          <div className="wrap wrap-narrow stack" style={{ gap: '16px' }}>
            <h1 className="h1">This one is gone.</h1>
            <p className="prose">
              You deleted it. The text, the reply and this link are all finished with — there is no
              copy to bring back, which is the point.
            </p>
            <div className="row">
              <Link to="/ask" className="btn btn-primary">
                Write something new
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  /* --------------------------------------------------------------- found */

  const { view } = load;
  const answered = view.status === 'answered' && view.answer !== null;
  const followUpSent = view.followUp !== null;
  const finalReplyIn = view.followUp?.reply != null;

  return (
    <PageShell>
      <section className="letter">
        <div className="wrap wrap-narrow stack" style={{ gap: '28px' }}>
          <header className="stack" style={{ gap: '8px' }}>
            <span className="eyebrow">Your submission</span>
            <p className="letter-date">
              Sent {new Date(view.createdAt).toLocaleDateString()} ·{' '}
              {view.visibility === 'public' ? 'Asked to be published' : 'Private'}
            </p>
          </header>

          <article className="letter-block">
            <h2 className="h3">Your problem</h2>
            <p className="letter-body">{view.body}</p>
          </article>

          {!answered && (
            <div className="letter-waiting">
              <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
              <div className="stack" style={{ gap: '6px' }}>
                <h2 className="h3">Not answered yet</h2>
                <p className="prose">
                  Farida has it. {copy.responseTime} Nothing more is needed from you — come back
                  through this link.
                </p>
              </div>
            </div>
          )}

          {answered && (
            <article className="letter-block letter-reply">
              <h2 className="h3">A response</h2>
              <p className="letter-body">{view.answer}</p>
              <p className="letter-from">From: Farida</p>
            </article>
          )}

          {answered && followUpSent && view.followUp !== null && (
            <article className="letter-block">
              <h2 className="h3">Your follow-up</h2>
              <p className="letter-body">{view.followUp.body}</p>
              {finalReplyIn ? (
                <>
                  <hr className="letter-rule" />
                  <h2 className="h3">Farida&rsquo;s reply</h2>
                  <p className="letter-body">{view.followUp.reply}</p>
                  <p className="letter-from">From: Farida</p>
                </>
              ) : (
                <p className="letter-quiet">
                  Sent. Farida will reply once more, and that closes the conversation.
                </p>
              )}
            </article>
          )}

          {answered && !followUpSent && (
            <div className="letter-block stack" style={{ gap: '12px' }}>
              <h2 className="h3">One follow-up, if you need it</h2>
              <p className="field-help">
                You can send one message back, and Farida replies once more. That is the whole
                exchange — it is not a chat.
              </p>
              <textarea
                className="textarea"
                value={followUpText}
                onChange={(event) => setFollowUpText(event.target.value)}
                aria-label="Your follow-up"
              />
              {followUpError !== null && <p className="field-error">{followUpError}</p>}
              <div className="row">
                <button type="button" className="btn btn-primary" onClick={submitFollowUp}>
                  Send follow-up
                </button>
              </div>
            </div>
          )}

          <footer className="letter-foot stack" style={{ gap: '12px' }}>
            <div className="row">
              <Link to="/ask" className="btn">
                Submit another problem
              </Link>
              {!confirmingDelete ? (
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete this
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                    Yes, delete it permanently
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Keep it
                  </button>
                </>
              )}
            </div>
            {confirmingDelete && (
              <p className="field-help">
                This cannot be undone. The text and any reply are destroyed, and this link stops
                working.
              </p>
            )}
          </footer>
        </div>
      </section>
    </PageShell>
  );
}
