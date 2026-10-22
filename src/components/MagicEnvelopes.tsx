import { type CSSProperties } from 'react';
import envelopeOpen from '../pixel/assets/envelope_open_01.png';
import envelopeSealed from '../pixel/assets/envelope_sealed_01.png';

import './MagicEnvelopes.css';

/**
 * Two of the owner's envelopes, floating beside the standing bunny.
 *
 * The art is hers (src/pixel/assets/originals/envelope-*-15x.png, recovered
 * to its native pixels by scripts/downscale-art.py and cropped to the
 * drawing: the open one with the letter is 55x55, the sealed one with the
 * wax seal 55x36). They are drawn with plain <img> elements at a
 * whole-number scale so every art pixel stays a crisp square, the sealed
 * one in front and a little lower, overlapping the open one.
 *
 * The motion is the site's kind: each envelope drifts up and down by whole
 * art pixels in `steps()`, on its own rhythm so the two never move together,
 * and three one-pixel sparkles wink on and off around them. Nothing rotates
 * or scales. All of it stops under prefers-reduced-motion
 * (MagicEnvelopes.css). Purely decorative, so hidden from assistive tech.
 */

/** The drawings' native sizes, in art pixels. */
const OPEN = { width: 55, height: 55 } as const;
const SEALED = { width: 55, height: 36 } as const;

type Props = {
  /** Whole numbers only: CSS pixels per art pixel. */
  readonly scale?: number;
  readonly className?: string;
};

export function MagicEnvelopes({ scale = 2, className = '' }: Props) {
  // The stylesheet reads this into --px, so a media query can still override
  // it (a phone shows the envelopes at 1x); an inline --px could not be.
  const style = { '--envelopes-scale': `${scale}px` } as CSSProperties;

  return (
    <div className={`envelopes ${className}`.trim()} style={style} aria-hidden="true">
      <img
        className="envelope envelope-open"
        src={envelopeOpen}
        alt=""
        width={OPEN.width}
        height={OPEN.height}
        draggable={false}
      />
      <img
        className="envelope envelope-sealed"
        src={envelopeSealed}
        alt=""
        width={SEALED.width}
        height={SEALED.height}
        draggable={false}
      />
      <span className="envelope-spark envelope-spark-1" />
      <span className="envelope-spark envelope-spark-2" />
      <span className="envelope-spark envelope-spark-3" />
    </div>
  );
}
