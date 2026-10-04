import { ASSETS, draftSpriteFromAsset } from '../assets';
import { type Sprite } from '../types';

/**
 * The typist rig — frog at the computer, on a 96x80 canvas.
 *
 * This is the sprite the homepage writing experience drives: it eases into
 * `typing` while the visitor writes and returns to `idle` ~700ms after they
 * stop. Wiring that to the textarea is Phase 2 work.
 *
 * DRAFT placeholder until `ASSETS.typist.src` points at delivered frames.
 */
const entry = ASSETS.typist;
if (entry === undefined) {
  throw new Error('Asset "typist" is missing from the manifest.');
}

export const typistSprite: Sprite = draftSpriteFromAsset(entry);
