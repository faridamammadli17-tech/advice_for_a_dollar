import { ASSETS, draftSpriteFromAsset } from '../assets';
import { type Sprite } from '../types';

/**
 * The envelope ceremony — 26 frames at 12fps, roughly 2.2 seconds.
 *
 * The emotional high point of the submission flow. Two rules hold whatever
 * the artwork ends up being:
 *
 *   - It must never block or delay the real submission result. If the request
 *     resolves first, the animation plays out over an already-successful
 *     submission; if it fails, the flow falls back without losing the
 *     visitor's text.
 *   - Under reduced motion it collapses to a still, and the submission still
 *     reaches confirmation.
 *
 * DRAFT placeholder until `ASSETS.envelope.src` points at delivered frames.
 */
const entry = ASSETS.envelope;
if (entry === undefined) {
  throw new Error('Asset "envelope" is missing from the manifest.');
}

export const envelopeSprite: Sprite = draftSpriteFromAsset(entry);
