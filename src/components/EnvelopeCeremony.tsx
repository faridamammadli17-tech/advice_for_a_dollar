import { useEffect } from 'react';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { envelopeSprite } from '../pixel/sprites';
import { useReducedMotion } from '../theme/useReducedMotion';

/** 26 frames at 12fps, plus a beat to let it settle. */
const CEREMONY_MS = 2400;
/** Reduced motion still gets a moment of acknowledgement, just not a show. */
const REDUCED_MS = 400;

export type EnvelopeCeremonyProps = {
  /** Fired when the animation has had its time. Never gates the request. */
  onDone: () => void;
};

/**
 * The submission ceremony.
 *
 * The critical rule from the spec: **this must never block or delay the actual
 * result.** The submission request is already in flight before this mounts.
 * This component only reports when the animation has finished; the page waits
 * for whichever finishes last, and if the request fails the ceremony is
 * abandoned without losing a word of what the visitor wrote.
 *
 * Under reduced motion the sprite holds on its first frame (SpriteCanvas pins
 * it) and the wait collapses to a beat — the flow still completes and still
 * reaches confirmation, which is the thing that actually matters.
 */
export function EnvelopeCeremony({ onDone }: EnvelopeCeremonyProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const duration = reducedMotion ? REDUCED_MS : CEREMONY_MS;
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [onDone, reducedMotion]);

  return (
    <div className="ceremony" role="status" aria-live="polite">
      <SpriteCanvas sprite={envelopeSprite} animation="ceremony" scale={3} alt={null} />
      <p className="ceremony-caption">Sending it…</p>
    </div>
  );
}
