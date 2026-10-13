import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The box the writing flow opens in, over the home page.
 *
 * A native <dialog> shown modally, so the browser traps focus inside it and
 * reads it as a dialog. Escape closes it unless `locked` (while something is
 * being sent). Nothing is ever lost by closing: the text is in the draft and
 * the writing box behind. The backdrop is transparent on purpose: nothing
 * may sit between Farida's forest and the screen, and the box carries
 * itself with its border and shadow.
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

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      onClosed?.();
    }
  }, [open, onClosed]);

  return (
    <dialog
      ref={ref}
      className="flow-dialog"
      aria-label={label}
      onCancel={(event) => {
        // Escape. Closing by hand is fine; closing mid-send is not.
        event.preventDefault();
        if (!locked) onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
