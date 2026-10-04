import { type CSSProperties } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import standingOpen from '../pixel/assets/bunny_idle_01.png';
import standingBlink from '../pixel/assets/bunny_blink_01.png';
import portraitOpen from '../pixel/assets/bunny_portrait_01.png';
import portraitBlink from '../pixel/assets/bunny_portrait_blink_01.png';

/**
 * The bunny on the home page, in two views: standing beside the writing box
 * with the lantern staff, and the close-up portrait centred under the hero.
 *
 * Drawn with plain <img> elements at a whole-number scale, so every art pixel
 * is a crisp square. The life in it is a few CSS animations (Home.css):
 *
 *   - a one-pixel breathing bob, stepped rather than eased so the pixels
 *     never smear between positions
 *   - a closed-eye frame layered on top and shown for a moment every few
 *     seconds, which is how the blink works
 *   - the lantern's sparkles and a soft glow behind it
 *
 * The frames are separate PNGs in src/pixel/assets, drawn from the delivered
 * art; the closed-eye frames are the open ones with the eyes shut.
 */

const NATIVE = 128;

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

type FigureProps = {
  readonly open: string;
  readonly blink: string;
  /** Sparkle positions in art pixels, around the lantern. */
  readonly sparkles: readonly (readonly [number, number])[];
  /** The soft glow behind the lantern, in art pixels. */
  readonly glow: Box;
  readonly scale: number;
  readonly className: string;
  readonly label: string;
};

const px = (value: number) => `calc(${value} * var(--px))`;

function Figure({ open, blink, sparkles, glow, scale, className, label }: FigureProps) {
  const size = NATIVE * scale;
  const style = { '--px': `${scale}px`, width: size, height: size } as CSSProperties;

  return (
    <div className={`bunny ${className}`} style={style} role="img" aria-label={label}>
      <div className="bunny-body">
        <span
          className="bunny-glow"
          style={{ left: px(glow.x), top: px(glow.y), width: px(glow.w), height: px(glow.h) }}
        />
        <img className="bunny-frame" src={open} alt="" width={size} height={size} draggable={false} />
        <img
          className="bunny-frame bunny-blink"
          src={blink}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
        {sparkles.map(([x, y], index) => (
          <span
            key={`${x}-${y}`}
            className="sparkle"
            style={{ left: px(x), top: px(y), animationDelay: `${index * 0.9}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Standing beside the writing box. 3x on a wide screen, 2x below that. */
export function StandingBunny() {
  const wide = useMediaQuery('(min-width: 1100px)');
  return (
    <Figure
      open={standingOpen}
      blink={standingBlink}
      sparkles={[
        [104, 40],
        [91, 47],
        [105, 54],
      ]}
      glow={{ x: 90, y: 39, w: 16, h: 18 }}
      scale={wide ? 3 : 2}
      className="bunny-standing"
      label="The bunny who writes back, standing beside the writing box with a lantern"
    />
  );
}

/** The close-up, centred under the hero. */
export function PortraitBunny() {
  return (
    <Figure
      open={portraitOpen}
      blink={portraitBlink}
      sparkles={[
        [118, 57],
        [98, 67],
        [121, 82],
      ]}
      glow={{ x: 98, y: 60, w: 22, h: 30 }}
      scale={2}
      className="bunny-portrait"
      label="A close-up of the bunny who writes back"
    />
  );
}
