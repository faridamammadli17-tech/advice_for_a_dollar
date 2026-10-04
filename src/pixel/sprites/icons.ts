import { ASSETS, draftSpriteFromAsset, type AssetEntry } from '../assets';
import { type Sprite } from '../types';

/**
 * Small UI icons (16x16), interface objects (32x32) and the logo.
 *
 * All DRAFT placeholders until the manifest points at delivered artwork.
 * Rule 8 of the build spec applies here as much as to the characters: no
 * emoji, no icon fonts, no stock SVGs. A labelled block at the correct size
 * is the only acceptable stand-in.
 */

function fromManifest(id: string): Sprite {
  const entry: AssetEntry | undefined = ASSETS[id];
  if (entry === undefined) {
    throw new Error(`Asset "${id}" is missing from the manifest.`);
  }
  return draftSpriteFromAsset(entry);
}

export const logoSprite = fromManifest('logo_bunny_head');

export const iconSprites: Sprite[] = [
  fromManifest('icon_arrow'),
  fromManifest('icon_heart'),
  fromManifest('icon_lock'),
  fromManifest('icon_star'),
  fromManifest('icon_check'),
  fromManifest('icon_copy'),
  fromManifest('icon_close'),
];

export const objectSprites: Sprite[] = [
  fromManifest('object_key'),
  fromManifest('object_coin'),
  fromManifest('object_stamp'),
];

export const sceneSprites: Sprite[] = [
  fromManifest('hero_scene'),
  fromManifest('background_day'),
  fromManifest('background_night'),
];
