/**
 * Frame timing.
 *
 * Kept as a pure function rather than inline in SpriteCanvas so that it can be
 * tested without a DOM, a canvas or a running animation frame. Everything
 * about which frame should be on screen at a given moment is decided here.
 */

export type FrameAdvance = {
  /** The frame that should now be displayed. */
  readonly frame: number;
  /** Milliseconds carried into the next tick. */
  readonly elapsedMs: number;
};

/**
 * Work out the next frame given how much time has passed.
 *
 * Advancing by whole frames and carrying the remainder means a slow or
 * irregular tick cannot make an animation drift out of time — the leftover
 * milliseconds are kept rather than discarded.
 *
 * @param current      frame currently displayed
 * @param elapsedMs    milliseconds carried over from previous ticks
 * @param deltaMs      milliseconds since the last tick
 * @param fps          frames per second for this animation
 * @param frameCount   total frames in the animation
 * @param loops        whether the animation wraps or holds on its last frame
 */
export function advanceFrame(
  current: number,
  elapsedMs: number,
  deltaMs: number,
  fps: number,
  frameCount: number,
  loops: boolean,
): FrameAdvance {
  // Nothing to animate, or a nonsense frame rate: hold on the first frame.
  if (frameCount <= 1 || !(fps > 0)) {
    return { frame: 0, elapsedMs: 0 };
  }

  const frameDurationMs = 1000 / fps;
  const accumulated = elapsedMs + deltaMs;

  if (accumulated < frameDurationMs) {
    return { frame: current, elapsedMs: accumulated };
  }

  const steps = Math.floor(accumulated / frameDurationMs);
  const remainder = accumulated - steps * frameDurationMs;
  const next = current + steps;

  return {
    frame: loops ? next % frameCount : Math.min(next, frameCount - 1),
    elapsedMs: remainder,
  };
}
