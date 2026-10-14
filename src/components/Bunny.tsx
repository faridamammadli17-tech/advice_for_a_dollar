import { type CSSProperties } from 'react';
import portraitOpen from '../pixel/assets/bunny_portrait_01.png';
import portraitBlink from '../pixel/assets/bunny_portrait_blink_01.png';

/**
 * Chiron, the bunny, as a close-up portrait.
 *
 * It is the same artwork as the logo in the header, drawn with plain <img>
 * elements at a whole-number scale so every art pixel is a crisp square. A
 * closed-eye frame is layered on top and shown for a moment every few seconds
 * (Home.css), which is how the blink works; that is the only motion, and it
 * stops under prefers-reduced-motion.
 *
 * The frames are PNGs in src/pixel/assets, drawn from the delivered art; the
 * closed-eye frame is the open one with the eyes shut (scripts/make-blink-frames.py).
 */

const NATIVE = 128;

type Props = {
  /** Whole numbers only: CSS pixels per art pixel. 1x is 128px, the native size. */
  readonly scale?: number;
  readonly className?: string;
  readonly label: string;
};

export function BunnyPortrait({ scale = 1, className = '', label }: Props) {
  const size = NATIVE * scale;
  const style = { '--px': `${scale}px`, width: size, height: size } as CSSProperties;

  return (
    <div className={`bunny ${className}`.trim()} style={style} role="img" aria-label={label}>
      <div className="bunny-body">
        <img className="bunny-frame" src={portraitOpen} alt="" width={size} height={size} draggable={false} />
        <img
          className="bunny-frame bunny-blink"
          src={portraitBlink}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
      </div>
    </div>
  );
}
