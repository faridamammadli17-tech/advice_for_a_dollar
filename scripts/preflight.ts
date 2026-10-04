import { readFileSync } from 'node:fs';

/**
 * Pre-build shippability check.
 *
 * Runs before every production build and refuses the ones that must not
 * happen. This is not lint — lint is about code quality. This is about the
 * handful of things that would cause real harm if they reached a visitor.
 *
 * Currently one hard blocker, and one warning.
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

/* ---- HARD BLOCKER: fake emergency numbers ---- */

const crisis = readFileSync('src/content/crisis.ts', 'utf8');
if (/CRISIS_NUMBERS_ARE_PLACEHOLDERS\s*=\s*true/.test(crisis)) {
  blockers.push(
    'The crisis numbers on the safety screen are still placeholders.\n' +
      '    Someone in crisis could be shown a number that does not answer.\n' +
      '    Fix: put the real numbers in src/content/crisis.ts and set\n' +
      '    CRISIS_NUMBERS_ARE_PLACEHOLDERS = false.',
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
