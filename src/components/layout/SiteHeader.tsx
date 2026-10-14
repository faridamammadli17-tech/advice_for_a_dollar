import { NavLink, Link } from 'react-router-dom';
import portrait from '../../pixel/assets/bunny_portrait_01.png';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageSwitch } from '../LanguageSwitch';
import { FEATURES } from '../../config/features';
import { useT } from '../../i18n';

/**
 * The header.
 *
 * Links are gated on feature flags rather than rendered as dead ends — a
 * visitor clicking through to a page that does not exist yet is worse than
 * not seeing the link. Phase 3 turns the rest on.
 *
 * The logo is the bunny's portrait, at its native 128 pixels: it is the site's
 * profile picture everywhere (Farida, 2026-10-04). Whole-number scaling only,
 * so a smaller header would need a 64-pixel version from the artist. The
 * language switch (ENG / AZE) sits at the right end of the menu.
 */
export function SiteHeader() {
  const t = useT();
  return (
    <header className="site-head">
      <div className="wrap site-head-inner">
        <Link to="/" className="brand" aria-label={t.ui.nav.brandHome(t.copy.siteName)}>
          <img className="brand-logo" src={portrait} alt="" width={128} height={128} />
          <span className="brand-name">{t.copy.siteName}</span>
        </Link>

        <nav className="site-nav" aria-label={t.ui.nav.main}>
          <NavLink to="/">{t.ui.nav.home}</NavLink>
          {FEATURES.staticPages && <NavLink to="/how-it-works">{t.ui.nav.howItWorks}</NavLink>}
          <NavLink to="/ask">{t.ui.nav.getAdvice}</NavLink>
          {FEATURES.archive && <NavLink to="/archive">{t.ui.nav.browse}</NavLink>}
          {FEATURES.staticPages && <NavLink to="/about">{t.ui.nav.about}</NavLink>}
          {FEATURES.staticPages && <NavLink to="/faq">{t.ui.nav.faq}</NavLink>}
          {FEATURES.nightMode && <ThemeToggle />}
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
}
