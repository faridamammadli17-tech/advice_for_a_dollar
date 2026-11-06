import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';

/**
 * The box the writing flow opens in, over the home page.
 *
 * A native <dialog> shown modally, so the browser traps focus inside it and
 * reads it as a dialog. Escape closes it unless `locked` (while something is
 * being sent). Nothing is ever lost by closing: the text is in the draft and
 * the writing box behind. The backdrop is transparent on purpose: nothing
 * may sit between Farida's forest and the screen, and the box carries
 * itself with its border and shadow.
 *
 * On a phone three more things matter, and all three are here:
 *   - the page behind is pinned while the box is open (useScrollLock), so
 *     dragging on the box never moves the forest underneath;
 *   - the box arrives and leaves with a short movement (SubmissionFlow.css,
 *     `data-closing` holds it open for the leaving animation; none under
 *     prefers-reduced-motion);
 *   - when a field inside takes focus and the keyboard comes up, the field
 *     is scrolled into view, once on focus and again if the visual viewport
 *     shrinks, so the keyboard never covers what someone is typing into.
 */
export function FlowDialog({
  open,
  locked = false,
  label,
  onClose,
  onClosed,
  children,
}: {
  open: boolean;
  locked?: boolean;
  label: string;
  onClose: () => void;
  /** After the box has really closed and the browser has put focus back. */
  onClosed?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      setClosing(false);
      dialog.showModal();
      return;
    }
    if (!open && dialog.open) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finish = () => {
        setClosing(false);
        if (dialog.open) dialog.close();
        onClosed?.();
      };
      if (reduced) {
        finish();
        return;
      }
      setClosing(true);
      const timer = window.setTimeout(finish, 160);
      return () => window.clearTimeout(timer);
    }
  }, [open, onClosed]);

  // Keep whatever is being typed into above the keyboard.
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    if (dialog === null) return;
    const reveal = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !dialog.contains(active)) return;
      if (!active.matches('input, textarea')) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      active.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    };
    const onFocus = () => window.setTimeout(reveal, 250);
    dialog.addEventListener('focusin', onFocus);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', reveal);
    return () => {
      dialog.removeEventListener('focusin', onFocus);
      viewport?.removeEventListener('resize', reveal);
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="flow-dialog"
      aria-label={label}
      data-closing={closing ? 'true' : undefined}
      onCancel={(event) => {
        // Escape. Closing by hand is fine; closing mid-send is not.
        event.preventDefault();
        if (!locked) onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      {(open || closing) && children}
    </dialog>
  );
}
