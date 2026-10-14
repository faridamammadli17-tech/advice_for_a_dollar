/**
 * ===========================================================================
 * CRISIS RESOURCES — the only place these live
 * ===========================================================================
 *
 * ⚠️  THE NUMBERS BELOW ARE PLACEHOLDERS AND DO NOT WORK.  ⚠️
 *
 * Farida is finding the real ones. Until she does, these are deliberately
 * unmistakable non-numbers rather than plausible-looking digits, because the
 * failure mode here is not a bug — it is somebody in crisis dialling a number
 * that does not answer.
 *
 * Earlier this file carried 112 and 102, which are real. They were removed at
 * Farida's request while the final list is confirmed, on the grounds that a
 * partial list presented as complete is its own kind of wrong.
 *
 * ---------------------------------------------------------------------------
 * HOW THIS CANNOT SHIP BY ACCIDENT
 * ---------------------------------------------------------------------------
 * 1. `CRISIS_NUMBERS_ARE_PLACEHOLDERS` is true. While it is true the safety
 *    screen shows an unmissable notice in EVERY build, not just development —
 *    if this somehow reached a visitor, they would at least not be misled.
 * 2. `npm run build` runs `scripts/preflight.ts`, which refuses to produce a
 *    production build while this flag is set. Overriding it takes a deliberate
 *    environment variable, so nobody can do it by forgetting.
 *
 * When the real numbers arrive: replace the entries, set the flag to false,
 * and the guard and the notice both switch themselves off.
 */

export const CRISIS_NUMBERS_ARE_PLACEHOLDERS = true;

export type CrisisResource = {
  /** Displayed, and used as the tel: target. */
  readonly number: string;
  /** What this number is. Null while unconfirmed — never guess this. */
  readonly label: string | null;
};

export const CRISIS_NUMBERS: readonly CrisisResource[] = [
  { number: '000 000 00 00', label: null },
  { number: '000 000 00 01', label: null },
];

/** Heading above the list. */
export const CRISIS_HEADING = 'Emergency numbers in Azerbaijan';
