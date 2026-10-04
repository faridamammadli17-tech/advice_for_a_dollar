import { type Sprite } from '../types';

/**
 * TEST CARD — the only hand-authored artwork in the codebase.
 *
 * This is a diagnostic instrument, not character art. It exists to prove the
 * renderer is honest, and it checks four things that are otherwise easy to get
 * wrong and hard to notice:
 *
 *   1. A 1px checkerboard stays a checkerboard at every scale. If the
 *      renderer smooths anything, this turns to mush immediately.
 *   2. 1px horizontal rules stay 1px and stay separated.
 *   3. 1px vertical rules do the same — some scaling bugs only show on one axis.
 *   4. All six palette colours appear as a ramp, so a token that fails to
 *      resolve shows up as a magenta band instead of hiding.
 *
 * The border runs the full edge of the canvas, so any clipping or off-by-one
 * in the scaling maths is visible as a missing line.
 */

const FRAME_A = [
  'oooooooooooooooo',
  'o.B.B.B.B.B.B.Bo',
  'oB.B.B.B.B.B.B.o',
  'o.B.B.B.B.B.B.Bo',
  'oB.B.B.B.B.B.B.o',
  'oRRRRRRRRRRRRRRo',
  'o..............o',
  'oRRRRRRRRRRRRRRo',
  'oS.S.S.S.S.S.S.o',
  'oS.S.S.S.S.S.S.o',
  'oS.S.S.S.S.S.S.o',
  'oPPPRRRBBSSFFCCo',
  'oPPPRRRBBSSFFCCo',
  'oPPPRRRBBSSFFCCo',
  'o..............o',
  'oooooooooooooooo',
];

/** Phase-shifted twin. Flipping between the two makes frame advance obvious. */
const FRAME_B = [
  'oooooooooooooooo',
  'oB.B.B.B.B.B.B.o',
  'o.B.B.B.B.B.B.Bo',
  'oB.B.B.B.B.B.B.o',
  'o.B.B.B.B.B.B.Bo',
  'oRRRRRRRRRRRRRRo',
  'o..............o',
  'oRRRRRRRRRRRRRRo',
  'o.S.S.S.S.S.S.So',
  'o.S.S.S.S.S.S.So',
  'o.S.S.S.S.S.S.So',
  'oCCFFSSBBRRRPPPo',
  'oCCFFSSBBRRRPPPo',
  'oCCFFSSBBRRRPPPo',
  'o..............o',
  'oooooooooooooooo',
];

export const testCardSprite: Sprite = {
  id: 'testcard',
  label: 'Test card — renderer diagnostic',
  width: 16,
  height: 16,
  isDraft: false,
  palette: {
    o: '--text',
    P: '--c-plum',
    R: '--c-rose',
    B: '--c-blush',
    S: '--c-sage',
    F: '--c-fern',
    C: '--c-cream',
  },
  defaultAnimation: 'static',
  animations: {
    static: {
      id: 'static',
      frames: [{ rows: FRAME_A }],
      fps: 1,
      loop: false,
      description: 'Single frame. Check crispness at every scale.',
    },
    alternate: {
      id: 'alternate',
      frames: [{ rows: FRAME_A }, { rows: FRAME_B }],
      fps: 2,
      loop: true,
      description:
        'Two frames at 2fps. Proves frame advance and timing, and that the shared loop is driving this sprite.',
    },
  },
};
