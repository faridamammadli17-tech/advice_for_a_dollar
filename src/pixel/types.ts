/**
 * Core sprite types.
 *
 * Sprites are authored as character grids rather than as imported images so
 * that they can be recoloured per theme, validated at load, and diffed in
 * review. When the artist delivers PNGs, an asset entry gains a `src` and the
 * draft grid is replaced — see `assets.ts`.
 */

/** The character meaning "nothing here". Always transparent, never in a palette. */
export const TRANSPARENT_CHAR = '.';

/**
 * Maps a single palette character to a CSS custom property name,
 * e.g. `{ R: '--c-rose' }`.
 *
 * Sprites reference tokens, never literal hex, so day/night is a token
 * re-map rather than a second copy of the artwork.
 */
export type SpritePalette = Readonly<Record<string, string>>;

export type SpriteFrame = {
  /** Rows of palette characters, top row first. Every row must be `width` long. */
  readonly rows: readonly string[];
};

export type SpriteAnimation = {
  readonly id: string;
  readonly frames: readonly SpriteFrame[];
  /** Frames per second. The art brief specifies ~6fps idle, ~10fps typing, ~12fps envelope. */
  readonly fps: number;
  readonly loop: boolean;
  /** Shown in the inspector to explain what the animation is for. */
  readonly description?: string;
};

export type Sprite = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly palette: SpritePalette;
  readonly animations: Readonly<Record<string, SpriteAnimation>>;
  readonly defaultAnimation: string;
  /**
   * True while this sprite is a DRAFT placeholder standing in for artwork that
   * has not been delivered. Consumers must badge it visibly in dev builds —
   * a placeholder must never be mistaken for finished art.
   */
  readonly isDraft: boolean;
  /** Human-readable name for the inspector. */
  readonly label: string;
  /**
   * Delivered artwork. When set, frames come from this image rather than from
   * the character grid, and `animations` describes only the timing.
   */
  readonly src?: string;
};

/** A problem found by `validateSprite`. */
export type SpriteProblem = {
  readonly spriteId: string;
  readonly animationId: string | null;
  readonly frameIndex: number | null;
  readonly message: string;
};
