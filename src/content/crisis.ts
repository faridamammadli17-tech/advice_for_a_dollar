/**
 * ===========================================================================
 * THE EMERGENCY RESOURCE — the only place it lives
 * ===========================================================================
 *
 * Decision (owner, 2026-10-22): the safety screen carries no phone numbers.
 * It links to emergencynumbers.org, which keeps a page of emergency numbers
 * for every country, and that link is the only emergency resource on the
 * screen. The site is read from anywhere, so a list of numbers for one
 * country was always going to be wrong for someone, and a number that is
 * wrong on that screen is the worst thing this site could do.
 *
 * Earlier this file held placeholder numbers behind a flag, and
 * `scripts/preflight.ts` refused to build while the flag was set. The gate
 * is still there, with a new job: it refuses to build unless this file
 * exports a non-empty https:// address and the safety screen renders it as
 * its link. Change the address here and nowhere else.
 */

export type EmergencyLink = {
  /** Where the link goes. Must be https. */
  readonly url: string;
  /** The words above the address, on the screen. */
  readonly label: string;
};

export const EMERGENCY_LINK: EmergencyLink = {
  url: 'https://emergencynumbers.org',
  label: 'Emergency numbers in your country',
};
