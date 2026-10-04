/**
 * Money.
 *
 * Decision (NOTES.md): the price is 1 AZN, displayed and charged in AZN.
 * Not dollars, not converted — despite the product being called Advice for a
 * Dollar. No copy anywhere may say "$1" while the charge is 1 AZN.
 *
 * Amounts are stored and passed around as **minor units** (qəpik), never as
 * floats. 1 AZN is 100. Money in floating point is how rounding errors become
 * refund tickets.
 */

export const CURRENCY = 'AZN' as const;

/** The minimum. Pay what you want, from here upwards. */
export const MINIMUM_MINOR_UNITS = 100;

/** Suggested amounts on the payment step: 1, 3 and 5 AZN. */
export const SUGGESTED_MINOR_UNITS: readonly number[] = [100, 300, 500];

/** The largest amount the form accepts, as a guard against a typo. */
export const MAXIMUM_MINOR_UNITS = 50_000;

/**
 * Format for display: "1 AZN", "3 AZN", "1.50 AZN".
 * Whole amounts drop the decimals, because "1.00 AZN" reads like a price tag
 * and the whole point of this one is that it is symbolic.
 */
export function formatMinorUnits(minorUnits: number): string {
  const whole = Math.floor(minorUnits / 100);
  const fraction = minorUnits % 100;

  if (fraction === 0) {
    return `${whole} ${CURRENCY}`;
  }
  return `${whole}.${String(fraction).padStart(2, '0')} ${CURRENCY}`;
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
