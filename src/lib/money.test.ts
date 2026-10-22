import { describe, expect, it } from 'vitest';
import { CURRENCY, formatMinorUnits, MINIMUM_MINOR_UNITS, SUGGESTED_MINOR_UNITS } from './money';

/** The price is one dollar (owner, 2026-10-22), charged in USD, said in words. */
describe('money', () => {
  it('charges in US dollars', () => {
    expect(CURRENCY).toBe('USD');
    expect(MINIMUM_MINOR_UNITS).toBe(100);
    expect(SUGGESTED_MINOR_UNITS).toEqual([100, 300, 500]);
  });

  it('formats amounts in words, singular and plural', () => {
    expect(formatMinorUnits(100)).toBe('1 dollar');
    expect(formatMinorUnits(300)).toBe('3 dollars');
    expect(formatMinorUnits(250)).toBe('2.50 dollars');
    expect(formatMinorUnits(105)).toBe('1.05 dollars');
  });

  it('never says AZN or manat', () => {
    for (const amount of [100, 300, 500, 250]) {
      expect(formatMinorUnits(amount)).not.toMatch(/AZN|manat/i);
    }
  });
});
