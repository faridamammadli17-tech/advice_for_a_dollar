import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { bunnySprite, typistSprite } from '../pixel/sprites';
import { ASSETS } from '../pixel/assets';
import { CHARACTERS, UNNAMED } from '../data/characters';

/**
 * The little world the characters live in.
 *
 * Two of them, since the correction of 2026-09-21: the frog who writes, and
 * the bunny who writes back. There is no owl.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A BOUNDED STAGE AND NOT A FULL-BLEED BACKGROUND
 * ---------------------------------------------------------------------------
 * The spec asks for a living full-bleed background built from Farida's
 * artwork. Until that artwork is saved into the repo as files, the registered
 * background asset is a DRAFT placeholder — a hatched block. Stretching a
 * hatched block across the whole homepage would bury every other element.
 *
 * So while the art is outstanding, the world is a bounded stage: real theme
 * colours for ground and sky, and the draft character blocks standing on it.
 * Nothing here invents artwork. When `ASSETS.background_day.src` points at a
 * delivered scene, this becomes the full-bleed background.
 */
export function AmbientWorld() {
  const backgroundDelivered = ASSETS.background_day?.src !== null;

  return (
    <div className="world" aria-hidden="true">
      <div className="world-sky" />
      <div className="world-ground">
        <div className="world-cast">
          {CHARACTERS.map((character) => (
            <div className="world-figure" key={character.id}>
              <SpriteCanvas
                sprite={character.id === 'bunny' ? bunnySprite : typistSprite}
                // The delivered art is 128x128, so 1x already fills the stage.
                // Whole numbers only — 128 is the native size, not a starting point.
                scale={1}
                rimLight
                alt={null}
              />
              <span className="world-name">{character.displayName}</span>
              <span className="world-role">{character.role}</span>
            </div>
          ))}
        </div>
      </div>

      {!backgroundDelivered && import.meta.env.DEV && (
        <p className="world-note">
          Draft stage — the full-bleed scene appears here once Farida&rsquo;s artwork is saved into
          src/pixel/assets/. Both characters show as {UNNAMED} until they are named.
        </p>
      )}
    </div>
  );
}
