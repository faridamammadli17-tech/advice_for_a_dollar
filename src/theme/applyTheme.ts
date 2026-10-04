import { FEATURES } from '../config/features';
import { THEME_STORAGE_KEY } from './ThemeContext';

/**
 * Stamp `data-theme` on the root element BEFORE React renders.
 *
 * This has to be synchronous, and it has to happen first.
 *
 * React effects run after the first paint. Without this, the very first render
 * happens on an un-stamped document — so on a device set to dark mode the
 * `prefers-color-scheme: dark` block applies for one frame. That is bad enough
 * as a flash of the wrong theme, but it caused something worse: sprites resolve
 * their palette from live CSS custom properties and cache the result under a
 * theme key. The first resolution therefore cached NIGHT colours under the key
 * 'day', and every sprite on the page stayed dark on a light background until
 * a hard reload.
 *
 * Stamping before render removes the window in which that can happen.
 */
export function applyThemeAttribute(): void {
  const root = document.documentElement;

  if (!FEATURES.nightMode) {
    root.setAttribute('data-theme', 'day');
    return;
  }

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Private browsing. Fall through to following the device.
  }

  if (stored === 'day' || stored === 'night') {
    root.setAttribute('data-theme', stored);
  } else {
    root.removeAttribute('data-theme');
  }
}
