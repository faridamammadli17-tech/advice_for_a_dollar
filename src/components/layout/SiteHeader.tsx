import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import portrait from '../../pixel/assets/bunny_portrait_01.png';
import { ThemeToggle } from '../ThemeToggle';
import { FEATURES } from '../../config/features';
import { copy } from '../../content/placeholder';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * The header.
 *
 * Links are gated on feature flags rather than rendered as dead ends — a
 * visitor clicking through to a page that does not exist yet is worse than
 * not seeing the link. Phase 3 turns the rest on.
 *
 * There is no "Get advice" entry: the writing box is the home page, so Home
 * is that link (owner, 2026-10-22).
 *
 * The logo is the bunny's portrait, at its native 128 pixels: it is the site's
 * profile picture everywhere (Farida, 2026-10-04). Whole-number scaling only,
 * so it is the same 128px drawing in the band on a phone too, with room
 * around it (a crop and a hanging card were both tried and turned down,
 * 2026-11-06); a smaller version is the artist's to draw.
 *
 * On a phone the menu is a button that opens a sheet under the header: a
 * native <dialog>, so Escape closes it and focus stays inside it; a tap on
 * the backdrop closes it; the page behind is pinned (useScrollLock); it
 * closes itself on navigation. Wider screens show the links in a row and no
 * button; the sheet's links are only rendered while it is open, so there is
 * never a second "Main" navigation in the page.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  useScrollLock(menuOpen);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const menu = menuRef.current;
    if (menu === null) return;
    if (menuOpen && !menu.open) menu.showModal();
    if (!menuOpen && menu.open) menu.close();
  }, [menuOpen]);

  const links = (
    <>
      <NavLink to="/" end>
        Home
      </NavLink>
      {FEATURES.staticPages && <NavLink to="/how-it-works">How it works</NavLink>}
      {FEATURES.archive && <NavLink to="/archive">Browse problems</NavLink>}
      {FEATURES.staticPages && <NavLink to="/about">About</NavLink>}
      {FEATURES.staticPages && <NavLink to="/faq">FAQ</NavLink>}
      {FEATURES.nightMode && <ThemeToggle />}
    </>
  );

  return (
    <header className="site-head">
      <div className="wrap site-head-inner">
        <Link to="/" className="brand" aria-label={`${copy.siteName} — home`}>
          <span className="brand-logo-frame">
            <img className="brand-logo" src={portrait} alt="" width={128} height={128} />
          </span>
          <span className="brand-name">{copy.siteName}</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {links}
        </nav>

        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="menu-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="menu-word">Menu</span>
        </button>
      </div>

      <dialog
        id="site-menu"
        ref={menuRef}
        className="menu-dialog"
        aria-label="Menu"
        onCancel={(event) => {
          event.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          // A tap on the backdrop reaches the dialog element itself.
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
        {menuOpen && (
          <div className="menu-sheet">
            <div className="menu-head">
              <span className="menu-title">{copy.siteName}</span>
              <button type="button" className="menu-close" onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </div>
            <nav className="menu-nav" aria-label="Main">
              {links}
            </nav>
          </div>
        )}
      </dialog>
    </header>
  );
}
