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
