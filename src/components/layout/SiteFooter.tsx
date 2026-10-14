import { Link } from 'react-router-dom';
import { FEATURES } from '../../config/features';
import { copy } from '../../content/placeholder';

/**
 * The footer.
 *
 * The cookie line is deliberately a statement of fact rather than a link to a
 * policy: this site sets no tracking cookies, and the spec asks that if that
 * is true it should be said honestly rather than dressed up as a policy page.
 */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap site-foot-inner">
        <div className="foot-col">
          <span className="foot-title">{copy.siteName}</span>
          <p className="foot-note">{copy.footer.tagline}</p>
          <p className="foot-note">{copy.footer.cookieNote}</p>
        </div>

        <div className="foot-col">
          <span className="foot-title">Pages</span>
          <Link to="/">Home</Link>
          <Link to="/ask">Get advice</Link>
          {FEATURES.staticPages && <Link to="/how-it-works">How it works</Link>}
          {FEATURES.archive && <Link to="/archive">Browse problems</Link>}
          {FEATURES.staticPages && <Link to="/about">About</Link>}
        </div>

        {FEATURES.recovery && (
          <div className="foot-col">
            <span className="foot-title">Lost your link?</span>
            <Link to="/recover">Recover a submission</Link>
          </div>
        )}

        {FEATURES.staticPages && (
          <div className="foot-col">
            <span className="foot-title">The small print</span>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/community-guidelines">Community guidelines</Link>
          </div>
        )}
      </div>

      <div className="wrap foot-bottom">
        <span>Not therapy. Not professional psychological care.</span>
      </div>
    </footer>
  );
}
