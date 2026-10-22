/**
 * Money.
 *
 * Decision (owner, 2026-10-22): the price is one dollar, displayed and
 * charged in US dollars (USD). Earlier it was 1 AZN; the owner changed it,
 * and the copy now says dollar everywhere.
 *
 * Amounts are stored and passed around as **minor units** (cents), never as
 * floats. 1 dollar is 100. Money in floating point is how rounding errors
 * become refund tickets.
 */

export const CURRENCY = 'USD' as const;

/** The minimum. Pay what you want, from here upwards. */
export const MINIMUM_MINOR_UNITS = 100;

/** Suggested amounts on the payment step: 1, 3 and 5 dollars. */
export const SUGGESTED_MINOR_UNITS: readonly number[] = [100, 300, 500];

/** The largest amount the form accepts, as a guard against a typo. */
export const MAXIMUM_MINOR_UNITS = 50_000;

/**
 * Format for display: "1 dollar", "3 dollars", "1.50 dollars".
 * The word rather than the sign or the code, because the owner's copy says
 * "one dollar" in words, and whole amounts drop the decimals, because
 * "1.00 dollars" reads like a price tag and the whole point of this one is
 * that it is symbolic.
 */
export function formatMinorUnits(minorUnits: number): string {
  const whole = Math.floor(minorUnits / 100);
  const fraction = minorUnits % 100;

  if (fraction === 0) {
    return `${whole} ${whole === 1 ? 'dollar' : 'dollars'}`;
  }
  return `${whole}.${String(fraction).padStart(2, '0')} dollars`;
}

/**
 * Parse what someone typed into minor units.
 * Returns null for anything that is not a usable amount.
 */
export function parseAmountToMinorUnits(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const minorUnits = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(minorUnits)) return null;
  return minorUnits;
}

export type AmountProblem = 'below-minimum' | 'above-maximum' | 'not-a-number';

/** Validate an amount for the payment step. */
export function checkAmount(minorUnits: number | null): AmountProblem | null {
  if (minorUnits === null) return 'not-a-number';
  if (minorUnits < MINIMUM_MINOR_UNITS) return 'below-minimum';
  if (minorUnits > MAXIMUM_MINOR_UNITS) return 'above-maximum';
  return null;
}
