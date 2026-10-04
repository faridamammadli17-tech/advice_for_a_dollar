import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { validateSprite } from '../pixel/palette';
import { isSpriteLoopRunning, spriteLoopSubscriberCount } from '../pixel/useSpriteLoop';
import { ALL_SPRITES, SPRITE_GROUPS } from '../pixel/sprites';
import { type Sprite, type SpriteProblem } from '../pixel/types';
import { useTheme } from '../theme/useTheme';
import { useReducedMotion } from '../theme/useReducedMotion';
import { type ThemePreference } from '../theme/ThemeContext';

import './DevSprites.css';

/**
 * THE SPRITE INSPECTOR — development only.
 *
 * This page is how "the sprites are correct" stops being a claim and starts
 * being something anyone can see. It shows:
 *
 *   - every sprite, every animation, at x1 / x2 / x3 / x4
 *   - day and night side by side on one page, so neither theme can rot unseen
 *   - a frame scrubber, for stepping through a long sequence frame by frame
 *   - the validation report for every registered sprite
 *   - live proof that one shared animation loop is driving everything
 *   - the mobile safe zone, at true proportions
 */

/** Keep a sample from growing past this many CSS pixels wide. */
const MAX_SAMPLE_PX = 420;

function scalesFor(sprite: Sprite): number[] {
  const fitting = [1, 2, 3, 4].filter((scale) => sprite.width * scale <= MAX_SAMPLE_PX);
  return fitting.length > 0 ? fitting : [1];
}

/* ------------------------------------------------------------------ */

function ThemedLadder({
  sprite,
  animationId,
  themeKey,
  frameIndex,
}: {
  sprite: Sprite;
  animationId: string;
  themeKey: 'day' | 'night';
  frameIndex?: number;
}) {
  return (
    <div className="insp-theme-panel" data-theme={themeKey}>
      <span className="insp-theme-name">{themeKey}</span>
      <div className="insp-ladder">
        {scalesFor(sprite).map((scale) => (
          <div className="insp-sample" key={scale}>
            <SpriteCanvas
              sprite={sprite}
              animation={animationId}
              scale={scale}
              themeKey={themeKey}
              frameIndex={frameIndex}
              alt={`${sprite.label}, ${animationId}, ${scale}x`}
            />
            <span className="insp-sample-label">
              &times;{scale} &middot; {sprite.width * scale}px
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimationBlock({ sprite, animationId }: { sprite: Sprite; animationId: string }) {
  const animation = sprite.animations[animationId];
  const [scrubFrame, setScrubFrame] = useState<number | null>(null);

  if (animation === undefined) return null;

  const frameCount = animation.frames.length;
  const canScrub = frameCount > 1;

  return (
    <div className="insp-anim">
      <div className="insp-anim-head">
        <span className="insp-anim-name">{animation.id}</span>
        <span className="insp-anim-meta">
          {frameCount} {frameCount === 1 ? 'frame' : 'frames'} &middot; {animation.fps}fps &middot;{' '}
          {animation.loop ? 'loops' : 'plays once'}
          {frameCount > 1 && <> &middot; {Math.round((frameCount / animation.fps) * 1000)}ms</>}
        </span>
      </div>

      {animation.description !== undefined && (
        <p className="insp-anim-desc">{animation.description}</p>
      )}

      {canScrub && (
        <div className="insp-scrub">
          <label htmlFor={`scrub-${sprite.id}-${animation.id}`}>Frame</label>
          <input
            id={`scrub-${sprite.id}-${animation.id}`}
            type="range"
            min={0}
            max={frameCount - 1}
            step={1}
            value={scrubFrame ?? 0}
            onChange={(event) => setScrubFrame(Number(event.target.value))}
          />
          <span className="insp-scrub-value">
            {scrubFrame === null ? 'live' : `${scrubFrame + 1}/${frameCount}`}
          </span>
          <button
            type="button"
            className="insp-btn"
            onClick={() => setScrubFrame(scrubFrame === null ? 0 : null)}
          >
            {scrubFrame === null ? 'Pin' : 'Play'}
          </button>
        </div>
      )}

      <div className="insp-themes">
        <ThemedLadder
          sprite={sprite}
          animationId={animation.id}
          themeKey="day"
          frameIndex={scrubFrame ?? undefined}
        />
        <ThemedLadder
          sprite={sprite}
          animationId={animation.id}
          themeKey="night"
          frameIndex={scrubFrame ?? undefined}
        />
      </div>
    </div>
  );
}

function SpriteCard({ sprite }: { sprite: Sprite }) {
  return (
    <article className="insp-card">
      <header className="insp-card-head">
        <span className="insp-card-name">{sprite.label}</span>
        <span className="insp-card-id">{sprite.id}</span>
        <span className="insp-card-dims">
          {sprite.width} &times; {sprite.height}
        </span>
        {sprite.isDraft && <span className="insp-badge">Draft</span>}
      </header>

      {Object.keys(sprite.animations).map((animationId) => (
        <AnimationBlock key={animationId} sprite={sprite} animationId={animationId} />
      ))}
    </article>
  );
}

/* ------------------------------------------------------------------ */

function SafeZoneTool() {
  return (
    <section className="insp-section">
      <div className="insp-section-head">
        <h2 className="insp-section-title">Mobile safe zone</h2>
        <p className="insp-section-blurb">
          A 480&times;270 background scales &times;3 on desktop and only &times;2 on a ~390px phone,
          which shows about 195 of its 480 pixels. Everything that carries meaning has to sit inside
          the centre 192. The outer bands are cropped away.
        </p>
      </div>

      <div className="insp-panel">
        <div className="insp-zone-frame">
          <div className="insp-zone-safe">
            <span className="insp-zone-tag">
              safe zone
              <br />
              192 &times; 270
            </span>
          </div>
        </div>
        <div className="insp-zone-scale">
          <span>~144px cropped</span>
          <span>centre 192px</span>
          <span>~144px cropped</span>
        </div>
      </div>
    </section>
  );
}

function LiveStats() {
  const [tick, setTick] = useState(0);
  const { theme, preference } = useTheme();
  const reducedMotion = useReducedMotion();

  // Poll rather than subscribing to the sprite loop: subscribing would inflate
  // the very number this panel is reporting.
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  // `tick` exists only to force a re-render; reading it here keeps the linter
  // honest about that and avoids remounting the panel with a changing key.
  void tick;

  return (
    <div className="insp-stats">
      <div className="insp-stat">
        <span className="insp-stat-label">Shared loop</span>
        <span className="insp-stat-value">{isSpriteLoopRunning() ? 'running' : 'idle'}</span>
      </div>
      <div className="insp-stat">
        <span className="insp-stat-label">Subscribers</span>
        <span className="insp-stat-value">{spriteLoopSubscriberCount()}</span>
      </div>
      <div className="insp-stat">
        <span className="insp-stat-label">Theme</span>
        <span className="insp-stat-value">
          {theme} / {preference}
        </span>
      </div>
      <div className="insp-stat">
        <span className="insp-stat-label">Reduced motion</span>
        <span className="insp-stat-value">{reducedMotion ? 'ON' : 'off'}</span>
      </div>
      <div className="insp-stat">
        <span className="insp-stat-label">Sprites</span>
        <span className="insp-stat-value">{ALL_SPRITES.length}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function DevSprites() {
  const { preference, setPreference } = useTheme();

  const problems: SpriteProblem[] = useMemo(
    () => ALL_SPRITES.flatMap((sprite) => validateSprite(sprite)),
    [],
  );

  const invalidIds = useMemo(
    () => new Set(problems.map((problem) => problem.spriteId)),
    [problems],
  );

  const draftCount = ALL_SPRITES.filter((sprite) => sprite.isDraft).length;

  return (
    <div className="insp">
      <div className="insp-inner">
        <header className="insp-head">
          <span className="insp-eyebrow">Advice for a Dollar · development only</span>
          <h1 className="insp-title">Sprite inspector</h1>
          <p className="insp-lede">
            Every sprite, every animation, at every whole-number scale, in both themes at once.
            {draftCount > 0 && (
              <>
                {' '}
                {draftCount} of {ALL_SPRITES.length} are DRAFT placeholders standing in for artwork
                that has not been delivered — flat blocks at the exact final dimensions, with pips
                counting the frame so timing can be checked before the art exists.
              </>
            )}
          </p>

          <div className="insp-controls">
            <div className="insp-control-group">
              <span className="insp-control-label" id="theme-label">
                Page theme
              </span>
              <div className="insp-buttons" role="group" aria-labelledby="theme-label">
                {(['system', 'day', 'night'] as const).map((option: ThemePreference) => (
                  <button
                    key={option}
                    type="button"
                    className="insp-btn"
                    aria-pressed={preference === option}
                    onClick={() => setPreference(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ margin: 0 }}>
              <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                &larr; Back
              </Link>
            </p>
          </div>

          <LiveStats />
        </header>

        <section
          className={problems.length > 0 ? 'insp-panel is-bad' : 'insp-panel'}
          aria-live="polite"
        >
          <h2 className="insp-panel-title">
            {problems.length > 0 ? `${problems.length} sprite problems` : 'Validation'}
          </h2>
          {problems.length === 0 ? (
            <p style={{ margin: 0, fontSize: '14px' }}>
              All {ALL_SPRITES.length} sprites pass: every frame matches its declared canvas, every
              row matches its declared width, and every character resolves to a palette token.
            </p>
          ) : (
            <ul className="insp-problems">
              {problems.map((problem, index) => (
                <li key={index}>
                  <strong>{problem.spriteId}</strong>
                  {problem.animationId !== null && ` / ${problem.animationId}`}
                  {problem.frameIndex !== null && ` / frame ${problem.frameIndex}`} —{' '}
                  {problem.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        <SafeZoneTool />

        {SPRITE_GROUPS.map((group) => (
          <section className="insp-section" key={group.title}>
            <div className="insp-section-head">
              <h2 className="insp-section-title">{group.title}</h2>
              <p className="insp-section-blurb">{group.blurb}</p>
            </div>

            {group.sprites.map((sprite) =>
              invalidIds.has(sprite.id) ? (
                <div className="insp-panel is-bad" key={sprite.id}>
                  <h3 className="insp-panel-title">{sprite.id} — not rendered</h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    This sprite failed validation. Fix the problems listed above; rendering it now
                    would only hide the fault.
                  </p>
                </div>
              ) : (
                <SpriteCard sprite={sprite} key={sprite.id} />
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
