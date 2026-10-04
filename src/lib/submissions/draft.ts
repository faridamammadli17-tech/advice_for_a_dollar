/**
 * The visitor's in-progress text.
 *
 * Kept in localStorage from the first keystroke, for one reason the spec is
 * firm about: **payment failure must never destroy what someone wrote.**
 * Someone who has just typed out the hardest thing in their life and then hits
 * a card error must not lose it.
 *
 * It also means the homepage writing box and the /ask page share one draft, so
 * starting to write on the homepage and pressing "Get advice" carries the text
 * across rather than asking them to start again.
 *
 * Cleared only once a submission has actually been created.
 */

const DRAFT_KEY = 'afad:draft';

export function readDraft(): string {
  try {
    return window.localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    // Private browsing can throw. A lost draft is bad; a crashed page is worse.
    return '';
  }
}

export function writeDraft(text: string): void {
  try {
    if (text === '') {
      window.localStorage.removeItem(DRAFT_KEY);
    } else {
      window.localStorage.setItem(DRAFT_KEY, text);
    }
  } catch {
    // ignore — the draft simply will not survive a reload
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
