import { TRANSPARENT_CHAR, type Sprite, type SpritePalette, type SpriteProblem } from './types';

/**
 * Palette resolution.
 *
 * A sprite's palette maps characters to CSS custom property names. The actual
 * colour depends on the theme in effect *at the element*, not globally — the
 * inspector renders a day panel and a night panel on the same page, so
 * resolution reads from the sprite's own element and inherits from whichever
 * `[data-theme]` container it sits inside.
 *
 * Resolved values are cached per theme key, because getComputedStyle is
 * expensive and these colours only change when the theme changes.
 */

type ResolvedPalette = Readonly<Record<string, string>>;

const cache = new Map<string, ResolvedPalette>();

function cacheKey(themeKey: string, palette: SpritePalette): string {
  // Palette identity is its character-to-token mapping; two sprites sharing a
  // mapping share a cache entry.
  return `${themeKey}::${Object.entries(palette)
    .map(([char, token]) => `${char}=${token}`)
    .sort()
    .join(',')}`;
}

/**
 * Resolve a sprite palette to concrete CSS colour strings.
 *
 * @param palette  character -> custom property name
 * @param element  the element to resolve custom properties against
 * @param themeKey cache key; must change whenever the theme does
 */
export function resolvePalette(
  palette: SpritePalette,
  element: Element,
  themeKey: string,
): ResolvedPalette {
  const key = cacheKey(themeKey, palette);
  const cached = cache.get(key);
  if (cached) return cached;

  const computed = getComputedStyle(element);
  const resolved: Record<string, string> = {};
  const unresolved: string[] = [];

  for (const [char, token] of Object.entries(palette)) {
    const value = computed.getPropertyValue(token).trim();
    if (value === '') {
      // An unresolvable token would silently render nothing, which is the kind
      // of bug that survives review. Make it loud instead.
      resolved[char] = 'magenta';
      unresolved.push(`${char} -> ${token}`);
    } else {
      resolved[char] = value;
    }
  }

  if (unresolved.length > 0) {
    // Custom properties resolve to nothing on a detached element, and to
    // nothing at all before the stylesheet has applied. Either way the answer
    // is wrong rather than final, so it must not be cached — a cached magenta
    // would outlive the condition that caused it and stain every later render.
    if (import.meta.env.DEV) {
      console.warn(
        `[sprites] Palette tokens did not resolve (${unresolved.join(', ')}). ` +
          'Rendering magenta and not caching. The element is probably detached, ' +
          'or theme.css has not applied yet.',
      );
    }
    return resolved;
  }

  cache.set(key, resolved);
  return resolved;
}

/** Drop cached colours. Call when the theme changes or tokens are edited. */
export function clearPaletteCache(): void {
  cache.clear();
}

/**
 * Validate a sprite's geometry and palette coverage.
 *
 * Returns every problem found rather than throwing on the first, so the
 * inspector can list them all at once. `SpriteCanvas` throws on any problem in
 * development builds.
 */
export function validateSprite(sprite: Sprite): SpriteProblem[] {
  const problems: SpriteProblem[] = [];

  // Image-backed sprites carry no character grid — their pixels live in a PNG.
  // Geometry is checked against the file itself at load time instead.
  if (sprite.src !== undefined) {
    if (sprite.width <= 0 || sprite.height <= 0) {
      problems.push({
        spriteId: sprite.id,
        animationId: null,
        frameIndex: null,
        message: `Sprite has a non-positive canvas: ${sprite.width}x${sprite.height}.`,
      });
    }
    return problems;
  }
  const known = new Set(Object.keys(sprite.palette));

  const report = (
    message: string,
    animationId: string | null = null,
    frameIndex: number | null = null,
  ) => {
    problems.push({ spriteId: sprite.id, animationId, frameIndex, message });
  };

  if (sprite.width <= 0 || sprite.height <= 0) {
    report(`Sprite has a non-positive canvas: ${sprite.width}x${sprite.height}.`);
  }

  if (known.has(TRANSPARENT_CHAR)) {
    report(`'${TRANSPARENT_CHAR}' is reserved for transparency and must not be in the palette.`);
  }

  const animationIds = Object.keys(sprite.animations);
  if (animationIds.length === 0) {
    report('Sprite has no animations.');
  }

  if (!(sprite.defaultAnimation in sprite.animations)) {
    report(`defaultAnimation '${sprite.defaultAnimation}' is not one of: ${animationIds.join(', ') || '(none)'}.`);
  }

  for (const animationId of animationIds) {
    const animation = sprite.animations[animationId];
    if (!animation) continue;

    if (animation.frames.length === 0) {
      report('Animation has no frames.', animationId);
    }

    if (!(animation.fps > 0)) {
      report(`Animation fps must be greater than 0, got ${animation.fps}.`, animationId);
    }

    animation.frames.forEach((frame, frameIndex) => {
      if (frame.rows.length !== sprite.height) {
        report(
          `Frame has ${frame.rows.length} rows, expected ${sprite.height}.`,
          animationId,
          frameIndex,
        );
      }

      frame.rows.forEach((row, y) => {
        if (row.length !== sprite.width) {
          report(
            `Row ${y} is ${row.length} characters, expected ${sprite.width}.`,
            animationId,
            frameIndex,
          );
        }

        for (const char of row) {
          if (char !== TRANSPARENT_CHAR && !known.has(char)) {
            report(
              `Row ${y} uses '${char}', which is not in the palette (${[...known].join('')}).`,
              animationId,
              frameIndex,
            );
            break; // one report per row is enough to find the problem
          }
        }
      });
    });
  }

  return problems;
}

/** Format problems for a thrown error or a console message. */
export function formatProblems(problems: readonly SpriteProblem[]): string {
  return problems
    .map((problem) => {
      const where = [
        problem.spriteId,
        problem.animationId,
        problem.frameIndex === null ? null : `frame ${problem.frameIndex}`,
      ]
        .filter((part): part is string => part !== null)
        .join(' / ');
      return `  • ${where}: ${problem.message}`;
    })
    .join('\n');
}
