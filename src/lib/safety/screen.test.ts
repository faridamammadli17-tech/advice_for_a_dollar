import { describe, expect, it } from 'vitest';
import { maskBenignPhrases, normalize, screen } from './screen';

/**
 * Safety screening tests.
 *
 * Both directions matter, and they pull against each other:
 *
 *   - A MISS means someone in crisis pays a pound and waits a day for a reply.
 *   - A FALSE ALARM means someone with an ordinary problem is shown a crisis
 *     page and locked out of the service entirely, because a flagged
 *     submission can never reach payment.
 *
 * So the false-positive block below is not padding. It is half the job.
 */

describe('normalize', () => {
  it('folds case, apostrophes and punctuation', () => {
    expect(normalize("I DON'T want to.")).toBe('i dont want to');
  });

  it('handles curly apostrophes the same as straight ones', () => {
    expect(normalize('I don’t know')).toBe(normalize("I don't know"));
  });

  it('collapses whitespace and trims', () => {
    expect(normalize('  too    many   spaces  ')).toBe('too many spaces');
  });
});

describe('maskBenignPhrases', () => {
  it('blanks an idiom without shifting the rest of the text', () => {
    const input = normalize('I am dying of embarrassment about it');
    const masked = maskBenignPhrases(input);
    expect(masked).toHaveLength(input.length);
    expect(masked).not.toContain('dying');
    expect(masked).toContain('about it');
  });

  it('does not mask a genuine statement that shares vocabulary', () => {
    const masked = maskBenignPhrases(normalize('he is killing me'));
    expect(masked).toContain('killing me');
  });
});

describe('screen — must NOT flag', () => {
  const ordinary = [
    // The spec names this one explicitly.
    "I'm dying of embarrassment",
    // Idioms that borrow the vocabulary of harm.
    'My back is killing me and I cannot sleep',
    'This commute is killing me',
    'I could murder a coffee right now',
    "I'm dying to know if he likes me",
    'I was killing myself laughing at her joke',
    'Her dress was to die for',
    'I have a deadline on Friday and I am dead tired',
    'I was bored to death at the wedding',
    'She killed it in the interview',
    'I need to kill time before my flight',
    // Explicit disclaimers.
    "I'm not suicidal, I just feel stuck in my job",
    'I would never hurt myself, I just needed to say it out loud',
    // Age alone is not a safety signal.
    "I'm 15 and I want to ask someone to the school dance",
    // Ordinary problems, which are the overwhelming majority.
    'My best friend forgot my birthday and I do not know how to bring it up',
    'I hate my job but I am scared to leave it',
    'My mother in law keeps criticising my cooking',
    'I think I am in love with my flatmate',
    // Tiredness is not crisis.
    'I am so tired of pretending everything is fine at work',
  ];

  it.each(ordinary)('leaves %j alone', (text) => {
    const result = screen(text);
    expect(result.flagged).toBe(false);
    expect(result.category).toBeNull();
  });

  it('treats empty and whitespace-only input as safe', () => {
    expect(screen('').flagged).toBe(false);
    expect(screen('    ').flagged).toBe(false);
  });
});

describe('screen — must flag', () => {
  const crisis: readonly [string, string][] = [
    // The spec names this one explicitly.
    ["I don't want to be here anymore", 'self_harm'],
    ['I have been thinking about killing myself', 'self_harm'],
    ['I want to end my life', 'self_harm'],
    ["I'm suicidal and I don't know who to tell", 'self_harm'],
    ["I don't want to be alive", 'self_harm'],
    ['Everyone would be better off without me', 'self_harm'],
    ['I have been cutting myself again', 'self_harm'],
    ['I have no reason to live', 'self_harm'],
    ['I took too many pills last night', 'self_harm'],
    ['My husband hits me', 'abuse_in_progress'],
    ['He threatens to kill me if I leave', 'abuse_in_progress'],
    ['I am afraid of my boyfriend', 'abuse_in_progress'],
    ['He will not let me leave the house', 'abuse_in_progress'],
    ['I cannot breathe', 'medical_emergency'],
    ['My mum is unconscious and will not wake up', 'medical_emergency'],
    ['I am going to hurt someone', 'imminent_danger'],
    ['My life is in danger', 'imminent_danger'],
  ];

  it.each(crisis)('flags %j as %s', (text, category) => {
    const result = screen(text);
    expect(result.flagged).toBe(true);
    expect(result.category).toBe(category);
    expect(result.confidence).toBeGreaterThanOrEqual(1);
  });

  it('flags a minor describing harm, whichever category wins', () => {
    const result = screen("I'm 14 and my stepdad hits me");
    expect(result.flagged).toBe(true);
    expect(['abuse_in_progress', 'minor_safety']).toContain(result.category);
  });

  it('flags a teacher touching a child', () => {
    const result = screen('My teacher touched me and I did not know what to do');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('minor_safety');
  });
});

describe('screen — masking does not create blind spots', () => {
  it('still flags a real disclosure that follows a disclaimer', () => {
    // The disclaimer is masked, but the clause after it stands on its own.
    const result = screen("I'm not suicidal, but I think about dying every day");
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
  });

  it('does not let an idiom hide a real statement in the same message', () => {
    const result = screen('My back is killing me. Honestly I want to end my life.');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
  });
});

describe('screen — weight accumulation', () => {
  it('does not flag a single sub-threshold signal', () => {
    const result = screen('I cannot go on like this');
    expect(result.flagged).toBe(false);
    expect(result.confidence).toBeLessThan(1);
    // It was noticed, just not acted on.
    expect(result.matchedRuleIds).toContain('self_harm.cant-go-on');
  });

  it('flags when two sub-threshold signals combine', () => {
    const result = screen('I cannot go on, I think about dying');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('self_harm');
  });

  it('does not flag a seizure mentioned on its own', () => {
    // Someone may simply be describing a managed condition.
    expect(screen('I have seizures and it affects my dating life').flagged).toBe(false);
  });

  it('flags a seizure alongside unresponsiveness', () => {
    const result = screen('He had a seizure and now he is unconscious');
    expect(result.flagged).toBe(true);
    expect(result.category).toBe('medical_emergency');
  });
});

describe('screen — contract', () => {
  it('is deterministic', () => {
    const text = 'I want to end my life';
    expect(screen(text)).toEqual(screen(text));
  });

  it('reports which rules fired, for the admin view', () => {
    const result = screen('I am suicidal');
    expect(result.matchedRuleIds).toContain('self_harm.suicidal');
  });

  it('never reports a category when not flagged', () => {
    const result = screen('I cannot go on like this');
    expect(result.category).toBeNull();
  });

  it('caps confidence at 1', () => {
    const result = screen(
      'I want to kill myself and end my life and I am suicidal and I have no reason to live',
    );
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('is not defeated by trailing punctuation or capitals', () => {
    expect(screen('I AM SUICIDAL!!!').flagged).toBe(true);
  });
});

describe('sentence breaks, invisible characters and look-alike letters', () => {
  it('does not let an idiom mask swallow a real statement in the sentence before it', () => {
    expect(
      screen('I want to kill myself. Laughing is something I do not do anymore.').flagged,
    ).toBe(true);
  });

  it('still masks the idiom inside one sentence', () => {
    expect(screen('I was killing myself laughing at the video she sent').flagged).toBe(false);
  });

  it('is not fooled by a soft hyphen or a zero-width joiner inside a word', () => {
    expect(screen('I have been sui\u00ADcidal all week').flagged).toBe(true);
    expect(screen('I am sui\u200Dcidal').flagged).toBe(true);
  });

  it('folds full-width letters to plain ones', () => {
    expect(screen('I am ｓｕｉｃｉｄａｌ').flagged).toBe(true);
  });

  it('flags "I just want to die" but not the embarrassed past tense', () => {
    expect(screen('I just want to die.').flagged).toBe(true);
    expect(screen('I wanted to die when she read my message out loud').flagged).toBe(false);
  });

  it('hears "scared to death of my husband" as fear, not as an idiom', () => {
    expect(screen("I'm scared to death of my husband.").flagged).toBe(true);
    expect(screen('I am scared to death about my exams next week').flagged).toBe(false);
  });
});
