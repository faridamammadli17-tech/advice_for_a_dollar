import { useLayoutEffect } from 'react';

/**
 * Pins the page while something modal is open (the flow box, the phone
 * menu), so it cannot scroll under a finger.
 *
 * `overflow: hidden` on the body is not enough on iOS Safari, which keeps
 * scrolling the document behind a modal. Fixing the body at its current
 * scroll offset holds it still; on release the offset is put back so the
 * page is exactly where it was. The width and the scrollbar gutter are
 * kept so nothing shifts sideways when the lock goes on. Two locks at once
 * (a menu over the box cannot happen, but the count keeps it honest) share
 * one pin.
 */
let locks = 0;
let scrollYBefore = 0;

export function useScrollLock(active: boolean): void {
  useLayoutEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    if (locks === 0) {
      scrollYBefore = window.scrollY;
      const gutter = window.innerWidth - documentElement.clientWidth;
      body.style.top = `-${scrollYBefore}px`;
      if (gutter > 0) body.style.paddingRight = `${gutter}px`;
      body.classList.add('scroll-locked');
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks > 0) return;
      body.classList.remove('scroll-locked');
      body.style.top = '';
      body.style.paddingRight = '';
      // Instant, whatever smooth-scroll setting the page has: the page must
      // land exactly where it was, with no visible travel.
      const behaviour = documentElement.style.scrollBehavior;
      documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, scrollYBefore);
      documentElement.style.scrollBehavior = behaviour;
    };
  }, [active]);
}
