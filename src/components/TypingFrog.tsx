import { type CSSProperties } from 'react';
import layers from '../pixel/assets/typist/layers.json';
import desk from '../pixel/assets/typist/desk.png';
import body from '../pixel/assets/typist/body.png';
import head from '../pixel/assets/typist/head.png';
import headBlink from '../pixel/assets/typist/head_blink.png';
import arm from '../pixel/assets/typist/arm.png';
import text from '../pixel/assets/typist/text.png';
import './TypingFrog.css';

/**
 * The frog who writes, at his computer, on the home page.
 *
 * He is the delivered 128px frame cut into layers (scripts/make-typist-layers.py),
 * not a redrawing: the desk, his body, his head, the same head with the eye
 * shut, and the arm on the keyboard. CSS moves the layers by whole art pixels
 * (TypingFrog.css): his chest rises as he breathes, his head drops to look at
 * the keys and lifts to the screen, his hand taps, he blinks, and lines of
 * text appear on the monitor one at a time. Every move is a `steps()`
 * translate of a whole pixel, so nothing ever lands between pixels, and all
 * of it stops under prefers-reduced-motion.
 */

const CANVAS = layers.canvas;
const LINES = layers.lines;

type Props = {
  /** Whole numbers only: CSS pixels per art pixel. */
  readonly scale?: number;
  readonly className?: string;
};

export function TypingFrog({ scale = 3, className = '' }: Props) {
  const width = CANVAS.width * scale;
  const height = CANVAS.height * scale;
  const style = { '--px': `${scale}px`, width, height } as CSSProperties;

  const layer = (src: string, kind: string, extra?: CSSProperties) => (
    <img
      className={`typist-layer ${kind}`}
      src={src}
      alt=""
      width={width}
      height={height}
      draggable={false}
      style={extra}
    />
  );

  return (
    <div
      className={`typist ${className}`.trim()}
      style={style}
      role="img"
      aria-label="The frog who writes, typing at his computer"
    >
      {layer(desk, 'typist-desk')}
      <div className="typist-torso">
        {layer(body, 'typist-body')}
        <div className="typist-head">
          {layer(head, 'typist-face')}
          {layer(headBlink, 'typist-blink')}
        </div>
      </div>
      {layer(arm, 'typist-arm')}
      {LINES.map((line, index) =>
        layer(text, `typist-line typist-line-${index + 1}`, {
          '--line-top': line.y,
          '--line-bottom': CANVAS.height - line.y - 1,
          '--line-left': line.x,
          '--line-hidden': CANVAS.width - line.x,
          '--line-shown': CANVAS.width - line.x - line.width,
        } as CSSProperties),
      )}
    </div>
  );
}
