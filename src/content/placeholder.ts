/**
 * ===========================================================================
 * OWNER-SUPPLIED COPY
 * ===========================================================================
 *
 * Every word on this site that Farida will want to write herself lives in this
 * one file. Replacing it is one file to edit, not a hunt through components.
 *
 * Anything marked PLACEHOLDER is mine, not hers, and is written to be
 * obviously provisional rather than plausibly final. Nothing here should ship.
 *
 * ---------------------------------------------------------------------------
 * THE ONE ABSOLUTE RULE
 * ---------------------------------------------------------------------------
 * There is no AI-generated advice anywhere in this product — not as a draft,
 * not as a fallback, not as a "suggested reply", and not as filler in the
 * archive or on the homepage.
 *
 * So the homepage example below is deliberately NOT a piece of advice. It is a
 * visible gap with a label on it. A convincing fake would be the exact thing
 * the spec forbids, and it would be worse than an empty slot, because an empty
 * slot cannot be mistaken for Farida's voice.
 */

/** Flips the dev-only "placeholder copy" banner. Set false when real copy lands. */
export const COPY_IS_PLACEHOLDER = true;

export type ExampleProblem = {
  readonly category: string;
  readonly problem: string;
  readonly advice: string;
  /** True while this is a labelled gap rather than a real exchange. */
  readonly awaitingOwnerContent: boolean;
};

export const copy = {
  siteName: 'Advice for a Dollar',

  /* ------------------------------------------------------------------ hero */
  hero: {
    // The home page's writing box carries one line above the writing area and
    // nothing else (Farida, 2026-10-06: the headline, the paragraph and the
    // "What is on your mind?" label were deleted by her, deliberately).
    writeLine: 'Write down the thing you have been carrying',
    writeHint: 'Try giving as much detail as possible',
    // The /ask page keeps its own label and placeholder.
    writePrompt: 'What is on your mind?',
    writePlaceholder: 'Start anywhere. It does not have to be tidy.',
    primaryCta: 'Get advice',
    secondaryCta: 'Read other people’s problems',
  },

  /* ------------------------------------------------------------- why 1 AZN */
  /*
   * Farida's words, 2026-09-21. Lightly corrected from her draft — grammar
   * and typos only, no change of meaning or voice. Her original, verbatim:
   *
   *   "I am something years old and I have in a high school, in university, i
   *    have been unemployed, employed, gaining good money, not gaining any
   *    money at all, rich, poor, - everything you can imagine, and something i
   *    would check when i download an app or anything - was the price first. I
   *    still do this. And I dont want this factor - price - should getting
   *    between us (? do i say us or me or my petname, we should decide on
   *    this), I think and firmly believe that people need to be seen , heard.
   *    The price here is symbolic - it is for the domain, and future
   *    possibilities of partnering with the pschologists to help people more."
   *
   * What changed: "I have in a high school" -> "I've been in high school";
   * "should getting between us" -> "to get between us"; "pschologists" ->
   * "psychologists"; sentence breaks for reading. Nothing else.
   *
   * HER QUESTION — "do i say us or me or my petname?"
   * "us" is right, and it does NOT conflict with the decision that it is "I",
   * not "we". Those are two different words doing two different jobs:
   *   - "WE are capable people and empaths"  = several advisers. Conflicts. Gone.
   *   - "price getting between US"           = you and me. One person, warm,
   *                                            and the whole point of the page.
   * So "us" stays.
   *
   * STILL NEEDED: her age, in place of AGE_PLACEHOLDER below. If she would
   * rather not give a number, the line works as "I've been in high school and
   * in university, I've been unemployed..." — the age adds warmth but is not
   * load-bearing.
   */
  whyADollar: {
    heading: 'Why one manat?',
    body: [
      'I’m AGE_PLACEHOLDER years old. I’ve been in high school, in university, unemployed, employed, earning good money, earning nothing at all — rich, poor, everything you can imagine.',
      'And one thing I would check when I downloaded an app, or anything at all, was the price. First. I still do this.',
      'I don’t want that factor — price — to get between us. I think, and firmly believe, that people need to be seen and heard.',
      'So the price here is symbolic. It is for the domain, and for the future possibility of partnering with psychologists, to help people more than I can on my own.',
    ],
    notTherapy:
      'This is not therapy and it is not professional psychological care. It is one person writing back to another.',
  },

  /* --------------------------------------------------------------- example */
  // The spec asks for one real problem and response on the homepage.
  // It must be a real exchange Farida has written or approved.
  example: {
    category: 'Awaiting a real example',
    problem:
      'PLACEHOLDER — a real problem, chosen by Farida, goes here. It will be one someone actually sent, published with their permission, or one she writes as a representative example.',
    advice:
      'PLACEHOLDER — Farida’s real reply goes here. Nothing is generated for this slot. The section stays visibly empty until she writes it.',
    awaitingOwnerContent: true,
  } satisfies ExampleProblem,

  /* ----------------------------------------------------------------- trust */
  trust: {
    heading: 'Who is actually reading this',
    // This sentence is specified verbatim in the brief. Do not reword it.
    oneHuman: 'All advice is written by one real human wearing different hats.',
    points: [
      {
        title: 'You stay anonymous',
        // PLACEHOLDER
        body: 'No account, no name, no email required. You get a private link instead of a login.',
      },
      {
        title: 'Nothing is public unless you ask',
        // PLACEHOLDER
        body: 'You choose private or public when you write. Public ones are read and approved before they appear anywhere.',
      },
      {
        title: 'No judgement, and no bots',
        // PLACEHOLDER
        body: 'Nothing here is written by a machine. If that matters to you, it matters here too.',
      },
    ],
  },

  /* ------------------------------------------------------------ final call */
  finalCta: {
    // PLACEHOLDER
    heading: 'Still carrying it around?',
    body: 'It takes a few minutes to write down and one manat to send.',
    button: 'Write your problem',
  },

  /* ------------------------------------------------------ the writing flow */
  ask: {
    privacyNudge:
      'Please don’t include real names, workplaces, or anything that identifies you or someone else. Change the details if you need to.',
    secretWordHeading: 'Choose a secret word',
    secretWordWhy:
      'If you ever lose your private link, this is how you prove the submission is yours. Pick something you will remember and nobody could guess.',
    visibilityHeading: 'Private, or shared with others?',
    visibilityWhy:
      'Both cost the same. Public problems are read and approved by Farida before they appear anywhere, and always without your name.',
    paymentHeading: 'Pay what you want',
    paymentWhy: 'One manat minimum. More if you want to and can.',
  },

  /* ------------------------------------------------------------ what next */
  responseTime: 'Normally within 24 hours, and up to about two days when it is busy.',

  footer: {
    // PLACEHOLDER
    tagline: 'One person, writing back.',
    // Honest: the site sets no tracking cookies, so the cookie policy says so.
    cookieNote: 'This site sets no tracking cookies.',
  },
} as const;
