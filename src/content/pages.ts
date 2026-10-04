/**
 * Static page content.
 *
 * Separate from `placeholder.ts` because most of this is not Farida's voice to
 * supply — it is a factual description of what the system actually does.
 * Privacy in particular is written from the code, not from a template, and
 * must be corrected whenever the code changes.
 *
 * Anything still marked PLACEHOLDER is Farida's to write.
 */

export type Section = {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly bullets?: readonly string[];
};

export type StaticPage = {
  readonly slug: string;
  readonly title: string;
  readonly intro?: string;
  readonly sections: readonly Section[];
  /** True while this page is still waiting on Farida's own words. */
  readonly awaitingOwnerContent?: boolean;
};

/* ------------------------------------------------------------ how it works */

export const howItWorks: StaticPage = {
  slug: 'how-it-works',
  title: 'How it works',
  intro: 'Nine steps, and you are only responsible for the first five.',
  sections: [
    {
      heading: 'What you do',
      bullets: [
        'Write what is going on. It does not have to be tidy or well argued.',
        'Create your secret word, in case you lose your link.',
        'Choose whether it stays private or can be shared.',
        'Pay one manat, or more if you want to.',
        'Save the magic link you are given.',
      ],
    },
    {
      heading: 'What happens then',
      bullets: [
        'Farida reads it and writes back, normally within 24 hours and up to about two days when it is busy.',
        'You return through your link.',
        'You read your advice.',
        'If you need to, you send one follow-up — and Farida replies once more. That closes it.',
      ],
    },
    {
      heading: 'What this is not',
      paragraphs: [
        'It is not therapy, and it is not professional psychological care. It is one person reading what you wrote and answering honestly.',
        'If something is urgent or dangerous, this is the wrong kind of help. Please contact emergency services instead.',
      ],
    },
  ],
};

/* ------------------------------------------------------------------- about */

/**
 * About — Farida's words.
 *
 * Both conflicts flagged on 2026-09-21 are now RESOLVED by her:
 *   1. It is "I", not "we". One person answers.
 *   2. It is 1 AZN, not a dollar.
 *
 * The two sentences below are changed from her original draft accordingly,
 * and nothing else was touched:
 *   "the people responding are not doctors"  ->  "I am not a doctor"
 *   "We're simply ... capable people and empaths who are willing to listen,
 *    share our perspectives"                 ->  singular throughout
 *   "pay a dollar for me to read it"         ->  "pay 1 AZN for me to read it"
 */
export const about: StaticPage = {
  slug: 'about',
  title: 'About',
  sections: [
    {
      heading: 'What is “Advice for a Dollar”?',
      paragraphs: [
        'Advice for a Dollar is an initiative and website where you can write about whatever is on your mind and receive a response from a real human being.',
        'The idea came to me at 2 AM one night. It was rooted in those moments when, during difficult times, we’ve all wished we could pour our hearts out to a complete stranger — someone who doesn’t know us, has no preconceived opinions about our lives, and might still have something meaningful to say.',
        'This is not therapy, and I am not a doctor or a mental health professional. I’m simply, in my humble opinion, a capable person and an empath who is willing to listen, share my perspective, and hopefully make you feel a little more seen.',
        'Sometimes, you don’t need a professional. You just need someone to listen.',
      ],
    },
    {
      heading: 'How does it work?',
      paragraphs: [
        'You have a problem, a thought, a dilemma, or simply something you want to get off your chest — and you want to hear what a complete stranger thinks about it.',
        'You visit the website, write whatever you want to share, and pay 1 AZN for me to read it. Then, depending on the volume of submissions, you’ll receive a response within a day or two.',
      ],
    },
  ],
};

/* --------------------------------------------------------------------- faq */

export const faq: StaticPage = {
  slug: 'faq',
  title: 'Questions',
  sections: [
    {
      heading: 'Who answers?',
      paragraphs: [
        'Farida. One person, every time. Nothing here is written by a machine — not drafted by one, not suggested by one, not filled in by one.',
      ],
    },
    {
      heading: 'Why does it cost anything at all?',
      paragraphs: [
        'One manat is small enough not to be the reason someone stays quiet, and real enough that this is not a favour being asked of a stranger. You can pay more if you want to.',
      ],
    },
    {
      heading: 'Do I need an account?',
      paragraphs: [
        'No. There is no account, no password and no login. You get a private link instead, and a secret word in case you lose it.',
      ],
    },
    {
      heading: 'Will anyone see what I wrote?',
      paragraphs: [
        'Only if you asked for it to be shared, and only after Farida has read it and decided to publish it. Asking is not the same as it being published. Private submissions are seen by Farida and by you, and nobody else.',
      ],
    },
    {
      heading: 'Can I change my mind?',
      paragraphs: [
        'Yes. You can delete your submission at any time through your link. That destroys the text and the reply, and the link stops working.',
      ],
    },
    {
      heading: 'How long does a reply take?',
      paragraphs: [
        'Normally within 24 hours, and up to about two days when it is busy.',
      ],
    },
    {
      heading: 'Can I keep talking after the reply?',
      paragraphs: [
        'You can send one follow-up, and Farida replies once more. That is the whole exchange. It is not a chat, and that is deliberate — it keeps this something one person can actually sustain.',
      ],
    },
  ],
};

/* ----------------------------------------------------- community guidelines */

export const communityGuidelines: StaticPage = {
  slug: 'community-guidelines',
  title: 'What is not allowed here',
  intro:
    'Short version: write about your own life, and do not use this place to hurt anybody. The rest is detail.',
  sections: [
    {
      heading: 'Things that get a submission refused',
      bullets: [
        'Hate speech, or abuse directed at a person or a group.',
        'Harassment or threats of any kind.',
        'Naming or exposing another person — real names, workplaces, addresses, photographs, phone numbers.',
        'Instructions that would put someone in danger.',
        'Spam, advertising, or links posted to get traffic somewhere else.',
      ],
    },
    {
      heading: 'Using this to get at someone',
      paragraphs: [
        'This is not a place to build a case against another person, or to publish something about them that they cannot answer. If a submission is mostly about exposing somebody else, it will not be published.',
      ],
    },
    {
      heading: 'Changing details is fine',
      paragraphs: [
        'You are encouraged to change names and identifying details. It does not make the problem less real, and it protects both you and whoever else is in the story.',
      ],
    },
  ],
};

/* ----------------------------------------------------------------- privacy */

export const privacy: StaticPage = {
  slug: 'privacy',
  title: 'Privacy',
  intro:
    'This project collects as little as it can get away with. That is not the same as collecting nothing, and it would be dishonest to claim otherwise — so here is exactly what is kept.',
  sections: [
    {
      heading: 'What is stored',
      bullets: [
        'What you wrote, and the reply.',
        'Your private link token, which is what lets you back in.',
        'Verification data for your secret word — scrambled, never the word itself.',
        'The payment transaction record, including the amount.',
        'Timestamps, and whether a submission has been reviewed or published.',
        'Your email address, only if you chose to give one, and only for six months.',
      ],
    },
    {
      heading: 'What is never asked for',
      bullets: [
        'Your name.',
        'Your age, gender or country.',
        'A password or an account of any kind.',
      ],
    },
    {
      heading: 'Who can see your submission',
      paragraphs: [
        'A private submission is seen by Farida and by you, through your link. Nobody else.',
        'A public submission is seen by Farida first. It appears publicly only if she approves it, and always without your name.',
      ],
    },
    {
      heading: 'Email, and the six months',
      paragraphs: [
        'If you give an email address it is used for one thing: telling you your answer is ready. It is deleted six months after you submit.',
        'One consequence worth knowing: your email is also how you could recover a lost link. After those six months, that route is gone, and your secret word plus the date is what remains.',
      ],
    },
    {
      heading: 'Deleting',
      paragraphs: [
        'You can delete your submission at any time through your link. The text and the reply are destroyed. A record of the payment is kept, because refunds and accounting need it — it holds an amount and a date, not what you wrote.',
      ],
    },
    {
      heading: 'Cookies and tracking',
      paragraphs: [
        'This site sets no tracking cookies and runs no analytics that follow you. Your browser stores your theme preference and, while you are writing, a draft of your text — both stay on your own device.',
      ],
    },
  ],
};

/* ------------------------------------------------------------------- terms */

export const terms: StaticPage = {
  slug: 'terms',
  title: 'Terms',
  awaitingOwnerContent: true,
  intro:
    'PLACEHOLDER — this page needs a lawyer, not an engineer. What follows describes how the service actually behaves, so that whoever writes the real terms has something accurate to start from.',
  sections: [
    {
      heading: 'What the service is',
      paragraphs: [
        'One person reads what you send and writes a personal reply. It is not therapy, not medical advice, not legal or financial advice, and not professional psychological care.',
      ],
    },
    {
      heading: 'What you get',
      paragraphs: [
        'One written reply, normally within 24 hours and up to about two days. One follow-up from you, and one final reply.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        'A payment can be refunded from its transaction record. You do not need to give any contact details to receive one.',
      ],
    },
    {
      heading: 'Submissions that cannot be answered',
      paragraphs: [
        'A submission that raises an urgent safety concern is stopped before payment and is never published. Nothing is charged in that case.',
      ],
    },
  ],
};

export const STATIC_PAGES: readonly StaticPage[] = [
  howItWorks,
  about,
  faq,
  communityGuidelines,
  privacy,
  terms,
];
