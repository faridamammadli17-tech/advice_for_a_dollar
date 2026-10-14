import { Link } from 'react-router-dom';
import { FEATURES } from '../../config/features';
import { useT } from '../../i18n';

/**
 * The footer.
 *
 * The cookie line is deliberately a statement of fact rather than a link to a
 * policy: this site sets no tracking cookies, and the spec asks that if that
 * is true it should be said honestly rather than dressed up as a policy page.
 */
export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-foot">
      <div className="wrap site-foot-inner">
        <div className="foot-col">
          <span className="foot-title">{t.copy.siteName}</span>
          <p className="foot-note">{t.copy.footer.tagline}</p>
          <p className="foot-note">{t.copy.footer.cookieNote}</p>
        </div>

        <div className="foot-col">
          <span className="foot-title">{t.ui.footer.pages}</span>
          <Link to="/">{t.ui.nav.home}</Link>
          <Link to="/ask">{t.ui.nav.getAdvice}</Link>
          {FEATURES.staticPages && <Link to="/how-it-works">{t.ui.nav.howItWorks}</Link>}
          {FEATURES.archive && <Link to="/archive">{t.ui.nav.browse}</Link>}
          {FEATURES.staticPages && <Link to="/about">{t.ui.nav.about}</Link>}
        </div>

        {FEATURES.recovery && (
          <div className="foot-col">
            <span className="foot-title">{t.ui.footer.lostLink}</span>
            <Link to="/recover">{t.ui.footer.recover}</Link>
          </div>
        )}

        {FEATURES.staticPages && (
          <div className="foot-col">
            <span className="foot-title">{t.ui.footer.smallPrint}</span>
            <Link to="/privacy">{t.ui.footer.privacy}</Link>
            <Link to="/terms">{t.ui.footer.terms}</Link>
            <Link to="/community-guidelines">{t.ui.footer.guidelines}</Link>
          </div>
        )}
      </div>

      <div className="wrap foot-bottom">
        <span>{t.ui.footer.notTherapy}</span>
      </div>
    </footer>
  );
}
