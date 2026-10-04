import { useEffect, useState } from 'react';

/**
 * Track a CSS media query from React.
 *
 * Needed because sprites are sized in JavaScript, not CSS — a canvas gets its
 * width in device pixels, so a media query alone cannot shrink one. Anything
 * that has to change a sprite's integer scale by viewport comes through here.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', handleChange);
    return () => list.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
