/**
 * Feature flags.
 *
 * These exist so that a destination which does not exist yet is never linked
 * to. A visitor clicking "Browse Problems" and landing on a dead page is a
 * worse experience than not seeing the link at all — and the spec is explicit
 * that at every step the visitor must know what happens next.
 *
 * Phase 3 turns the archive and the static pages on.
 */

export const FEATURES = {
  /**
   * Night mode. OFF for launch, by Farida's decision — day only at first,
   * night added after launch.
   *
   * Disabled rather than deleted, because it is coming back. While this is
   * false the ThemeProvider stamps `data-theme="day"` on the root element,
   * which makes the `prefers-color-scheme: dark` block in theme.css inert —
   * the media query is already guarded with `:not([data-theme='day'])`. So a
   * visitor whose device is in dark mode still sees the day theme, which is
   * what "no night mode" has to actually mean.
   *
   * To bring it back: set this to true. Nothing else needs changing.
   */
  nightMode: false,

  /**
   * The public archive of approved problems.
   *
   * On, but it will show its empty state until real submissions are approved —
   * nothing is invented to fill it. Turn this off at launch if an empty
   * archive reads worse than no archive; the spec allows either.
   */
  archive: true,
  /** How It Works, About, FAQ, Community Guidelines, Privacy, Terms. */
  staticPages: true,
  /**
   * Payments. OFF for launch, by Farida's decision (2026-11-06): the site
   * starts free, and the dollar comes back if more problems arrive than
   * she can answer.
   *
   * Disabled rather than deleted, because it is coming back. This one
   * switch drives BOTH sides, so they can never disagree:
   *   - the website: the box has three steps (write, secret word, private
   *     or public) and "Send it" sits on the third; the price line beside
   *     the Send button, the "Why one dollar?" section, the "Pay" step in
   *     How it works, the FAQ entry about the price and the Privacy page's
   *     mentions of a payment record are all hidden;
   *   - the server (server/app.ts reads this file): a submission is
   *     accepted with no amount and no transaction, nothing is recorded in
   *     the payments table, and the free endpoint has its own, tighter
   *     rate limit per address in place of the payment gate.
   *
   * To bring it back: set this to true. Nothing else needs changing: the
   * fourth step, the mock provider, the Epoint and Payriff adapters, the
   * payment tables and their tests are all still here, and the server
   * refuses an unpaid submission again. Then restart the server; the
   * website picks it up on its next build.
   */
  payments: false,
  /** Real payment providers. Phase 5 — until then everything runs on the mock. */
  realPayments: false,
  /**
   * Lost-link recovery at /recover.
   *
   * Two factors: the secret word, plus roughly when they wrote. The server
   * narrows by date and only then checks hashes, so there is never a global
   * "does this secret word exist" lookup — which a salted hash could not
   * support anyway.
   */
  recovery: true,
} as const;
