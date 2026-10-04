import { ASSETS, draftSpriteFromAsset } from '../assets';
import { type Sprite } from '../types';

/**
 * The frog — the problem-writer, the visitor's stand-in.
 *
 * DRAFT placeholder until `ASSETS.frog.src` points at delivered frames.
 */
const entry = ASSETS.frog;
if (entry === undefined) {
  throw new Error('Asset "frog" is missing from the manifest.');
}

export const frogSprite: Sprite = draftSpriteFromAsset(entry);
