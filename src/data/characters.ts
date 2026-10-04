/**
 * The two inhabitants of the world.
 *
 * ---------------------------------------------------------------------------
 * CORRECTED 2026-09-21 — supersedes PROMPT.md Section 10
 * ---------------------------------------------------------------------------
 * The spec described three characters including an owl. Farida has corrected
 * it: there are **two**.
 *
 *   Frog  — the problem-writer. From the visitor's perspective, the frog is
 *           them: the one sitting at the computer with something to get off
 *           their chest.
 *   Bunny — the advice-giver. The face of the reply coming back.
 *
 * The owl does not exist. Do not reintroduce one.
 *
 * ---------------------------------------------------------------------------
 * The line that must stay true
 * ---------------------------------------------------------------------------
 * "All advice is written by one real human wearing different hats."
 *
 * The bunny stands for the reply the way an envelope stands for a letter. It
 * must never read as a second advisor working alongside Farida, and no copy
 * should ever attribute advice to the bunny rather than to her.
 *
 * Names are still unset — both display as '???' until Farida names them.
 */

export type Character = {
  readonly id: string;
  /** '???' until named. */
  readonly displayName: string;
  readonly role: string;
  /** Key into the asset manifest. */
  readonly spriteId: string;
  readonly personality?: string;
};

export const UNNAMED = '???';

export const CHARACTERS: readonly Character[] = [
  {
    id: 'frog',
    displayName: UNNAMED,
    role: 'the one writing',
    spriteId: 'typist',
  },
  {
    id: 'bunny',
    displayName: UNNAMED,
    role: 'the one writing back',
    spriteId: 'bunny',
  },
];
