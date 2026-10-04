import { useEffect, useRef } from 'react';

/**
 * THE shared animation loop.
 *
 * Every animated sprite, particle and ambient motion in the site subscribes
 * here. There is exactly one requestAnimationFrame loop for the whole page —
 * spawning a loop per sprite is the usual way a page like this ends up
 * burning a phone battery on a background that nobody is looking at.
 *
 * The loop stops entirely when no one is subscribed, and when the tab is
 * hidden.
 */

export type LoopSubscriber = (deltaMs: number, nowMs: number) => void;

const subscribers = new Set<LoopSubscriber>();

let frameHandle: number | null = null;
let lastTimestamp: number | null = null;

/**
 * Cap the reported delta. Returning from a hidden tab or a sleeping laptop
 * produces a delta of minutes, which would fast-forward every animation
 * through hundreds of frames at once.
 */
export const MAX_DELTA_MS = 100;

/**
 * Milliseconds to report for a tick. Extracted so the clamp can be tested
 * without running a real animation frame.
 */
export function clampDelta(previousTimestamp: number | null, timestamp: number): number {
  if (previousTimestamp === null) return 0;
  const delta = timestamp - previousTimestamp;
  // A backwards or zero step is not meaningful; treat it as no time passing.
  if (!(delta > 0)) return 0;
  return Math.min(delta, MAX_DELTA_MS);
}

function tick(timestamp: number): void {
  frameHandle = requestAnimationFrame(tick);

  const delta = clampDelta(lastTimestamp, timestamp);
  lastTimestamp = timestamp;

  // Iterate a copy: a subscriber may unsubscribe during its own callback.
  for (const subscriber of [...subscribers]) {
    subscriber(delta, timestamp);
  }
}

function start(): void {
  if (frameHandle !== null) return;
  lastTimestamp = null;
  frameHandle = requestAnimationFrame(tick);
}

function stop(): void {
  if (frameHandle === null) return;
  cancelAnimationFrame(frameHandle);
  frameHandle = null;
  lastTimestamp = null;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (subscribers.size > 0) {
      start();
    }
  });
}

/**
 * Subscribe outside React. Returns an unsubscribe function — callers must
 * invoke it, or the loop will keep running against a dead component.
 */
export function subscribeToSpriteLoop(subscriber: LoopSubscriber): () => void {
  subscribers.add(subscriber);
  if (typeof document === 'undefined' || !document.hidden) {
    start();
  }

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stop();
    }
  };
}

/**
 * How many things are currently driven by the loop. Used by the sprite
 * inspector to demonstrate that one loop is serving every sprite on the page.
 */
export function spriteLoopSubscriberCount(): number {
  return subscribers.size;
}

/** Whether the loop is currently running. */
export function isSpriteLoopRunning(): boolean {
  return frameHandle !== null;
}

// Development-only window handle, so the loop's real state can be inspected
// from the console instead of inferred from what is on screen.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__spriteLoop = {
    size: () => subscribers.size,
    handle: () => frameHandle,
    running: () => frameHandle !== null,
    start,
    stop,
  };
}

/**
 * Subscribe from a component. The callback may change on every render without
 * resubscribing — only `enabled` causes a resubscribe.
 */
export function useSpriteLoop(callback: LoopSubscriber, enabled = true): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    return subscribeToSpriteLoop((deltaMs, nowMs) => {
      callbackRef.current(deltaMs, nowMs);
    });
  }, [enabled]);
}
