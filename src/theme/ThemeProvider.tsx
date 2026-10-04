import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FEATURES } from '../config/features';
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemePreference,
} from './ThemeContext';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredPreference(): ThemePreference {
  // localStorage throws in some private-browsing modes. A theme preference is
  // never worth breaking the page over.
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'day' || stored === 'night' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore — fall through to the default
  }
  return 'system';
}

function detectSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'day';
  return window.matchMedia(DARK_QUERY).matches ? 'night' : 'day';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(detectSystemTheme);

  // Follow the operating system while the preference is `system`.
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'night' : 'day');
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // While night mode is off, the answer is always day regardless of what the
  // device prefers or what was stored from a previous visit.
  const theme: ResolvedTheme = !FEATURES.nightMode
    ? 'day'
    : preference === 'system'
      ? systemTheme
      : preference;

  // Stamp the root element. No attribute at all means "follow the OS", which
  // is what the CSS in theme.css expects for the un-stamped state.
  useEffect(() => {
    const root = document.documentElement;

    if (!FEATURES.nightMode) {
      // Stamping 'day' is what actually switches night off: theme.css guards
      // its dark media query with :not([data-theme='day']), so this makes a
      // dark-mode device render the day theme rather than being ignored.
      root.setAttribute('data-theme', 'day');
      return;
    }

    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore — the preference simply will not survive a reload
    }
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = current === 'system' ? detectSystemTheme() : current;
      const next: ThemePreference = resolved === 'day' ? 'night' : 'day';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
