import { type SafetyCategory } from '../lib/safety/screen';
import {
  CRISIS_HEADING,
  CRISIS_NUMBERS,
  CRISIS_NUMBERS_ARE_PLACEHOLDERS,
} from '../content/crisis';

import './SafetyInterstitial.css';

/**
 * ===========================================================================
 * THE SAFETY SCREEN
 * ===========================================================================
 *
 * This component deliberately breaks every other rule in this codebase.
 *
 * No characters. No sprites. No animation. No warmth-by-decoration, no
 * playfulness, no pixel art, no jokes, no mascot voice. The spec says this
 * overrides every playfulness rule in the document, and it means it.
 *
 * Someone reaching this screen is having the worst kind of day. A cartoon
 * frog would be an insult. So: plain type, calm language, real numbers, and
 * nothing asking anything of them.
 *
 * Nothing is charged. Nothing is submitted. Their text is not thrown away.
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

        <div className="safety-numbers">
          <span className="safety-numbers-title">{CRISIS_HEADING}</span>

          {/* Shown in every build, not only development. If placeholders ever
              reached a real visitor, being told plainly is far better than
              being handed a number that does not answer. */}
          {CRISIS_NUMBERS_ARE_PLACEHOLDERS && (
            <p className="safety-placeholder-warning">
              These numbers are placeholders and do not work. The real emergency numbers have not
              been added to this site yet.
            </p>
          )}

          <ul>
            {CRISIS_NUMBERS.map((entry) => (
              <li key={entry.number}>
                {CRISIS_NUMBERS_ARE_PLACEHOLDERS ? (
                  // Not a tel: link while it is fake — nothing here should be
                  // one tap away from dialling nowhere.
                  <span className="safety-number safety-number-fake">{entry.number}</span>
                ) : (
                  <a href={`tel:${entry.number.replace(/\s/g, '')}`} className="safety-number">
                    {entry.number}
                  </a>
                )}
                {entry.label !== null && <span className="safety-number-label">{entry.label}</span>}
              </li>
            ))}
          </ul>
        </div>

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
