import { useCallback, useEffect, useState } from 'react';
import { api, type AdminStats, type AdminSubmission, type ApiError } from '../lib/api/client';
import { CATEGORIES } from '../lib/archive/categories';
import { formatMinorUnits } from '../lib/money';

import './Admin.css';

/**
 * The owner's dashboard.
 *
 * Deliberately plain. This is Farida's workbench, not part of the visitor
 * experience — no pixel art, no ceremony, nothing to get between her and a
 * queue of people waiting for a reply.
 *
 * Two things are given visual priority over everything else:
 *
 *   1. SAFETY FLAGS, which are unmissable and cannot be dismissed from here.
 *   2. WHAT IS WAITING, so the default view answers "what do I do next".
 *
 * Every button here calls an endpoint that enforces its own rules. Approving a
 * private submission fails at the database, not in this component — the UI
 * only reflects what the server already refuses.
 */

type Filter = 'waiting' | 'review' | 'flagged' | 'all';

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [rows, setRows] = useState<AdminSubmission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<Filter>('waiting');
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [list, analytics] = await Promise.all([api.adminSubmissions(), api.adminStats()]);
    if (!list.ok) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setRows(list.data.submissions);
    if (analytics.ok) setStats(analytics.data.stats);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = async () => {
    setLoginError(null);
    setBusy(true);
    const result = await api.adminLogin(password);
    setBusy(false);
    if (!result.ok) {
      // Deliberately vague: the server does not say which part was wrong.
      setLoginError('That did not work. After several wrong tries in a row, wait 15 minutes and try again.');
      return;
    }
    setPassword('');
    await refresh();
  };

  const signOut = async () => {
    await api.adminLogout();
    setAuthed(false);
    setRows([]);
    setStats(null);
  };

  /**
   * Run an action, then reload.
   *
   * Failures are surfaced rather than swallowed. An earlier version ignored
   * the result, so when the request was being rejected the button simply did
   * nothing — no error, no change, no clue. A moderation control that fails
   * quietly is worse than one that fails loudly.
   */
  const act = async (action: Promise<{ ok: boolean } | ApiError>) => {
    setBusy(true);
    setActionError(null);

    const result = await action;
    if (!('ok' in result) || result.ok === false) {
      const status = 'status' in result ? result.status : 0;
      setActionError(
        status === 401
          ? 'Your session expired. Sign in again.'
          : `That did not go through${status > 0 ? ` (${status})` : ''}. Nothing was changed.`,
      );
    }

    await refresh();
    setBusy(false);
  };

  /* ------------------------------------------------------------- login */

  if (authed === null) {
    return (
      <div className="admin-shell">
        <p className="admin-quiet">Checking…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-shell admin-centre">
        <form
          className="admin-login"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn();
          }}
        >
          <h1 className="admin-h1">Advice for a Dollar</h1>
          <p className="admin-quiet">Owner access.</p>
          <label className="admin-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {loginError !== null && <p className="admin-error">{loginError}</p>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  /* --------------------------------------------------------- dashboard */

  const visible = rows.filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return row.safety_flagged === 1;
    if (filter === 'review') return row.public_state === 'in_review';
    return row.status === 'pending' || (row.follow_up_body !== null && row.follow_up_reply === null);
  });

  const flaggedCount = rows.filter((row) => row.safety_flagged === 1).length;

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <h1 className="admin-h1">Dashboard</h1>
        <button type="button" className="admin-btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      {actionError !== null && <div className="admin-alarm admin-alarm-soft">{actionError}</div>}

      {flaggedCount > 0 && (
        <div className="admin-alarm">
          <strong>{flaggedCount} submission{flaggedCount === 1 ? '' : 's'} flagged for safety.</strong>{' '}
          These can never be published. Nothing was charged for them.
        </div>
      )}

      {stats !== null && (
        <div className="admin-stats">
          <Stat label="Waiting for a reply" value={String(stats.pending)} emphasis={stats.pending > 0} />
          <Stat label="Awaiting review" value={String(stats.awaiting_review)} />
          <Stat label="Answered" value={String(stats.answered)} />
          <Stat label="Flagged" value={String(stats.flagged)} emphasis={stats.flagged > 0} />
          <Stat label="Total" value={String(stats.total)} />
          <Stat label="Received" value={formatMinorUnits(stats.revenue_minor_units)} />
        </div>
      )}

      <div className="admin-filters">
        {(
          [
            ['waiting', 'Needs me'],
            ['review', 'Awaiting review'],
            ['flagged', 'Flagged'],
            ['all', 'Everything'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="admin-chip"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="admin-quiet">Nothing here. {filter === 'waiting' && 'You are all caught up.'}</p>
      ) : (
        <ul className="admin-list">
          {visible.map((row) => {
            const isOpen = openId === row.id;
            const needsFollowUpReply = row.follow_up_body !== null && row.follow_up_reply === null;

            return (
              <li
                key={row.id}
                className={row.safety_flagged === 1 ? 'admin-row admin-row-flagged' : 'admin-row'}
              >
                <div className="admin-row-head">
                  <span className="admin-badges">
                    {row.safety_flagged === 1 && (
                      <b className="admin-badge admin-badge-danger">
                        SAFETY: {row.safety_category ?? 'flagged'}
                      </b>
                    )}
                    <span className="admin-badge">{row.visibility}</span>
                    <span className="admin-badge">{row.status}</span>
                    {row.public_state === 'in_review' && (
                      <span className="admin-badge admin-badge-note">awaiting review</span>
                    )}
                    {row.public_state === 'approved' && (
                      <span className="admin-badge admin-badge-ok">published</span>
                    )}
                    {needsFollowUpReply && (
                      <span className="admin-badge admin-badge-note">follow-up waiting</span>
                    )}
                  </span>
                  <span className="admin-meta">
                    {new Date(row.created_at).toLocaleString()} ·{' '}
                    {formatMinorUnits(row.amount_minor_units)}
                  </span>
                </div>

                <p className="admin-body">{row.body || <em>(deleted)</em>}</p>

                {row.answer !== null && (
                  <div className="admin-answered">
                    <span className="admin-label">Your reply</span>
                    <p className="admin-body">{row.answer}</p>
                  </div>
                )}

                {row.follow_up_body !== null && (
                  <div className="admin-answered">
                    <span className="admin-label">Their follow-up</span>
                    <p className="admin-body">{row.follow_up_body}</p>
                    {row.follow_up_reply !== null && (
                      <>
                        <span className="admin-label">Your final reply</span>
                        <p className="admin-body">{row.follow_up_reply}</p>
                      </>
                    )}
                  </div>
                )}

                {isOpen ? (
                  <div className="admin-compose">
                    <label className="admin-label" htmlFor={`compose-${row.id}`}>
                      {needsFollowUpReply ? 'Your final reply' : 'Your reply'}
                    </label>
                    <textarea
                      id={`compose-${row.id}`}
                      className="admin-textarea"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={8}
                    />
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        disabled={busy || draft.trim() === ''}
                        onClick={() =>
                          void act(
                            (needsFollowUpReply
                              ? api.replyToFollowUp(row.id, draft)
                              : api.answer(row.id, draft)
                            ).then((result) => {
                              // Only clear the box if it actually sent. Losing
                              // a reply she just wrote because the request
                              // failed would be unforgivable.
                              if (result.ok) {
                                setOpenId(null);
                                setDraft('');
                              }
                              return result;
                            }),
                          )
                        }
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => {
                          setOpenId(null);
                          setDraft('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-actions">
                    {row.status !== 'deleted' && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => {
                          setOpenId(row.id);
                          setDraft(needsFollowUpReply ? '' : (row.answer ?? ''));
                        }}
                      >
                        {needsFollowUpReply
                          ? 'Reply to follow-up'
                          : row.answer === null
                            ? 'Write a reply'
                            : 'Edit reply'}
                      </button>
                    )}

                    {row.visibility === 'public' && row.safety_flagged === 0 && (
                      <>
                        <button
                          type="button"
                          className="admin-btn"
                          disabled={busy || row.public_state === 'approved'}
                          onClick={() => void act(api.approve(row.id))}
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          className="admin-btn"
                          disabled={busy || row.public_state === 'rejected'}
                          onClick={() => void act(api.reject(row.id))}
                        >
                          Don&rsquo;t publish
                        </button>
                      </>
                    )}

                    <select
                      className="admin-select"
                      value={row.category ?? ''}
                      aria-label="Category"
                      onChange={(event) =>
                        void act(api.setCategory(row.id, event.target.value || null))
                      }
                    >
                      <option value="">No category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={busy}
                      onClick={() =>
                        void act(api.setFlag(row.id, row.safety_flagged === 0, 'manual'))
                      }
                    >
                      {row.safety_flagged === 1 ? 'Remove safety flag' : 'Flag for safety'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="admin-foot">
        <button type="button" className="admin-btn" onClick={() => void act(api.purgeEmails())}>
          Purge expired email addresses
        </button>
        <span className="admin-quiet">
          Runs hourly on its own. This is only here for when you want to be sure.
        </span>
      </footer>
    </div>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={emphasis === true ? 'admin-stat admin-stat-on' : 'admin-stat'}>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}
