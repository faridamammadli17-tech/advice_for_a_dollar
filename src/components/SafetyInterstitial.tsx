import { type SafetyCategory } from '../lib/safety/screen';
import { CRISIS_NUMBERS, CRISIS_NUMBERS_ARE_PLACEHOLDERS } from '../content/crisis';
import { useT, type Translation } from '../i18n';

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
function leadFor(category: SafetyCategory | null, t: Translation): string {
  switch (category) {
    case 'medical_emergency':
      return t.ui.safety.leadMedical;
    case 'abuse_in_progress':
    case 'imminent_danger':
      return t.ui.safety.leadDanger;
    case 'minor_safety':
      return t.ui.safety.leadMinor;
    case 'self_harm':
    default:
      return t.ui.safety.leadDefault;
  }
}

export function SafetyInterstitial({ category, onBack }: SafetyInterstitialProps) {
  const t = useT();
  return (
    <div className="safety">
      <div className="safety-inner">
        <h1 className="safety-title">{leadFor(category, t)}</h1>

        <p className="safety-body">{t.ui.safety.body1}</p>

        <p className="safety-body">{t.ui.safety.body2}</p>

        <div className="safety-numbers">
          <span className="safety-numbers-title">{t.ui.safety.numbersHeading}</span>

          {/* Shown in every build, not only development. If placeholders ever
              reached a real visitor, being told plainly is far better than
              being handed a number that does not answer. */}
          {CRISIS_NUMBERS_ARE_PLACEHOLDERS && (
            <p className="safety-placeholder-warning">{t.ui.safety.placeholderWarning}</p>
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

        <p className="safety-body safety-reassure">{t.ui.safety.reassure}</p>

        <button type="button" className="safety-back" onClick={onBack}>
          {t.ui.safety.back}
        </button>
      </div>
    </div>
  );
}
