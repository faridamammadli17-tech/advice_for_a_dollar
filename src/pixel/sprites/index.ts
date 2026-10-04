import { type Sprite } from '../types';
import { bunnySprite } from './bunny';
import { envelopeSprite } from './envelope';
import { frogSprite } from './frog';
import { iconSprites, logoSprite, objectSprites, sceneSprites } from './icons';
import { testCardSprite } from './testcard';
import { typistSprite } from './typist';

export { bunnySprite, envelopeSprite, frogSprite, logoSprite, testCardSprite, typistSprite };
export { iconSprites, objectSprites, sceneSprites };

export type SpriteGroup = {
  readonly title: string;
  readonly blurb: string;
  readonly sprites: readonly Sprite[];
};

/** Display order for the sprite inspector. */
export const SPRITE_GROUPS: readonly SpriteGroup[] = [
  {
    title: 'Diagnostics',
    blurb:
      'Hand-authored instruments, not artwork. These prove the renderer is honest before any real art exists.',
    sprites: [testCardSprite],
  },
  {
    title: 'Characters',
    blurb:
      'The two inhabitants of the world: the frog who writes, and the bunny who writes back. Unnamed — they display as ??? until Farida names them.',
    sprites: [bunnySprite, frogSprite, typistSprite],
  },
  {
    title: 'The ceremony',
    blurb: 'The envelope sequence that plays when a problem is submitted.',
    sprites: [envelopeSprite],
  },
  {
    title: 'Objects and logo',
    blurb: 'Interface objects at 32x32, plus the logo that must survive being shrunk to 16px.',
    sprites: [logoSprite, ...objectSprites],
  },
  {
    title: 'Icons',
    blurb: 'Small UI icons at 16x16, each with a 1px transparent margin.',
    sprites: iconSprites,
  },
  {
    title: 'Scenes',
    blurb:
      'The hero composite and the full-bleed backgrounds. Backgrounds are subject to the mobile safe zone.',
    sprites: sceneSprites,
  },
];

/** Flat list of every sprite in the project. */
export const ALL_SPRITES: readonly Sprite[] = SPRITE_GROUPS.flatMap((group) => group.sprites);
