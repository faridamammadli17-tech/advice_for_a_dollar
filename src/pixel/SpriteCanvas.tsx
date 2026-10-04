import { useCallback, useEffect, useRef, useState } from 'react';
import { formatProblems, resolvePalette, validateSprite } from './palette';
import { getFrameCanvas } from './frameCache';
import { getLoadedImage, loadSpriteImage } from './imageCache';
import { advanceFrame } from './timing';
import { useSpriteLoop } from './useSpriteLoop';
import { type Sprite, type SpriteFrame } from './types';
import { useTheme } from '../theme/useTheme';
import { useReducedMotion } from '../theme/useReducedMotion';

export type SpriteCanvasProps = {
  sprite: Sprite;
  /** Defaults to the sprite's `defaultAnimation`. */
  animation?: string;
  /** Whole numbers only. Anything else is rounded — see ART_GUIDELINES.md §4. */
  scale?: number;
  flipX?: boolean;
  /** Paint a one-pixel highlight on the upper-left edge of the silhouette. */
  rimLight?: boolean;
  paused?: boolean;
  /** Pin to a specific frame. Used by the inspector to step through frames. */
  frameIndex?: number;
  /**
   * Overrides which theme's colours are resolved and cached. The inspector
   * passes this so a day panel and a night panel can coexist on one page.
   */
  themeKey?: string;
  className?: string;
  /** Accessible name. Pass null for purely decorative sprites. */
  alt?: string | null;
};

/**
 * A stable empty array. Returning a fresh `[]` from render would give `draw`
 * a new identity every time and restart the animation on every render.
 */
const NO_FRAMES: readonly SpriteFrame[] = [];

const validatedSprites = new Set<string>();

function assertValidInDev(sprite: Sprite): void {
  if (!import.meta.env.DEV) return;
  if (validatedSprites.has(sprite.id)) return;

  const problems = validateSprite(sprite);
  if (problems.length > 0) {
    throw new Error(
      `Sprite "${sprite.id}" failed validation:\n${formatProblems(problems)}\n` +
        'Fix the sprite definition — a mis-sized frame will jitter or clip at runtime.',
    );
  }
  validatedSprites.add(sprite.id);
}

export function SpriteCanvas({
  sprite,
  animation,
  scale = 1,
  flipX = false,
  rimLight = false,
  paused = false,
  frameIndex,
  themeKey,
  className,
  alt = null,
}: SpriteCanvasProps) {
  assertValidInDev(sprite);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFrameRef = useRef(0);
  const elapsedRef = useRef(0);
  // Bumped when delivered artwork finishes loading, to trigger a repaint.
  const [imageReady, setImageReady] = useState(0);

  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const resolvedThemeKey = themeKey ?? theme;
  const animationId = animation ?? sprite.defaultAnimation;
  const intScale = Math.max(1, Math.round(scale));

  const animationDef = sprite.animations[animationId];
  const frames = animationDef?.frames ?? NO_FRAMES;
  const fps = animationDef?.fps ?? 1;
  const loops = animationDef?.loop ?? false;

  // Motion stops entirely for reduced-motion visitors, for a pinned frame, for
  // a paused sprite, and for anything with nothing to animate.
  const shouldAnimate =
    frameIndex === undefined && !paused && !reducedMotion && frames.length > 1;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const dprInt = Math.max(1, Math.round(window.devicePixelRatio || 1));
    const cssWidth = sprite.width * intScale;
    const cssHeight = sprite.height * intScale;
    const bufferWidth = cssWidth * dprInt;
    const bufferHeight = cssHeight * dprInt;

    // Resizing clears the canvas, so only do it when it actually changed.
    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
    }
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    ctx.clearRect(0, 0, bufferWidth, bufferHeight);

    // Delivered artwork: draw the image itself, nearest-neighbour, at an
    // integer scale. No palette resolution — these are the artist's colours
    // and they are not re-themed.
    if (sprite.src !== undefined) {
      const image = getLoadedImage(sprite.src);
      if (image === null) return; // still loading; paint nothing rather than flicker
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      if (flipX) {
        ctx.translate(bufferWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(image, 0, 0, bufferWidth, bufferHeight);
      ctx.restore();
      return;
    }

    if (frames.length === 0) return;

    // Narrow `frameIndex` inline. Hoisting this test into a boolean would not
    // narrow the type, because TypeScript does not track that relationship.
    let index: number;
    if (frameIndex !== undefined) {
      index = Math.min(Math.max(frameIndex, 0), frames.length - 1);
    } else if (reducedMotion) {
      index = 0;
    } else {
      index = currentFrameRef.current;
    }

    const frame = frames[index];
    if (frame === undefined) return;

    const colors = resolvePalette(sprite.palette, canvas, resolvedThemeKey);
    const rimColor = rimLight
      ? getComputedStyle(canvas).getPropertyValue('--rim-light').trim() || null
      : null;

    const source = getFrameCanvas(
      sprite,
      animationId,
      index,
      frame,
      colors,
      resolvedThemeKey,
      rimColor,
    );

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flipX) {
      ctx.translate(bufferWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, bufferWidth, bufferHeight);
    ctx.restore();
  }, [
    sprite,
    animationId,
    frames,
    intScale,
    flipX,
    rimLight,
    reducedMotion,
    resolvedThemeKey,
    frameIndex,
    // `imageReady` is deliberately not here: draw() reads the image cache
    // fresh on every call, so it needs no dependency on load state. The effect
    // below depends on it, which is what triggers the repaint.
  ]);

  // Load delivered artwork, then repaint.
  useEffect(() => {
    if (sprite.src === undefined) return;
    let cancelled = false;
    void loadSpriteImage(sprite.src)
      .then(() => {
        if (!cancelled) setImageReady((n) => n + 1);
      })
      .catch((error: unknown) => {
        // Loud in development: a missing asset should be fixed, not tolerated.
        if (import.meta.env.DEV) console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [sprite.src]);

  // Restart the animation whenever what is being played changes.
  useEffect(() => {
    currentFrameRef.current = 0;
    elapsedRef.current = 0;
    draw();
  }, [draw, imageReady]);

  useSpriteLoop((deltaMs) => {
    const previous = currentFrameRef.current;
    const next = advanceFrame(previous, elapsedRef.current, deltaMs, fps, frames.length, loops);

    elapsedRef.current = next.elapsedMs;
    if (next.frame === previous) return;

    currentFrameRef.current = next.frame;
    draw();
  }, shouldAnimate);

  // Redraw when the device pixel ratio changes — dragging a window between a
  // laptop screen and an external monitor would otherwise leave it soft.
  useEffect(() => {
    const query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleChange = () => draw();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [draw]);

  if (alt === null) {
    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
  }
  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
}
