import { createContext } from 'react';

/** What the visitor asked for. `system` follows the operating system. */
export type ThemePreference = 'system' | 'day' | 'night';

/** What is actually on screen once `system` has been resolved. */
export type ResolvedTheme = 'day' | 'night';

export type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Cycle day -> night -> day, leaving `system` behind on first use. */
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'afad:theme-preference';
