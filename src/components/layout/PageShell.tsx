import { type ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { COPY_IS_PLACEHOLDER } from '../../content/placeholder';

/**
 * The frame every page sits in.
 *
 * While the copy is still mine rather than Farida's, development builds carry
 * a banner saying so. It is loud on purpose: placeholder words have a way of
 * quietly becoming shipped words.
 */
export function PageShell({
  children,
  backdrop = 'paper',
}: {
  children: ReactNode;
  /** `forest` lets a fixed scene show through; the home page uses it. */
  backdrop?: 'paper' | 'forest';
}) {
  return (
    <div className={backdrop === 'forest' ? 'shell shell-forest' : 'shell'}>
      {import.meta.env.DEV && COPY_IS_PLACEHOLDER && (
        <div className="copy-banner">
          Placeholder copy — written to be replaced, not shipped. See src/content/placeholder.ts
        </div>
      )}
      {/* First thing in the tab order. Someone navigating by keyboard should
          not have to tab through the whole nav on every page to reach the
          writing box — which on this site is the entire point of arriving. */}
      <a className="skip-link" href="#main">
        Skip to the main content
      </a>
      <SiteHeader />
      <main className="shell-main" id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
