/**
 * SAFETY RULESET
 *
 * The highest-priority functional requirement in the spec. When one of these
 * rules fires, the submission flow stops before payment, nothing is charged,
 * and the visitor sees crisis resources instead of a form.
 *
 * ---------------------------------------------------------------------------
 * HONEST LIMITATIONS — read before trusting this
 * ---------------------------------------------------------------------------
 * This is a keyword and phrase ruleset. It will miss things. It cannot read
 * tone, context, sarcasm, metaphor, or a language it has no rules for, and it
 * has no rules for Azerbaijani. Someone in real distress can write something
 * this file will not catch.
 *
 * It is a net, not a diagnosis. The real backstop is that **no submission is
 * ever published without human approval**, and a flagged record can never be
 * un-flagged into the public archive automatically.
 *
 * ---------------------------------------------------------------------------
 * HOW IT WORKS
 * ---------------------------------------------------------------------------
 * 1. The text is normalised: lowercased, apostrophes removed, punctuation
 *    turned into spaces. So "I don't want to" becomes "i dont want to".
 * 2. MASKS are applied first. These blank out phrases that contain alarming
 *    words but are not alarming — idioms like "dying of embarrassment", and
 *    explicit disclaimers like "I'm not suicidal". Masking removes the span
 *    entirely, so a rule cannot match inside it.
 * 3. RULES are then tested against the masked text. Weights accumulate per
 *    category; the highest-scoring category wins.
 * 4. A total of FLAG_THRESHOLD or more flags the submission.
 *
 * Masking rather than subtracting weight is deliberate: it removes the
 * specific misleading words instead of discounting the whole message, so
 * "I'm not suicidal, but I think about dying every day" still flags on the
 * second clause.
 */

export type SafetyCategory =
  | 'self_harm'
  | 'abuse_in_progress'
  | 'medical_emergency'
  | 'imminent_danger'
  | 'minor_safety';

export type SafetyRule = {
  readonly id: string;
  readonly category: SafetyCategory;
  /** Every pattern must match for the rule to fire. Most rules have one. */
  readonly patterns: readonly RegExp[];
  readonly weight: number;
  readonly note: string;
};

export type SafetyMask = {
  readonly id: string;
  readonly pattern: RegExp;
  readonly note: string;
};

/** Total weight at or above which a submission is flagged. */
export const FLAG_THRESHOLD = 1;

/* ===========================================================================
   MASKS — phrases that must NOT trigger a rule
   ===========================================================================
   Two kinds live here:
     - idioms: everyday hyperbole that borrows the vocabulary of harm
     - disclaimers: the visitor explicitly saying this is not about them
   =========================================================================== */

export const MASKS: readonly SafetyMask[] = [
  // ---- idioms of embarrassment, boredom and exhaustion ----
  {
    id: 'idiom.dying-of',
    pattern: /\bdying (?:of|from) (?:embarrassment|laughter|shame|boredom|hunger|thirst|curiosity|cringe)\b/g,
    note: 'The spec names "I am dying of embarrassment" as a must-not-flag.',
  },
  {
    id: 'idiom.die-of',
    pattern: /\b(?:die|died|want(?:ed)? to die) (?:of|from) (?:embarrassment|laughter|shame|boredom)\b/g,
    note: '"I could die of embarrassment."',
  },
  {
    id: 'idiom.dying-to',
    pattern: /\bdying to (?:know|see|hear|meet|try|go|get|find out|talk|tell|ask)\b/g,
    note: '"Dying to know what she said."',
  },
  {
    id: 'idiom.dying-laughing',
    pattern: /\b(?:dying laughing|dead laughing|kill(?:ing)? myself laughing|killed myself laughing)\b/g,
    note: 'Laughter idiom. "Killing myself laughing" is common and benign.',
  },
  {
    id: 'idiom.body-part-killing-me',
    pattern: /\b(?:my|the|this) (?:back|feet|foot|head|neck|legs?|shoulders?|knees?|eyes?|hands?|arms?|stomach|tooth|teeth) (?:is|are) killing me\b/g,
    note: 'Physical complaint. Deliberately narrow — only named body parts.',
  },
  {
    id: 'idiom.thing-killing-me',
    pattern: /\bthis (?:heat|weather|job|commute|traffic|homework|workload|hangover|cold|noise|diet|schedule) is killing me\b/g,
    note: 'Narrow list of inanimate subjects, so "he is killing me" is never masked.',
  },
  {
    id: 'idiom.kill-time',
    pattern: /\bkill(?:ing)? time\b/g,
    note: 'Waiting around.',
  },
  {
    id: 'idiom.could-kill-for',
    pattern: /\bcould (?:kill|murder) for (?:a|an|some)\b/g,
    note: '"I could murder a coffee."',
  },
  {
    id: 'idiom.dead-compound',
    pattern: /\b(?:dead tired|dead serious|dead end|deadlines?|dead weight|drop dead gorgeous|dead right|dead wrong)\b/g,
    note: 'Compound phrases where "dead" is an intensifier.',
  },
  {
    id: 'idiom.to-die-for',
    pattern: /\b(?:to die for|(?:would|id) die for|die trying)\b/g,
    note: 'Admiration and determination idioms.',
  },
  {
    id: 'idiom.killed-it',
    pattern: /\b(?:killed it|killing it|kills it)\b/g,
    note: 'Performed well.',
  },
  {
    id: 'idiom.to-death',
    // "scared to death OF MY husband" is not an intensifier; it is the fear
    // the abuse rule exists for, so that one form is left for it to see.
    pattern:
      /\b(?:bored to death|scared to death(?! of my\b)|sick to death of|worried to death|freezing to death)\b/g,
    note: 'Intensifier idioms.',
  },

  // ---- explicit disclaimers ----
  {
    id: 'disclaimer.not-suicidal',
    pattern: /\b(?:im |i am |shes |hes |theyre |i)?not suicidal\b/g,
    note: 'The visitor is explicitly saying this is not about suicide.',
  },
  {
    id: 'disclaimer.never-hurt-myself',
    pattern: /\b(?:would|will|could) never (?:hurt|harm|kill) myself\b/g,
    note: 'Explicit disclaimer.',
  },
  {
    id: 'disclaimer.no-intention',
    pattern: /\bno (?:intention|plans?) of (?:hurting|harming|killing) myself\b/g,
    note: 'Explicit disclaimer.',
  },
  {
    id: 'disclaimer.not-going-to',
    pattern: /\bim not going to (?:hurt|harm|kill) myself\b/g,
    note: 'Explicit disclaimer.',
  },
];

/* ===========================================================================
   RULES
   ===========================================================================
   Weight 1.0  — unambiguous on its own, flags immediately.
   Weight 0.5–0.8 — concerning but survivable alone; two of them flag together.
   =========================================================================== */

export const RULES: readonly SafetyRule[] = [
  /* ---------------------------------------------------------------- self harm */
  {
    id: 'self_harm.kill-myself',
    category: 'self_harm',
    patterns: [/\b(?:kill|killing|killed) myself\b/],
    weight: 1,
    note: 'Direct statement. The laughing idiom is masked before this runs.',
  },
  {
    id: 'self_harm.end-my-life',
    category: 'self_harm',
    patterns: [/\b(?:end|ending) my life\b/],
    weight: 1,
    note: 'Direct statement.',
  },
  {
    id: 'self_harm.own-life',
    category: 'self_harm',
    patterns: [/\btak(?:e|ing) my own life\b/],
    weight: 1,
    note: 'Direct statement.',
  },
  {
    id: 'self_harm.commit-suicide',
    category: 'self_harm',
    patterns: [/\bcommit(?:ting|ted)? suicide\b/],
    weight: 1,
    note: 'Direct statement.',
  },
  {
    id: 'self_harm.suicidal',
    category: 'self_harm',
    patterns: [/\bsuicidal\b/],
    weight: 1,
    note: 'Disclaimers are masked before this runs.',
  },
  {
    id: 'self_harm.suicide',
    category: 'self_harm',
    patterns: [/\bsuicide\b/],
    weight: 0.8,
    note: 'Slightly below threshold alone: may refer to someone else, which still warrants care.',
  },
  {
    id: 'self_harm.not-be-here',
    category: 'self_harm',
    patterns: [/\bdont want to be here (?:anymore|any more)\b/],
    weight: 1,
    note: 'The spec names this as a must-flag.',
  },
  {
    id: 'self_harm.not-want-alive',
    category: 'self_harm',
    patterns: [/\bdont want to (?:be alive|live|wake up)\b/],
    weight: 1,
    note: 'Direct statement.',
  },
  {
    id: 'self_harm.want-to-die',
    category: 'self_harm',
    patterns: [/\b(?:want|wanted) to die\b/],
    weight: 0.8,
    note: 'Deliberately below threshold alone: "I wanted to die when she read it out" is embarrassment, not crisis, and the idiom masks cannot catch every form of it. The emphatic forms in the next rule flag by themselves.',
  },
  {
    id: 'self_harm.want-to-die-emphatic',
    category: 'self_harm',
    patterns: [
      /\b(?:just|really|honestly|genuinely|truly) want to die\b|\bwant to die so (?:bad|badly|much)\b/,
    ],
    weight: 1,
    note: 'With an intensifier it is not hyperbole.',
  },
  {
    id: 'self_harm.wish-dead',
    category: 'self_harm',
    patterns: [/\bwish i (?:was|were|wasnt|werent) (?:dead|alive|here|born)\b/],
    weight: 1,
    note: 'Direct statement.',
  },
  {
    id: 'self_harm.better-off',
    category: 'self_harm',
    patterns: [/\bbetter off (?:dead|without me)\b/],
    weight: 1,
    note: 'Includes "everyone would be better off without me".',
  },
  {
    id: 'self_harm.hurt-myself',
    category: 'self_harm',
    patterns: [/\b(?:hurt|hurting|harm|harming) myself\b/],
    weight: 1,
    note: 'Disclaimers are masked before this runs.',
  },
  {
    id: 'self_harm.self-harm',
    category: 'self_harm',
    patterns: [/\bself harm(?:ing|ed)?\b/],
    weight: 1,
    note: 'Named directly.',
  },
  {
    id: 'self_harm.cutting',
    category: 'self_harm',
    patterns: [/\b(?:cut|cutting) myself\b/],
    weight: 1,
    note: 'Named directly.',
  },
  {
    id: 'self_harm.nothing-to-live-for',
    category: 'self_harm',
    patterns: [/\b(?:no reason to live|nothing to live for|no point (?:in )?living)\b/],
    weight: 1,
    note: 'Hopelessness stated plainly.',
  },
  {
    id: 'self_harm.end-it-all',
    category: 'self_harm',
    patterns: [/\bend it all\b/],
    weight: 1,
    note: 'Common euphemism.',
  },
  {
    id: 'self_harm.thinking-about',
    category: 'self_harm',
    patterns: [/\bthink(?:ing)? about (?:dying|death|suicide|ending it)\b/],
    weight: 0.6,
    note: 'Below threshold alone — this is also how grief sounds, and a grieving person must not be locked out of the service.',
  },
  {
    id: 'self_harm.thinking-about-persistently',
    category: 'self_harm',
    patterns: [
      /\bthink(?:ing)? about (?:dying|death|suicide|ending it)(?: \w+){0,3} (?:every day|all the time|constantly|a lot|nonstop)\b/,
    ],
    weight: 1,
    note: 'Frequency is what separates intrusive thoughts from grief. Stacks with the rule above.',
  },
  {
    id: 'self_harm.cant-go-on',
    category: 'self_harm',
    patterns: [/\bcant (?:go on|carry on|keep going)\b/],
    weight: 0.6,
    note: 'Often exhaustion rather than crisis, so it needs corroboration.',
  },
  {
    id: 'self_harm.pills',
    category: 'self_harm',
    patterns: [/\b(?:took too many|swallowed (?:all )?(?:the|my)) (?:pills|tablets)\b/],
    weight: 1,
    note: 'Also a medical emergency; self-harm takes precedence for resourcing.',
  },

  /* ------------------------------------------------------------ abuse in progress */
  {
    id: 'abuse.physical',
    category: 'abuse_in_progress',
    patterns: [
      /\b(?:he|she|they|my (?:husband|wife|boyfriend|girlfriend|partner|dad|father|mum|mom|mother|brother|stepdad)) (?:hits|hit|beats|beat|punches|punched|strangles|strangled|chokes|choked|slaps|slapped) me\b/,
    ],
    weight: 1,
    note: 'Present-tense physical violence.',
  },
  {
    id: 'abuse.beats-me-up',
    category: 'abuse_in_progress',
    patterns: [/\bbeats? me up\b/],
    weight: 1,
    note: 'Physical violence.',
  },
  {
    id: 'abuse.threat-to-kill',
    category: 'abuse_in_progress',
    patterns: [/\bthreaten(?:s|ed)? to kill me\b/],
    weight: 1,
    note: 'Explicit threat.',
  },
  {
    id: 'abuse.named',
    category: 'abuse_in_progress',
    patterns: [/\bdomestic (?:violence|abuse)\b/],
    weight: 1,
    note: 'Named directly.',
  },
  {
    id: 'abuse.confinement',
    category: 'abuse_in_progress',
    patterns: [/\b(?:wont let me leave|locks? me in|not allowed to leave|keeps me locked)\b/],
    weight: 1,
    note: 'Coercive control.',
  },
  {
    id: 'abuse.sexual',
    category: 'abuse_in_progress',
    patterns: [/\b(?:raped|raping|sexual assault|sexually assaulted|assaulted me|molested)\b/],
    weight: 1,
    note: 'Sexual violence.',
  },
  {
    id: 'abuse.afraid-of',
    category: 'abuse_in_progress',
    patterns: [
      /\b(?:afraid|scared|terrified)(?: to death)? of my (?:husband|wife|boyfriend|girlfriend|partner|father|dad|mother|mum|mom|brother|stepdad|stepfather)\b/,
    ],
    weight: 1,
    note: 'Fear of a household member.',
  },
  {
    id: 'abuse.fears-harm',
    category: 'abuse_in_progress',
    patterns: [/\bscared (?:he|she|they)(?:ll| will) (?:hurt|kill|find) me\b/],
    weight: 1,
    note: 'Anticipated violence.',
  },

  /* ----------------------------------------------------------- medical emergency */
  {
    id: 'medical.breathing',
    category: 'medical_emergency',
    patterns: [/\bcant breathe\b/],
    weight: 1,
    note: 'Airway emergency.',
  },
  {
    id: 'medical.bleeding',
    category: 'medical_emergency',
    patterns: [/\b(?:cant stop|wont stop) bleeding\b|\bbleeding (?:heavily|badly|a lot)\b/],
    weight: 1,
    note: 'Haemorrhage.',
  },
  {
    id: 'medical.cardiac',
    category: 'medical_emergency',
    patterns: [/\b(?:heart attack|having a stroke|chest pains?)\b/],
    weight: 1,
    note: 'Cardiac or stroke symptoms.',
  },
  {
    id: 'medical.unresponsive',
    category: 'medical_emergency',
    patterns: [/\b(?:unconscious|not waking up|wont wake up|passed out and)\b/],
    weight: 1,
    note: 'Someone is unresponsive.',
  },
  {
    id: 'medical.overdose',
    category: 'medical_emergency',
    patterns: [/\boverdos(?:e|ed|ing)\b/],
    weight: 1,
    note: 'Overdose.',
  },
  {
    id: 'medical.seizure',
    category: 'medical_emergency',
    patterns: [/\bseizures?\b/],
    weight: 0.6,
    note: 'May be describing a managed condition; needs corroboration.',
  },

  /* ------------------------------------------------------------ imminent danger */
  {
    id: 'danger.threat-to-others',
    category: 'imminent_danger',
    patterns: [/\b(?:going to|want to|gonna) (?:hurt|kill|attack) (?:him|her|them|someone|somebody|everyone)\b/],
    weight: 1,
    note: 'Threat towards another person.',
  },
  {
    id: 'danger.threat-from-others',
    category: 'imminent_danger',
    patterns: [/\b(?:he|she|they) (?:is |are |s )?going to kill me\b/],
    weight: 1,
    note: 'Threat from another person.',
  },
  {
    id: 'danger.in-danger',
    category: 'imminent_danger',
    patterns: [/\b(?:im in danger|in danger right now|my life is in danger|not safe (?:here|at home))\b/],
    weight: 1,
    note: 'Stated directly.',
  },
  {
    id: 'danger.weapon',
    category: 'imminent_danger',
    patterns: [/\bi have a (?:gun|knife|weapon|blade)\b/],
    weight: 0.8,
    note: 'Weapon present; combines with other signals.',
  },

  /* -------------------------------------------------------------- minor safety */
  {
    id: 'minor.self-identified-at-risk',
    category: 'minor_safety',
    // Both must be present: a stated age under 18, and a harm indicator.
    patterns: [
      /\bim (?:[89]|1[0-7])\b|\bim a (?:minor|child|kid)\b|\bim (?:[89]|1[0-7]) years old\b/,
      /\b(?:hurt|abus|beat|touch|hit|scared|unsafe|threat|forced)/,
    ],
    weight: 1,
    note: 'A stated minor age AND a harm indicator. Age alone never flags.',
  },
  {
    id: 'minor.child-harmed',
    category: 'minor_safety',
    patterns: [
      /\b(?:my )?(?:son|daughter|child|kid|stepson|stepdaughter) (?:is|was) being (?:hurt|abused|beaten|hit|touched)\b/,
    ],
    weight: 1,
    note: 'A child in the visitor\'s care is being harmed.',
  },
  {
    id: 'minor.child-abuse-named',
    category: 'minor_safety',
    patterns: [/\bchild (?:abuse|molestation)\b|\bgroom(?:ed|ing) me\b/],
    weight: 1,
    note: 'Named directly.',
  },
  {
    id: 'minor.adult-touched',
    category: 'minor_safety',
    patterns: [
      /\b(?:teacher|uncle|aunt|coach|stepdad|stepfather|stepmother|neighbour|neighbor|babysitter|cousin) touched me\b/,
    ],
    weight: 1,
    note: 'Inappropriate contact by a named adult role.',
  },
];
