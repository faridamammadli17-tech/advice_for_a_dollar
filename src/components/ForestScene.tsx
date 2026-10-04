import { useEffect, useState, type CSSProperties } from 'react';
import forestDay from '../pixel/assets/forest_day.png';
import { ASSETS } from '../pixel/assets';

/**
 * The forest, full-bleed behind the home page.
 *
 * Fixed to the viewport and drawn at a WHOLE-NUMBER scale (never 1.5x, see
 * HANDOFF.md) large enough to cover it, anchored to the ground so that what
 * gets cropped is sky and far meadow, never the grass under everyone's feet.
 * The bunny and the frog on the mushroom sit at the left edge of the scene,
 * so a wide screen shows them and a phone shows the open meadow.
 *
 * A handful of fireflies drift over it. They are the only ambient motion:
 * enough to feel alive, not enough to compete with the writing box. Every
 * animation on this page stops under prefers-reduced-motion (Home.css).
 */

const SCENE_WIDTH = ASSETS.background_day?.width ?? 480;
const SCENE_HEIGHT = ASSETS.background_day?.height ?? 279;

/** The smallest whole-number scale at which the scene covers the viewport. */
function useCoverScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(
        Math.max(
          1,
          Math.ceil(window.innerWidth / SCENE_WIDTH),
          Math.ceil(window.innerHeight / SCENE_HEIGHT),
        ),
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

/** Where each firefly lives (percent of the viewport) and how it drifts. */
const FIREFLIES: readonly { x: number; y: number; seconds: number; delay: number }[] = [
  { x: 8, y: 64, seconds: 13, delay: -2 },
  { x: 21, y: 42, seconds: 17, delay: -9 },
  { x: 36, y: 80, seconds: 15, delay: -5 },
  { x: 55, y: 30, seconds: 19, delay: -12 },
  { x: 67, y: 68, seconds: 14, delay: -1 },
  { x: 80, y: 46, seconds: 16, delay: -7 },
  { x: 91, y: 84, seconds: 18, delay: -11 },
  { x: 47, y: 56, seconds: 21, delay: -15 },
];

export function ForestScene() {
  const scale = useCoverScale();

  return (
    <div
      className="forest"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${forestDay})`,
        backgroundSize: `${SCENE_WIDTH * scale}px ${SCENE_HEIGHT * scale}px`,
      }}
    >
      {FIREFLIES.map((fly) => (
        <span
          key={`${fly.x}-${fly.y}`}
          className="firefly"
          style={
            {
              left: `${fly.x}%`,
              top: `${fly.y}%`,
              animationDuration: `${fly.seconds}s`,
              animationDelay: `${fly.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
