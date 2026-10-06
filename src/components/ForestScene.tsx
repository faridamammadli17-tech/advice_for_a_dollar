import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import scene from '../pixel/assets/originals/forest-scene-2x-jpeg.jpg';
import creatureData from '../pixel/assets/creatures/creatures.json';

/**
 * The forest, full-bleed behind the home page, with its creatures awake.
 *
 * The picture is the file Farida delivered, byte for byte (a 960x558 JPEG,
 * itself a 2x enlargement of the painting), with nothing between it and the
 * screen: no filter, no overlay, no blend, no opacity, and no re-encoding in
 * the build (Vite copies it as it is). Fixed to the viewport and drawn at a
 * WHOLE-NUMBER scale (never 1.5x, see HANDOFF.md) large enough to cover it,
 * anchored to the ground so that what gets cropped is sky and far meadow,
 * never the grass under everyone's feet. The bunny and the frog on the
 * mushroom sit at the left edge of the scene, so a wide screen shows them and
 * a phone shows the open meadow.
 *
 * The seven little black creatures are cut out of that same file by
 * scripts/cut-scene-creatures.py and drawn back at the exact spot each was
 * painted, over a patch of meadow that fills the hole it leaves. At rest each
 * creature covers its patch exactly, so the screen shows the delivered
 * picture to the pixel; the sprites then bob, shuffle and blink by one art
 * pixel (two of the file's pixels) at a time. A handful of fireflies drift
 * over everything. All of it stops under prefers-reduced-motion (Home.css).
 */

const SCENE_WIDTH = creatureData.scene.width;
const SCENE_HEIGHT = creatureData.scene.height;
/** The file's pixels per art pixel: the creatures move in art pixels. */
const ART_PIXEL = creatureData.scene.artPixel;

/** Wide screens anchor the scene left so its painted characters stay in view. */
const ANCHOR_LEFT_FROM = 1160;

const creatureFrames = import.meta.glob('../pixel/assets/creatures/creature_*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function frame(id: number, kind: '' | '_blink' | '_patch'): string {
  const key = `../pixel/assets/creatures/creature_${id}${kind}.png`;
  const url = creatureFrames[key];
  if (url === undefined) throw new Error(`Missing creature frame ${key}`);
  return url;
}

/** How each creature fidgets: its own rhythm, so no two move together. */
const RHYTHMS: readonly { seconds: number; delay: number; blink: number }[] = [
  { seconds: 9.3, delay: -2.1, blink: 4.7 },
  { seconds: 8.1, delay: -5.4, blink: 5.9 },
  { seconds: 10.6, delay: -0.7, blink: 4.1 },
  { seconds: 8.8, delay: -3.9, blink: 6.3 },
  { seconds: 7.4, delay: -6.2, blink: 5.2 },
  { seconds: 11.2, delay: -1.5, blink: 4.4 },
  { seconds: 9.9, delay: -7.3, blink: 5.6 },
];

type Layout = { readonly scale: number; readonly left: number; readonly top: number };

function layoutFor(viewportWidth: number, viewportHeight: number, width: number, height: number): Layout {
  const scale = Math.max(
    1,
    Math.ceil(viewportWidth / SCENE_WIDTH),
    Math.ceil(viewportHeight / SCENE_HEIGHT),
  );
  const sceneWidth = SCENE_WIDTH * scale;
  const sceneHeight = SCENE_HEIGHT * scale;
  return {
    scale,
    left: viewportWidth >= ANCHOR_LEFT_FROM ? 0 : Math.floor((width - sceneWidth) / 2),
    top: Math.floor(height - sceneHeight),
  };
}

/**
 * The smallest whole-number scale at which the scene covers the viewport, and
 * where the scene's corner lands inside the fixed layer. The scale follows
 * the viewport (as the CSS breakpoints do); the offset follows the layer's
 * real size, which excludes any scrollbar.
 */
function useSceneLayout(ref: RefObject<HTMLDivElement | null>): Layout {
  const [layout, setLayout] = useState<Layout>(() =>
    layoutFor(window.innerWidth, window.innerHeight, window.innerWidth, window.innerHeight),
  );

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const update = () => {
      const next = layoutFor(
        window.innerWidth,
        window.innerHeight,
        element.clientWidth,
        element.clientHeight,
      );
      setLayout((previous) =>
        previous.scale === next.scale && previous.left === next.left && previous.top === next.top
          ? previous
          : next,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  return layout;
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
  { x: 14, y: 24, seconds: 20, delay: -4 },
  { x: 74, y: 88, seconds: 16, delay: -13 },
];

export function ForestScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scale, left, top } = useSceneLayout(ref);
  const width = SCENE_WIDTH * scale;
  const height = SCENE_HEIGHT * scale;

  return (
    <div className="forest" aria-hidden="true" ref={ref}>
      <div
        className="forest-stage"
        style={{
          width,
          height,
          left,
          top,
          backgroundImage: `url(${scene})`,
          backgroundSize: `${width}px ${height}px`,
        }}
      >
        {creatureData.creatures.map((creature, index) => {
          const rhythm = RHYTHMS[index % RHYTHMS.length] ?? RHYTHMS[0];
          const size = { width: creature.width * scale, height: creature.height * scale };
          const spot = { left: creature.x * scale, top: creature.y * scale, ...size };
          return (
            <span key={creature.id} className="critter-spot" style={spot}>
              {/* The meadow under the creature: only visible where it has stepped away. */}
              <img className="critter-frame" src={frame(creature.id, '_patch')} alt="" {...size} />
              <span
                className="critter"
                style={
                  {
                    '--px': `${scale * ART_PIXEL}px`,
                    animationDuration: `${rhythm?.seconds ?? 9}s`,
                    animationDelay: `${rhythm?.delay ?? 0}s`,
                  } as CSSProperties
                }
              >
                <img className="critter-frame" src={frame(creature.id, '')} alt="" {...size} />
                <img
                  className="critter-frame critter-blink"
                  src={frame(creature.id, '_blink')}
                  alt=""
                  {...size}
                  style={{ animationDuration: `${rhythm?.blink ?? 5}s`, animationDelay: `${rhythm?.delay ?? 0}s` }}
                />
              </span>
            </span>
          );
        })}
      </div>

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
