import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { Admin } from './pages/Admin';
import { Answer } from './pages/Answer';
import { Archive } from './pages/Archive';
import { Ask } from './pages/Ask';
import { FoundationHome } from './pages/FoundationHome';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Problem } from './pages/Problem';
import { Recover } from './pages/Recover';
import { StaticPageView } from './pages/StaticPage';
import { FEATURES } from './config/features';
import { about, communityGuidelines, faq, howItWorks, privacy, terms } from './content/pages';

/**
 * Routing.
 *
 * `/dev/sprites` must never ship to visitors. A plain top-level import would
 * not achieve that: Rollup can tree-shake the component out of the JS bundle,
 * but `import './DevSprites.css'` is a side effect, so the inspector's
 * stylesheet would be bundled into the CSS every visitor downloads. Loading it
 * lazily behind a DEV check keeps the module and its stylesheet out of the
 * production build entirely.
 */
const DevSprites: ComponentType | null = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import('./pages/DevSprites');
      return { default: module.DevSprites };
    })
  : null;

/**
 * The real site uses path routes (/ask, /a/:token). A design preview hosted
 * on a static page with no server behind it cannot serve those paths, so a
 * build made with VITE_PREVIEW_ROUTER=hash uses #/ask style routes instead.
 * Nothing else changes, and the flag is never set for a real build.
 */
const Router = import.meta.env.VITE_PREVIEW_ROUTER === 'hash' ? HashRouter : BrowserRouter;

export function App() {
  return (
    <Router
      // Opt in to React Router v7 behaviour now: state updates wrapped in
      // startTransition, and relative paths inside splat routes resolved the
      // v7 way. Silences the upgrade warnings and avoids a surprise later.
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/a/:token" element={<Answer />} />
        {FEATURES.recovery && <Route path="/recover" element={<Recover />} />}

        {/* Guarded by the server, not by this route: every admin endpoint
            refuses without a valid session, so the page renders a login
            rather than relying on the router to protect anything. */}
        <Route path="/admin" element={<Admin />} />

        {/* The archive stays behind a flag until there is enough approved
            content to be worth reading. The architecture supports it either
            way — only these two routes and the nav links are gated. */}
        {FEATURES.archive && <Route path="/archive" element={<Archive />} />}
        {FEATURES.archive && <Route path="/problem/:id" element={<Problem />} />}

        {FEATURES.staticPages && (
          <Route path="/how-it-works" element={<StaticPageView page={howItWorks} />} />
        )}
        {FEATURES.staticPages && <Route path="/about" element={<StaticPageView page={about} />} />}
        {FEATURES.staticPages && <Route path="/faq" element={<StaticPageView page={faq} />} />}
        {FEATURES.staticPages && (
          <Route
            path="/community-guidelines"
            element={<StaticPageView page={communityGuidelines} />}
          />
        )}
        {FEATURES.staticPages && (
          <Route path="/privacy" element={<StaticPageView page={privacy} />} />
        )}
        {FEATURES.staticPages && <Route path="/terms" element={<StaticPageView page={terms} />} />}

        {/* Phase 1's status page, kept reachable in development only. */}
        {import.meta.env.DEV && <Route path="/foundation" element={<FoundationHome />} />}
        {DevSprites !== null && (
          <Route
            path="/dev/sprites"
            element={
              <Suspense fallback={null}>
                <DevSprites />
              </Suspense>
            }
          />
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
