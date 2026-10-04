import { TRANSPARENT_CHAR, type Sprite, type SpriteFrame } from './types';

/**
 * Frame rasterisation and cache.
 *
 * Each frame is painted once, at 1:1, into an offscreen canvas and kept.
 * Displaying it is then a single scaled `drawImage` with smoothing off,
 * rather than thousands of `fillRect` calls on every animation frame.
 *
 * This lives apart from SpriteCanvas so that the component file exports a
 * component and nothing else — mixing component and non-component exports
 * breaks React Fast Refresh.
 */

const frameCache = new Map<string, HTMLCanvasElement>();

function isOpaqueAt(
  frame: SpriteFrame,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  const row = frame.rows[y];
  if (row === undefined) return false;
  const char = row[x];
  return char !== undefined && char !== TRANSPARENT_CHAR;
}

function buildFrameCanvas(
  sprite: Sprite,
  frame: SpriteFrame,
  colors: Readonly<Record<string, string>>,
  rimLightColor: string | null,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sprite.width;
  canvas.height = sprite.height;

  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error(`Could not get a 2D context while rasterising sprite "${sprite.id}".`);
  }

  // Rim first, so the silhouette paints cleanly over any overlap.
  if (rimLightColor !== null) {
    ctx.fillStyle = rimLightColor;
    for (let y = 0; y < sprite.height; y += 1) {
      for (let x = 0; x < sprite.width; x += 1) {
        if (isOpaqueAt(frame, sprite.width, sprite.height, x, y)) continue;
        // Light arrives from the upper left: an empty pixel lights up when the
        // pixel down-and-right of it is part of the figure.
        if (isOpaqueAt(frame, sprite.width, sprite.height, x + 1, y + 1)) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  for (let y = 0; y < sprite.height; y += 1) {
    const row = frame.rows[y];
    if (row === undefined) continue;

    for (let x = 0; x < sprite.width; x += 1) {
      const char = row[x];
      if (char === undefined || char === TRANSPARENT_CHAR) continue;

      const color = colors[char];
      if (color === undefined) continue;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas;
}

export function getFrameCanvas(
  sprite: Sprite,
  animationId: string,
  frameIndex: number,
  frame: SpriteFrame,
  colors: Readonly<Record<string, string>>,
  themeKey: string,
  rimLightColor: string | null,
): HTMLCanvasElement {
  const key = `${sprite.id}|${animationId}|${frameIndex}|${themeKey}|${rimLightColor ?? 'norim'}`;
  const cached = frameCache.get(key);
  if (cached) return cached;

  const built = buildFrameCanvas(sprite, frame, colors, rimLightColor);
  frameCache.set(key, built);
  return built;
}

/** Drop rasterised frames. Call if theme tokens change at runtime. */
export function clearSpriteFrameCache(): void {
  frameCache.clear();
}

export function spriteFrameCacheSize(): number {
  return frameCache.size;
}
