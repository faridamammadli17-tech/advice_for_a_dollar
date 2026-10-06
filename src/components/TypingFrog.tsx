import { type CSSProperties } from 'react';
import layers from '../pixel/assets/typist/layers.json';
import desk from '../pixel/assets/typist/desk.png';
import body from '../pixel/assets/typist/body.png';
import head from '../pixel/assets/typist/head.png';
import arm from '../pixel/assets/typist/arm.png';
import text from '../pixel/assets/typist/text.png';
import './TypingFrog.css';

/**
 * The frog who writes, at his computer, on the home page.
 *
 * He is the delivered 128px frame cut into layers (scripts/make-typist-layers.py),
 * not a redrawing: the desk, his body, his head, the arm on the keyboard, and
 * the lines of text on the monitor. The frog himself never moves (Farida,
 * 2026-10-06): the only thing that changes is his screen, where the lines of
 * writing appear one at a time, pause, clear, and start again
 * (TypingFrog.css). Each line advances a whole pixel at a time with
 * `steps()`, and it all stops under prefers-reduced-motion, with the page
 * fully written.
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
      {layer(body, 'typist-body')}
      {layer(head, 'typist-face')}
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
