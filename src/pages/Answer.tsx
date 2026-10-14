import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite } from '../pixel/sprites';
import { useT } from '../i18n';
import { FEATURES } from '../config/features';
import { visitorApi, type VisitorSubmission } from '../lib/api/client';
import {
  IS_PREVIEW,
  previewDelete,
  previewFollowUp,
  previewGet,
  previewMarkAnswered,
} from '../lib/preview/fakeSubmissions';

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
  const t = useT();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [followUpText, setFollowUpText] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const refresh = useCallback(async () => {
    if (IS_PREVIEW) {
      // The static design preview keeps a pretend submission in the browser.
      const stored = previewGet(token);
      if (stored === null) setLoad({ state: 'not-found' });
      else if (stored === 'deleted') setLoad({ state: 'deleted' });
      else setLoad({ state: 'found', view: stored });
      return;
    }
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
      setFollowUpError(t.ui.answer.followUpEmpty);
      return;
    }
    if (IS_PREVIEW) {
      previewFollowUp(token, followUpText);
    } else {
      const result = await visitorApi.sendFollowUp(token, followUpText);
      if (!result.ok || result.data.ok === false) {
        setFollowUpError(t.ui.answer.followUpFailed);
        return;
      }
    }
    setFollowUpText('');
    await refresh();
  };

  const confirmDelete = async () => {
    if (IS_PREVIEW) previewDelete(token);
    else await visitorApi.deleteSubmission(token);
    await refresh();
  };

  /* ------------------------------------------------------------- loading */

  if (load.state === 'loading') {
    return (
      <PageShell>
        <section className="letter">
          <div className="wrap wrap-narrow">
            <div className="page-panel">
              <p className="letter-quiet">{t.ui.answer.finding}</p>
            </div>
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
          <div className="wrap wrap-narrow">
            <div className="page-panel stack" style={{ gap: '16px' }}>
              <SpriteCanvas sprite={bunnySprite} scale={2} alt={null} />
              <h1 className="h1">{t.ui.answer.unknownTitle}</h1>
              <p className="prose">{t.ui.answer.unknownBody}</p>
              {FEATURES.recovery && <p className="prose">{t.ui.answer.unknownRecover}</p>}
              <div className="row">
                {FEATURES.recovery && (
                  <Link to="/recover" className="btn">
                    {t.ui.answer.recoverButton}
                  </Link>
                )}
                <Link to="/" className="btn btn-quiet">
                  {t.ui.answer.backToStart}
                </Link>
              </div>
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
          <div className="wrap wrap-narrow">
            <div className="page-panel stack" style={{ gap: '16px' }}>
              <h1 className="h1">{t.ui.answer.goneTitle}</h1>
              <p className="prose">{t.ui.answer.goneBody}</p>
              <div className="row">
                <Link to="/ask" className="btn btn-primary">
                  {t.ui.answer.writeNew}
                </Link>
              </div>
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
        <div className="wrap wrap-narrow">
          <div className="page-panel stack" style={{ gap: '28px' }}>
            <header className="stack" style={{ gap: '8px' }}>
              <span className="eyebrow">{t.ui.answer.eyebrow}</span>
              <p className="letter-date">
                {t.ui.answer.sent} {t.formatDate(view.createdAt)} ·{' '}
                {view.visibility === 'public' ? t.ui.answer.askedPublic : t.ui.answer.private}
              </p>
            </header>

            <article className="letter-block">
              <h2 className="h3">{t.ui.answer.yourProblem}</h2>
              <p className="letter-body">{view.body}</p>
            </article>

            {!answered && (
              <div className="letter-waiting">
                <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
                <div className="stack" style={{ gap: '6px' }}>
                  <h2 className="h3">{t.ui.answer.notYet}</h2>
                  <p className="prose">
                    {t.ui.answer.faridaHasIt} {t.copy.responseTime} {t.ui.answer.nothingNeeded}
                  </p>
                  {IS_PREVIEW && (
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => {
                        previewMarkAnswered(token, t.ui.preview.standInReply);
                        void refresh();
                      }}
                    >
                      {t.ui.answer.previewReady}
                    </button>
                  )}
                </div>
              </div>
            )}

            {answered && (
              <article className="letter-block letter-reply">
                {/* The bunny stands beside the reply, as he does while it is
                    being written (Farida, 2026-10-13). */}
                <div className="letter-reply-inner">
                  <SpriteCanvas sprite={bunnySprite} scale={2} rimLight alt={null} />
                  <div className="stack" style={{ gap: '10px' }}>
                    <h2 className="h3">{t.ui.answer.response}</h2>
                    <p className="letter-body">{view.answer}</p>
                    <p className="letter-from">{t.ui.answer.from}</p>
                  </div>
                </div>
              </article>
            )}

            {answered && followUpSent && view.followUp !== null && (
              <article className="letter-block">
                <h2 className="h3">{t.ui.answer.yourFollowUp}</h2>
                <p className="letter-body">{view.followUp.body}</p>
                {finalReplyIn ? (
                  <>
                    <hr className="letter-rule" />
                    <h2 className="h3">{t.ui.answer.faridaReply}</h2>
                    <p className="letter-body">{view.followUp.reply}</p>
                    <p className="letter-from">{t.ui.answer.from}</p>
                  </>
                ) : (
                  <p className="letter-quiet">{t.ui.answer.followUpSent}</p>
                )}
              </article>
            )}

            {answered && !followUpSent && (
              <div className="letter-block stack" style={{ gap: '12px' }}>
                <h2 className="h3">{t.ui.answer.oneFollowUp}</h2>
                <p className="field-help">{t.ui.answer.followUpHelp}</p>
                <textarea
                  className="textarea"
                  value={followUpText}
                  onChange={(event) => setFollowUpText(event.target.value)}
                  aria-label={t.ui.answer.followUpAria}
                />
                {followUpError !== null && <p className="field-error">{followUpError}</p>}
                <div className="row">
                  <button type="button" className="btn btn-primary" onClick={submitFollowUp}>
                    {t.ui.answer.sendFollowUp}
                  </button>
                </div>
              </div>
            )}

            <footer className="letter-foot stack" style={{ gap: '12px' }}>
              <div className="row">
                <Link to="/ask" className="btn">
                  {t.ui.answer.submitAnother}
                </Link>
                {!confirmingDelete ? (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    {t.ui.answer.delete}
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                      {t.ui.answer.deleteConfirm}
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      {t.ui.answer.keep}
                    </button>
                  </>
                )}
              </div>
              {confirmingDelete && <p className="field-help">{t.ui.answer.deleteWarning}</p>}
            </footer>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
