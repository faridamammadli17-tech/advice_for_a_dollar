import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function detect(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Whether the visitor has asked their device for less motion.
 *
 * Some people switch this on because animation makes them physically unwell,
 * so it is not a nice-to-have. Sprites pin to their first frame, ambient
 * motion stops, and the submission flow still completes end to end.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(detect);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
