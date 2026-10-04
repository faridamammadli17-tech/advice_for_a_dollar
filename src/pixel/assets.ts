import { artUrl } from './imageCache';
import { type Sprite, type SpriteAnimation, type SpriteFrame } from './types';

/**
 * THE ASSET MANIFEST — the single place artwork is registered.
 *
 * Every character, object, icon and background the site will ever draw is
 * listed here with its exact 1x canvas size and its animation contract
 * (how many frames, at what speed). Nothing else in the codebase hardcodes a
 * sprite dimension.
 *
 * While `src` is null the artwork has not been delivered, and a DRAFT
 * placeholder is generated at the exact final dimensions. Swapping a draft for
 * real art is then a one-line change here — which is the whole point of the
 * placeholder policy in ART_GUIDELINES.md §13.
 *
 * DRAFT placeholders are deliberately ugly: a flat block, a hatch, and a row
 * of pips counting the current frame. They must never be mistaken for
 * finished art, and they must never ship to visitors.
 */

export type AssetAnimationSpec = {
  readonly id: string;
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
  readonly description: string;
};

export type AssetEntry = {
  readonly id: string;
  readonly label: string;
  /** 1x canvas, exactly as specified to the artist. */
  readonly width: number;
  readonly height: number;
  readonly animations: readonly AssetAnimationSpec[];
  readonly defaultAnimation: string;
  /** Path to delivered artwork. `null` = not delivered; render a DRAFT block. */
  readonly src: string | null;
  /** Grouping for the inspector. */
  readonly group: 'character' | 'object' | 'icon' | 'scene' | 'diagnostic';
  readonly note?: string;
};

/* ---------------------------------------------------------------------------
   DRAFT placeholder generation
   --------------------------------------------------------------------------- */

const DRAFT_PALETTE = {
  o: '--draft-edge',
  d: '--draft-fill',
  p: '--accent',
} as const;

/**
 * A flat block at the exact final dimensions, with:
 *   - a 1px border, so the true canvas size is visible
 *   - a diagonal hatch, so it can never read as finished art
 *   - pips counting the frame, so frame count and timing can be verified
 *     before any real artwork exists
 */
function draftFrame(
  width: number,
  height: number,
  frameIndex: number,
): SpriteFrame {
  const grid: string[][] = [];

  for (let y = 0; y < height; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < width; x += 1) {
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      row.push(onEdge ? 'o' : 'd');
    }
    grid.push(row);
  }

  for (let y = 1; y < height - 1; y += 1) {
    const row = grid[y];
    if (row === undefined) continue;
    for (let x = 1; x < width - 1; x += 1) {
      if ((x + y) % 6 === 0) row[x] = 'o';
    }
  }

  // Frame pips along the bottom edge: frame 0 shows one pip, frame 3 shows four.
  const pipRowIndex = height - 3;
  const pipRow = grid[pipRowIndex];
  if (pipRow !== undefined && height >= 6 && width >= 6) {
    const maxPips = Math.floor((width - 4) / 2);
    const pipCount = Math.min(frameIndex + 1, Math.max(maxPips, 1));
    for (let pip = 0; pip < pipCount; pip += 1) {
      const x = 2 + pip * 2;
      if (x < width - 1) pipRow[x] = 'p';
    }
  }

  return { rows: grid.map((row) => row.join('')) };
}

function draftAnimation(entry: AssetEntry, spec: AssetAnimationSpec): SpriteAnimation {
  const frames: SpriteFrame[] = [];
  for (let index = 0; index < spec.frames; index += 1) {
    frames.push(draftFrame(entry.width, entry.height, index));
  }
  return {
    id: spec.id,
    frames,
    fps: spec.fps,
    loop: spec.loop,
    description: spec.description,
  };
}

/**
 * Build a Sprite from a manifest entry.
 *
 * If the artwork named by the entry is present in `src/pixel/assets/`, the
 * sprite is backed by that image. Otherwise it falls back to the DRAFT
 * placeholder, so a missing file degrades to scaffolding rather than a blank.
 */
export function draftSpriteFromAsset(entry: AssetEntry): Sprite {
  if (entry.src !== null) {
    const url = artUrl(entry.src);
    if (url !== null) {
      const animations: Record<string, SpriteAnimation> = {};
      for (const spec of entry.animations) {
        animations[spec.id] = {
          id: spec.id,
          /*
           * ONE frame, because one image has been delivered.
           *
           * `spec.frames` is the *intended* count — what the animation will be
           * once the artist sends the rest. Building that many frames here
           * would make the inspector report "4 frames" for a sprite that has
           * one, which is the opposite of what an inspector is for.
           *
           * When frame files arrive this becomes one entry per file, and the
           * delivered count catches up with the intended one.
           */
          frames: [{ rows: [] }],
          fps: spec.fps,
          loop: spec.loop,
          description:
            spec.frames > 1
              ? `${spec.description} (1 of ${spec.frames} frames delivered)`
              : spec.description,
        };
      }
      return {
        id: entry.id,
        label: entry.label,
        width: entry.width,
        height: entry.height,
        palette: {},
        animations,
        defaultAnimation: entry.defaultAnimation,
        isDraft: false,
        src: url,
      };
    }
  }
  return draftPlaceholder(entry);
}

function draftPlaceholder(entry: AssetEntry): Sprite {
  const animations: Record<string, SpriteAnimation> = {};
  for (const spec of entry.animations) {
    animations[spec.id] = draftAnimation(entry, spec);
  }

  return {
    id: entry.id,
    label: entry.label,
    width: entry.width,
    height: entry.height,
    palette: DRAFT_PALETTE,
    animations,
    defaultAnimation: entry.defaultAnimation,
    isDraft: true,
  };
}

/* ---------------------------------------------------------------------------
   THE MANIFEST
   --------------------------------------------------------------------------- */

const idle = (frames: number, description: string): AssetAnimationSpec => ({
  id: 'idle',
  frames,
  fps: 6,
  loop: true,
  description,
});

export const ASSETS: Readonly<Record<string, AssetEntry>> = {
  /* ---- characters ---- */

  bunny: {
    id: 'bunny',
    label: 'Bunny — the one writing back',
    // The standing bunny with the lantern staff, delivered 2026-10-04 as a
    // 1920x1920 JPEG that was a clean 15x upscale of 128x128. Recovered by
    // taking the most common colour of each 15x15 block (which also shrugs
    // off the JPEG noise) and lifting the white background to transparent.
    // The earlier sitting bunny is kept in originals/.
    width: 128,
    height: 128,
    group: 'character',
    src: 'bunny_idle_01.png',
    defaultAnimation: 'idle',
    animations: [
      idle(3, 'Breathing and a slow ear twitch. Loops forever, so it stays subtle.'),
      {
        id: 'blink',
        frames: 2,
        fps: 8,
        loop: false,
        description: 'Closed-eye overlay, fired randomly every 3–6 seconds.',
      },
    ],
    note: 'The home page animates this one with CSS (bob, blink, lantern sparkle); see src/components/Bunny.tsx.',
  },

  bunny_portrait: {
    id: 'bunny_portrait',
    label: 'Bunny — portrait',
    // Close-up of the same character, delivered 2026-10-04 as a lossless 15x
    // PNG with transparency. Used on the home page, centred under the hero.
    width: 128,
    height: 128,
    group: 'character',
    src: 'bunny_portrait_01.png',
    defaultAnimation: 'idle',
    animations: [
      idle(1, 'Still portrait.'),
      {
        id: 'blink',
        frames: 2,
        fps: 8,
        loop: false,
        description: 'Closed-eye frame, shown for a moment every few seconds.',
      },
    ],
  },

  frog: {
    id: 'frog',
    label: 'Frog — the problem-writer',
    width: 64,
    height: 64,
    group: 'character',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(3, 'Standing idle, away from the computer.')],
  },

  typist: {
    id: 'typist',
    label: 'Typist — frog at the computer',
    // The delivered art is 128x128. Recovered losslessly from a clean 15x
    // nearest-neighbour upscale — see scripts/downscale-art.py.
    width: 128,
    height: 128,
    group: 'character',
    src: 'typist_idle_01.png',
    defaultAnimation: 'idle',
    animations: [
      idle(2, 'Sitting at the desk, not typing.'),
      {
        id: 'typing',
        frames: 4,
        fps: 10,
        loop: true,
        description:
          'Two alternating hand positions plus a slower head bob. Eases in while the visitor types, returns to idle ~700ms after they stop.',
      },
    ],
  },

  /* ---- the submission ceremony ---- */

  envelope: {
    id: 'envelope',
    label: 'Envelope ceremony',
    width: 64,
    height: 64,
    group: 'object',
    src: null,
    defaultAnimation: 'ceremony',
    animations: [
      {
        id: 'ceremony',
        frames: 26,
        fps: 12,
        loop: false,
        description:
          'Letter forms (4) · fold (4) · slide in (4) · flap closes (3) · seal stamps (3) · particle burst (3) · hop and settle (5).',
      },
    ],
    note: 'Must never block or delay the actual submission result.',
  },

  /* ---- interface objects (32x32) ---- */

  object_key: {
    id: 'object_key',
    label: 'Key',
    width: 32,
    height: 32,
    group: 'object',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static. Used around the secret word.')],
  },

  object_coin: {
    id: 'object_coin',
    label: 'Coin',
    width: 32,
    height: 32,
    group: 'object',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static. Used around payment.')],
  },

  object_stamp: {
    id: 'object_stamp',
    label: 'Wax stamp',
    width: 32,
    height: 32,
    group: 'object',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static. The seal that closes the envelope.')],
  },

  /* ---- logo ---- */

  logo_bunny_head: {
    id: 'logo_bunny_head',
    label: 'Logo — bunny head',
    width: 32,
    height: 32,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
    note: 'Must still read at 16px as a favicon.',
  },

  /* ---- small UI icons (16x16) ---- */

  icon_arrow: {
    id: 'icon_arrow',
    label: 'Icon — arrow',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },
  icon_heart: {
    id: 'icon_heart',
    label: 'Icon — heart',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },
  icon_lock: {
    id: 'icon_lock',
    label: 'Icon — lock',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },
  icon_star: {
    id: 'icon_star',
    label: 'Icon — star',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },
  icon_check: {
    id: 'icon_check',
    label: 'Icon — check',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },
  icon_copy: {
    id: 'icon_copy',
    label: 'Icon — copy',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static. Used on the magic link.')],
  },
  icon_close: {
    id: 'icon_close',
    label: 'Icon — close',
    width: 16,
    height: 16,
    group: 'icon',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Static.')],
  },

  /* ---- scenes ---- */

  hero_scene: {
    id: 'hero_scene',
    label: 'Hero scene — frog + desk + bunny',
    width: 160,
    height: 96,
    group: 'scene',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Composite still; characters animate on top.')],
  },

  background_day: {
    id: 'background_day',
    label: 'Background — day',
    // The forest scene, delivered 2026-10-04 as a 960x558 JPEG that was a 2x
    // upscale of 480x279. Recovered per 2x2 block and tidied to 40 colours.
    // Drawn full-bleed behind the home page at a whole-number scale that
    // covers the viewport, anchored to the ground; see ForestScene.tsx.
    width: 480,
    height: 279,
    group: 'scene',
    src: 'forest_day.png',
    defaultAnimation: 'idle',
    animations: [idle(1, 'Full-bleed scene.')],
    note: 'The bunny and frog on the mushroom sit at the left edge, so wide screens show them and phones show the meadow.',
  },

  background_night: {
    id: 'background_night',
    label: 'Background — night',
    width: 480,
    height: 270,
    group: 'scene',
    src: null,
    defaultAnimation: 'idle',
    animations: [idle(1, 'Full-bleed scene, night palette.')],
    note: 'Essential composition must sit inside the centre 192x270 safe zone.',
  },
};

/** Every asset still waiting on the artist. */
export function undeliveredAssets(): AssetEntry[] {
  return Object.values(ASSETS).filter((entry) => entry.src === null);
}
