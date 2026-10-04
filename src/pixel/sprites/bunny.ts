import { ASSETS, draftSpriteFromAsset } from '../assets';
import { type Sprite } from '../types';

/**
 * The bunny — the listener, and the likely primary mascot.
 *
 * Artwork has not been delivered. Until `ASSETS.bunny.src` points at real
 * frames, this is a DRAFT placeholder at the exact final 64x64 canvas.
 */
const entry = ASSETS.bunny;
if (entry === undefined) {
  throw new Error('Asset "bunny" is missing from the manifest.');
}

export const bunnySprite: Sprite = draftSpriteFromAsset(entry);
