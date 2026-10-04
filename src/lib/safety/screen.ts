import {
  FLAG_THRESHOLD,
  MASKS,
  RULES,
  type SafetyCategory,
  type SafetyRule,
} from './rules';

/**
 * Server-side safety screening.
 *
 * Runs BEFORE payment. A flagged submission stops the flow, charges nothing,
 * and can never be published — see `rules.ts` for what is detected and, just
 * as importantly, for an honest account of what this cannot do.
 *
 * This module is deliberately pure and synchronous: no network, no clock, no
 * randomness. The same text always produces the same verdict, which is what
 * makes it testable and what makes an audit of a flagged record meaningful.
 */

export type { SafetyCategory } from './rules';

export type SafetyResult = {
  readonly flagged: boolean;
  readonly category: SafetyCategory | null;
  /** 0..1. How strongly the ruleset responded, not a probability of crisis. */
  readonly confidence: number;
  /**
   * Which rules fired. For the admin view and for debugging a false positive.
   * Never shown to the visitor.
   */
  readonly matchedRuleIds: readonly string[];
};

const SAFE: SafetyResult = {
  flagged: false,
  category: null,
  confidence: 0,
  matchedRuleIds: [],
};

/**
 * Tie-break order. Immediate physical danger first, because when a message
 * carries two signals of equal weight, the more urgent resource is the right
 * one to put in front of someone.
 */
const CATEGORY_ORDER: readonly SafetyCategory[] = [
  'self_harm',
  'imminent_danger',
  'abuse_in_progress',
  'medical_emergency',
  'minor_safety',
];

/**
 * Lowercase, drop apostrophes, turn everything that is not a letter or digit
 * into a space, and collapse runs of spaces.
 *
 * Dropping apostrophes means a rule can be written once as `dont` and still
 * match "don't", "dont" and the curly-quoted "don’t".
 */
export function normalize(text: string): string {
  const folded = text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  // Collapse spelled-out forms onto their contracted spelling, so every rule
  // can be written once. Without this, "I cannot breathe" and "he will not let
  // me leave" slip past rules written as "cant" and "wont" — which is exactly
  // how a real disclosure gets missed, since plenty of people never contract.
  let expanded = folded;
  for (const [pattern, replacement] of CONTRACTIONS) {
    expanded = expanded.replace(pattern, replacement);
  }
  return expanded;
}

const CONTRACTIONS: readonly (readonly [RegExp, string])[] = [
  [/\bcan not\b/g, 'cant'],
  [/\bcannot\b/g, 'cant'],
  [/\bdo not\b/g, 'dont'],
  [/\bdoes not\b/g, 'doesnt'],
  [/\bdid not\b/g, 'didnt'],
  [/\bwill not\b/g, 'wont'],
  [/\bwould not\b/g, 'wouldnt'],
  [/\bis not\b/g, 'isnt'],
  [/\bare not\b/g, 'arent'],
  [/\bwas not\b/g, 'wasnt'],
  [/\bi am\b/g, 'im'],
];

/**
 * Blank out idioms and explicit disclaimers so no rule can match inside them.
 *
 * Replaced with spaces rather than removed, so that surrounding words do not
 * get glued together into something that matches by accident.
 */
export function maskBenignPhrases(normalized: string): string {
  let masked = normalized;
  for (const mask of MASKS) {
    // The patterns carry the global flag; reset lastIndex so a reused regex
    // cannot skip a match on a later call.
    mask.pattern.lastIndex = 0;
    masked = masked.replace(mask.pattern, (match) => ' '.repeat(match.length));
  }
  return masked;
}

function ruleMatches(rule: SafetyRule, text: string): boolean {
  // Every pattern must match. Most rules carry one; combination rules such as
  // "a stated minor age AND a harm indicator" carry two.
  return rule.patterns.every((pattern) => pattern.test(text));
}

/**
 * Screen a submission.
 *
 * @param text the visitor's problem, exactly as written
 */
export function screen(text: string): SafetyResult {
  if (typeof text !== 'string' || text.trim() === '') {
    return SAFE;
  }

  const masked = maskBenignPhrases(normalize(text));

  const scores = new Map<SafetyCategory, number>();
  const matchedRuleIds: string[] = [];

  for (const rule of RULES) {
    if (!ruleMatches(rule, masked)) continue;

    matchedRuleIds.push(rule.id);
    scores.set(rule.category, (scores.get(rule.category) ?? 0) + rule.weight);
  }

  if (matchedRuleIds.length === 0) {
    return SAFE;
  }

  // Highest-scoring category wins. Ties resolve by the order in CATEGORY_ORDER
  // so the verdict is deterministic rather than dependent on Map insertion.
  let topCategory: SafetyCategory | null = null;
  let topScore = 0;

  for (const category of CATEGORY_ORDER) {
    const score = scores.get(category) ?? 0;
    if (score > topScore) {
      topScore = score;
      topCategory = category;
    }
  }

  const flagged = topScore >= FLAG_THRESHOLD;

  return {
    flagged,
    category: flagged ? topCategory : null,
    confidence: Math.min(1, Math.round(topScore * 100) / 100),
    matchedRuleIds,
  };
}

/**
 * Narrow a category that arrived over the wire.
 *
 * The API returns `string | null`, and a string from the network is not a
 * union member just because the types line up in the editor. Anything
 * unrecognised becomes null, which the interstitial handles by showing its
 * most general wording — the safe direction to fail in.
 */
export function asSafetyCategory(value: string | null | undefined): SafetyCategory | null {
  const known: readonly SafetyCategory[] = [
    'self_harm',
    'imminent_danger',
    'abuse_in_progress',
    'medical_emergency',
    'minor_safety',
  ];
  return known.find((category) => category === value) ?? null;
}
