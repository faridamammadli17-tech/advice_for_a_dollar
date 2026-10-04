/**
 * Categories, modelled as data so more can be added without a refactor.
 *
 * Owner-assigned only. A visitor never picks a category — the spec keeps that
 * with Farida, because a category is a moderation decision as much as a label.
 */

export type Category = {
  readonly id: string;
  readonly label: string;
};

export const CATEGORIES: readonly Category[] = [
  { id: 'relationships', label: 'Relationships' },
  { id: 'family', label: 'Family' },
  { id: 'career', label: 'Career' },
  { id: 'education', label: 'Education' },
  { id: 'money', label: 'Money' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'life', label: 'Life' },
  { id: 'other', label: 'Other' },
];

export const ALL_CATEGORY_ID = 'all';

export function categoryLabel(id: string | null): string {
  if (id === null) return 'Uncategorised';
  return CATEGORIES.find((category) => category.id === id)?.label ?? 'Uncategorised';
}

export function isKnownCategory(id: string): boolean {
  return CATEGORIES.some((category) => category.id === id);
}

/**
 * Sorting. Newest and oldest only.
 *
 * No popularity, no voting, no view counts — deliberately. The point of the
 * archive is "you are not the only person going through this", and a ranking
 * turns other people's worst days into a leaderboard.
 */
export type SortOrder = 'newest' | 'oldest';

export const SORT_OPTIONS: readonly { id: SortOrder; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
];
