import { type SafetyCategory } from '../lib/safety/screen';
import { EMERGENCY_LINK } from '../content/crisis';

import './SafetyInterstitial.css';

/**
 * ===========================================================================
 * THE SAFETY SCREEN
 * ===========================================================================
 *
 * This component deliberately breaks every other rule in this codebase.
 *
 * No characters. No sprites. No animation. No forest. No warmth-by-
 * decoration, no playfulness, no pixel art, no jokes, no mascot voice. The
 * spec says this overrides every playfulness rule in the document, and it
 * means it.
 *
 * Someone reaching this screen is having the worst kind of day. A cartoon
 * frog would be an insult. So: plain type, calm language, one large link to
 * the emergency numbers for wherever they are, and nothing asking anything
 * of them.
 *
 * Nothing is charged. Nothing is submitted. Their text is not thrown away.
 *
 * The link is the most important control on the page: large, obviously
 * tappable, and it opens in a new tab so this page, with their words behind
 * it, stays where it was. `scripts/preflight.ts` refuses a release build
 * unless the address in crisis.ts is a real https:// one and this file
 * renders it (`href={EMERGENCY_LINK.url}`); keep that line as it is.
 */

export type SafetyInterstitialProps = {
  category: SafetyCategory | null;
  /** Lets them go back to what they wrote. Their words are never discarded. */
  onBack: () => void;
};

/** What to say first, by category. Plain statements, never instructions. */
function leadFor(category: SafetyCategory | null): string {
  switch (category) {
    case 'medical_emergency':
      return 'This sounds like it may need medical help right now.';
    case 'abuse_in_progress':
    case 'imminent_danger':
      return 'This sounds like you may not be safe right now.';
    case 'minor_safety':
      return 'This sounds like someone may not be safe right now.';
    case 'self_harm':
    default:
      return 'It sounds like you are going through something serious.';
  }
}

export function SafetyInterstitial({ category, onBack }: SafetyInterstitialProps) {
  return (
    <div className="safety">
      <div className="safety-inner">
        <h1 className="safety-title">{leadFor(category)}</h1>

        <p className="safety-body">
          This service is one person writing back over a day or two. That is not the right kind of
          help for something urgent, and waiting could matter here.
        </p>

        <p className="safety-body">
          Please contact emergency services. If you can, tell someone near you what is happening.
        </p>

        {/* The one emergency resource on the screen. The address is the
            visible text so that it can be read out, or typed into another
            device, if tapping is not an option. */}
        <a
          className="safety-link"
          href={EMERGENCY_LINK.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="safety-link-label">{EMERGENCY_LINK.label} -</span>
          {/* On a phone the address breaks after the scheme, not mid-word. */}
          <span className="safety-link-url">
            {EMERGENCY_LINK.url.replace(/^(https?:\/\/).*/, '$1')}
            <wbr />
            {EMERGENCY_LINK.url.replace(/^https?:\/\//, '')}
          </span>
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>

        <p className="safety-body safety-reassure">
          Nothing has been charged, and nothing has been sent. What you wrote is still here.
        </p>

        <button type="button" className="safety-back" onClick={onBack}>
          Go back to what I wrote
        </button>
      </div>
    </div>
  );
}
