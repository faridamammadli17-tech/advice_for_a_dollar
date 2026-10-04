import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { SpriteCanvas } from '../pixel/SpriteCanvas';
import { typistSprite } from '../pixel/sprites';
import { useMediaQuery } from '../hooks/useMediaQuery';

/** How long after the last keystroke the typist returns to idle. From the spec. */
const RETURN_TO_IDLE_MS = 700;

export type WritingPadProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  helpText?: string;
  id?: string;
  autoFocus?: boolean;
  /** Show the frog. Off on steps where he would be a distraction. */
  showTypist?: boolean;
};

/**
 * The writing experience.
 *
 * The spec makes this the dominant interactive element of both the landing
 * page and /ask: someone arriving with a problem should never have to hunt
 * for where to write. So the textarea is real, focusable and visible without
 * scrolling, and it carries a proper label rather than relying on a
 * placeholder as its accessible name.
 *
 * The frog types while you type and settles about 700ms after you stop. He is
 * decorative — `aria-hidden` — because nothing about him carries meaning a
 * screen reader user would miss.
 */
export function WritingPad({
  value,
  onChange,
  label,
  placeholder,
  helpText,
  id = 'writing-pad',
  autoFocus = false,
  showTypist = true,
}: WritingPadProps) {
  const [isTyping, setIsTyping] = useState(false);
  const idleTimer = useRef<number | null>(null);
  const helpId = `${id}-help`;

  // The delivered frog is 128x128. At 1x that is already a comfortable size
  // beside the label, and it is his native resolution — there is no smaller
  // whole-number option, so on a narrow screen he is hidden rather than
  // squeezed. CSS cannot shrink a canvas sized in device pixels.
  const isNarrow = useMediaQuery('(max-width: 560px)');
  const typistScale = 1;

  const markTyping = useCallback(() => {
    setIsTyping(true);
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
    }
    idleTimer.current = window.setTimeout(() => {
      setIsTyping(false);
      idleTimer.current = null;
    }, RETURN_TO_IDLE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimer.current !== null) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    markTyping();
  };

  return (
    <div className="pad">
      <div className="field">
        {/* The label and the frog share a line, so he sits at the top edge of
            the box you are writing in rather than floating above it. */}
        <div className="pad-head">
          <label className="field-label" htmlFor={id}>
            {label}
          </label>
          {showTypist && !isNarrow && (
            <SpriteCanvas
              sprite={typistSprite}
              animation={isTyping ? 'typing' : 'idle'}
              scale={typistScale}
              alt={null}
            />
          )}
        </div>
        {helpText !== undefined && (
          <p className="field-help" id={helpId}>
            {helpText}
          </p>
        )}
        <textarea
          id={id}
          className="textarea pad-textarea"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-describedby={helpText === undefined ? undefined : helpId}
          // Autofocus is used sparingly and only where writing IS the page's
          // purpose, which is the case the accessibility guidance carves out.
          autoFocus={autoFocus}
          spellCheck
        />
      </div>
    </div>
  );
}
