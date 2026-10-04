import { NavLink, Link } from 'react-router-dom';
import portrait from '../../pixel/assets/bunny_portrait_01.png';
import { ThemeToggle } from '../ThemeToggle';
import { FEATURES } from '../../config/features';
import { copy } from '../../content/placeholder';

/**
 * The header.
 *
 * Links are gated on feature flags rather than rendered as dead ends — a
 * visitor clicking through to a page that does not exist yet is worse than
 * not seeing the link. Phase 3 turns the rest on.
 *
 * The logo is the bunny's portrait, at its native 128 pixels: it is the site's
 * profile picture everywhere (Farida, 2026-10-04). Whole-number scaling only,
 * so a smaller header would need a 64-pixel version from the artist.
 */
export function SiteHeader() {
  return (
    <header className="site-head">
      <div className="wrap site-head-inner">
        <Link to="/" className="brand" aria-label={`${copy.siteName} — home`}>
          <img className="brand-logo" src={portrait} alt="" width={128} height={128} />
          <span className="brand-name">{copy.siteName}</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          <NavLink to="/">Home</NavLink>
          {FEATURES.staticPages && <NavLink to="/how-it-works">How it works</NavLink>}
          <NavLink to="/ask">Get advice</NavLink>
          {FEATURES.archive && <NavLink to="/archive">Browse problems</NavLink>}
          {FEATURES.staticPages && <NavLink to="/about">About</NavLink>}
          {FEATURES.staticPages && <NavLink to="/faq">FAQ</NavLink>}
          {FEATURES.nightMode && <ThemeToggle />}
        </nav>
      </div>
    </header>
  );
}
