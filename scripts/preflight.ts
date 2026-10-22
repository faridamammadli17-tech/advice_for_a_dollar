import { readFileSync } from 'node:fs';
import { EMERGENCY_LINK } from '../src/content/crisis';

/**
 * Pre-build shippability check.
 *
 * Runs before every production build and refuses the ones that must not
 * happen. This is not lint — lint is about code quality. This is about the
 * handful of things that would cause real harm if they reached a visitor.
 *
 * Hard blockers: the emergency link, unfilled placeholder tokens, and the
 * homepage example switched on while still a placeholder. One warning.
 *
 * To build anyway (for testing a bundle locally), set:
 *
 *     ALLOW_PLACEHOLDER_CONTENT=1 npm run build
 *
 * The override exists so the guard never traps anyone, and it is an explicit
 * environment variable rather than a flag in a file so it cannot be switched
 * on and then forgotten about.
 */

const override = process.env.ALLOW_PLACEHOLDER_CONTENT === '1';
const blockers: string[] = [];
const warnings: string[] = [];

/* ---- HARD BLOCKER: the safety screen must carry a working emergency link ---- */

// The safety screen's one emergency resource is a link (src/content/crisis.ts).
// This gate exists so the site can never ship a safety screen that sends
// someone in crisis nowhere: the address must be a real https:// one, and the
// screen must actually render it as its link.
const url = typeof EMERGENCY_LINK?.url === 'string' ? EMERGENCY_LINK.url.trim() : '';
if (!/^https:\/\/[^\s/]+\.[^\s/]+/.test(url)) {
  blockers.push(
    'The safety screen has no working emergency link.\n' +
      `    src/content/crisis.ts exports EMERGENCY_LINK.url = ${JSON.stringify(url)},\n` +
      '    which is not an https:// address. Someone in crisis would be sent nowhere.\n' +
      '    Fix: set EMERGENCY_LINK.url to the real https:// address.',
  );
}

const safetyScreen = readFileSync('src/components/SafetyInterstitial.tsx', 'utf8');
if (!/href=\{EMERGENCY_LINK\.url\}/.test(safetyScreen)) {
  blockers.push(
    'The safety screen does not render the emergency link.\n' +
      '    src/components/SafetyInterstitial.tsx must carry href={EMERGENCY_LINK.url}\n' +
      '    on its link, so the address in crisis.ts is what visitors are given.',
  );
}

/* ---- WARNING: placeholder marketing copy ---- */

const copy = readFileSync('src/content/placeholder.ts', 'utf8');
if (/COPY_IS_PLACEHOLDER\s*=\s*true/.test(copy)) {
  warnings.push(
    'Site copy is still placeholder text (src/content/placeholder.ts).\n' +
      '    Not dangerous, just not yours yet.',
  );
}

/* ---- HARD BLOCKER: unfilled placeholder tokens in visible copy ---- */

const visibleCopy = readFileSync('src/content/placeholder.ts', 'utf8');

// Only tokens inside quoted strings — those are the ones that reach a visitor.
// `COPY_IS_PLACEHOLDER` is the flag that drives the dev banner, not copy.
const quoted = visibleCopy.match(/'[^']*'/g) ?? [];
const tokens = quoted
  .flatMap((literal) => literal.match(/[A-Z][A-Z_]*_PLACEHOLDER/g) ?? [])
  .filter((token) => token !== 'COPY_IS_PLACEHOLDER');

if (tokens.length > 0) {
  const unique = [...new Set(tokens)];
  blockers.push(
    `Copy still contains unfilled placeholder tokens: ${unique.join(', ')}.\n` +
      '    These would appear on the live site exactly as written.\n' +
      '    Fix: fill them in src/content/placeholder.ts.',
  );
}

/* ---- HARD BLOCKER: the homepage example switched on while still a placeholder ---- */

// The example slot is guarded by its own switch, `awaitingOwnerContent`. If
// that is flipped to false before the text is replaced, the home page would
// show "PLACEHOLDER — ..." under "From: Chiron", and the token check above
// would not notice because those strings carry no `_PLACEHOLDER` token.
const exampleBlock = copy.match(/example:\s*\{[\s\S]*?satisfies ExampleProblem/)?.[0] ?? '';
if (/awaitingOwnerContent:\s*false/.test(exampleBlock) && /PLACEHOLDER/.test(exampleBlock)) {
  blockers.push(
    'The homepage example is switched on but its text is still a placeholder.\n' +
      '    Visitors would see "PLACEHOLDER" signed "From: Chiron".\n' +
      '    Fix: replace example.problem and example.advice in src/content/placeholder.ts\n' +
      '    with the real exchange, or set awaitingOwnerContent back to true.',
  );
}

/* ---- report ---- */

for (const warning of warnings) {
  console.warn(`\n⚠️  ${warning}`);
}

if (blockers.length === 0) {
  console.log('\n✓ preflight: nothing blocking a production build.\n');
  process.exit(0);
}

console.error('\n✖ preflight: this build is not safe to ship.\n');
for (const blocker of blockers) {
  console.error(`  • ${blocker}\n`);
}

if (override) {
  console.warn(
    '  ALLOW_PLACEHOLDER_CONTENT=1 is set — continuing anyway.\n' +
      '  This bundle must not be deployed.\n',
  );
  process.exit(0);
}

console.error('  To build anyway for local testing:\n    ALLOW_PLACEHOLDER_CONTENT=1 npm run build\n');
process.exit(1);
