# Advice for a Dollar — handoff

Everything a new session needs to pick this up. Written to be read first.

- **The code:** `~/Desktop/advice for a dollar new` (note: *Desktop* — it was
  moved there partway through, and an empty folder remains at `~/advice for a dollar new`)
- **In Git:** `faridamammadli17-tech/advice_for_a_dollar` on GitHub. The
  database `data/advice.db` is deliberately not committed.
- **Owner:** Farida, who is not an engineer. Explain in plain language.
- **Full decision log:** `NOTES.md` — long and chronological. This file is the
  distilled version; go to `NOTES.md` for the reasoning behind any single point.
- **Original brief:** `PROMPT.md` — the spec the project was built from. Parts
  of it have been superseded; where this file and `PROMPT.md` disagree, **this
  file wins** and the disagreements are listed below.

---

## What it is

A one-person advice service. Someone writes a problem anonymously, pays 1 AZN,
and Farida writes back personally. Approved problems can appear in a public
archive so other people feel less alone.

It should feel playful, pixel-art, warm, human. It must never feel clinical,
like a SaaS product, or like AI.

---

## State: working end to end

All five planned phases are built. **133 tests pass**; typecheck, lint and
build are clean.

| | |
| --- | --- |
| Front end | React + TypeScript + Vite |
| Server | Fastify |
| Database | SQLite via Node's built-in `node:sqlite` |
| Tests | 133 across 4 files, including 31 full-stack HTTP tests |

A visitor can: write, be safety-screened, choose a secret word, choose private
or public, pay (mock provider), watch the envelope ceremony, get a magic link,
read the reply, send one follow-up, delete, and recover a lost link.

Farida can: sign in at `/admin`, read submissions, write replies, publish or
decline, categorise, flag, and see analytics.

### Run it

Two terminals, from the project folder:

```bash
npm run server   # API + database, port 8787
npm run dev      # website, port 5173
```

Then http://localhost:5173. Admin at `/admin`. Full operating instructions are
in the README at the root of the repository.

---

## The rules that must not be broken

These are the spine of the product. Several are enforced in more than one
place on purpose.

### 1. No AI-generated advice. Anywhere.

Not as a draft, not as a fallback, not as a "suggested reply" in admin, not as
filler in the archive, not as a homepage example. Only Farida writes advice.

The homepage example is currently a **labelled empty slot** for this reason. A
convincing fake would be worse than a gap, because a gap cannot be mistaken for
her voice.

### 2. Safety screening runs server-side, before payment

`src/lib/safety/` — 42 rules, 16 masks, 55 tests. A flagged submission stops
the flow, is never charged, and can never be published.

The check runs in `POST /api/submissions` regardless of what the client did.
The UI screens too, for a fast interstitial, but the client's verdict is never
trusted.

The interstitial (`SafetyInterstitial.tsx`) deliberately breaks every other
style rule: no characters, no sprites, no animation, no playfulness. Plain type
and real numbers. **Do not make it match the rest of the site.**

### 3. The publication rule

A submission appears publicly **only** when the visitor asked for it **and**
Farida approved it **and** it is not flagged **and** it has an answer.

- `visibility` = what the visitor asked for
- `public_state` = what the owner granted

**Never query on `visibility` alone.** The rule is hard-coded in a SQL view
(`public_submissions` in `server/db.ts`), so a careless query in TypeScript
cannot leak a row. An exhaustive test walks all 48 state combinations and
asserts exactly one publishes.

### 4. Farida never edits submissions

Her explicit decision. What someone wrote is what appears, or it is not
published. **The dashboard has no field for editing submission text and must
never gain one.**

### 5. Secret words are hashed, never stored or shown

scrypt on the server. Never logged, never displayed publicly, never checked for
global uniqueness (a salted hash cannot be looked up).

### 6. Recovery never confirms a submission exists

`/recover` answers identically for a wrong word, an empty word, and a
rate-limited request — same body, same 700ms floor. It returns a link only when
two factors verify (secret word + date window, or secret word + email).

---

## Decisions Farida has made

| Question | Decision |
| --- | --- |
| Currency | **1 AZN**, not a dollar. Stored as minor units (qəpik). Copy must never say "$1". |
| Follow-up | Visitor sends **one**, Farida replies **once**, conversation closed. Not a chat. |
| Email | Optional. Used only for "your answer is ready". **Purged after 6 months.** |
| Editing problems | **Never.** See rule 4. |
| Admin auth | Simple password login, one owner. |
| Language | **English only** for now. No i18n scaffolding. |
| Characters | **Two** — frog (the one writing) and bunny (the one writing back). **There is no owl**, despite `PROMPT.md` §10. |
| Night mode | **Off for launch.** Disabled behind `FEATURES.nightMode`, not deleted. Comes back after launch. |
| Palette | Five brand colours **plus Cream `#F2E6C9`**. A wood/brown neutral was proposed and **rejected**. |
| Archive at launch | On, but shows an empty state until something is approved. |
| Deletion | Destroys body, answer and email; keeps a payment tombstone for refunds. |
| Artwork licensing | Settled — Farida's artist has given full permission. |

### Where this contradicts `PROMPT.md`

- §10 says three characters including an owl → **two, no owl**
- §14's `followUp` has no reply field → it needs `reply` and `repliedAt`
- The Postgres/Supabase recommendation → **SQLite**, see below
- argon2 → **scrypt**, see below

---

## Things that will waste your time if you do not know them

**Settings come from `.env`, and the server loads it itself.** `server/index.ts`
reads `.env` at start with Node's built-in `process.loadEnvFile`, before anything
looks at `process.env`. Until 2026-10-04 nothing loaded it, so the README's
admin-password instructions could not work. Do not remove that line.

**`node:sqlite` and Vite.** Vite's resolver strips the `node:` prefix and then
fails looking for a package called "sqlite". `server/db.ts` loads it through
`createRequire` to dodge static analysis. Do not "fix" this back to a plain
import.

**Why SQLite and not Postgres.** Deliberate reversal of the original plan. No
service to run, no native compilation, and a backup is "copy `data/advice.db`"
— which matters when a non-engineer operates it. The cost is single-writer and
no horizontal scaling, which is years away at this volume.

**Why scrypt and not argon2.** argon2 needs native compilation, which breaks on
OS upgrades and strands a non-engineer with a project that will not build.
scrypt is built into Node and memory-hard. "Very good and always works" beat
"slightly better and sometimes will not install".

**`npm run build` refuses to run.** By design. `scripts/preflight.ts` blocks a
production build while the crisis numbers are placeholders or copy contains
`*_PLACEHOLDER`. Override for local testing only:
`ALLOW_PLACEHOLDER_CONTENT=1 npm run build`.

**The home page draws its sprites with `<img>`, not `SpriteCanvas`.** The
standing bunny, her portrait and the forest are plain images with
`image-rendering: pixelated`, sized by a CSS variable `--px` that is always a
whole number (3 on wide screens, 2 below 1100px). `ForestScene.tsx` computes
the smallest whole-number scale that covers the viewport. The animations are
CSS keyframes stepped with `steps(1)`, so a sprite never lands between pixels;
they all stop under `prefers-reduced-motion`. Everything else on the site
still goes through `SpriteCanvas` and the shared loop.

**Sprites and pixel art.** Art is scaled by **whole numbers only**, never 1.5.
`SpriteCanvas` draws with `imageSmoothingEnabled = false` at integer scale.
There is one shared `requestAnimationFrame` loop for the entire page — do not
add another. It pauses when the tab is hidden.

**The theme must be stamped before React renders.** `applyTheme.ts` runs
synchronously in `main.tsx`. Doing it in an effect leaves one frame where
sprites cache the wrong theme's colours.

**Getting artwork intact is the recurring problem.** Four files have been lost
to it. JPEG destroys pixel art permanently; so does sending images as "photos"
in messaging apps, which resizes them. `npm run art:check` reports a file's
*real* format and whether it is usable. `npm run art:recover in.png out.png`
losslessly recovers art that arrived as a clean whole-number enlargement — this
is how the frog was saved.

---

## Layout

```
src/
  content/      every word on the site
                  placeholder.ts  — marketing copy, has AGE_PLACEHOLDER
                  pages.ts        — About, FAQ, Privacy, guidelines, terms
                  crisis.ts       — the emergency numbers (placeholders)
  lib/
    safety/     screening rules + 55 tests
    api/        typed client for the server
    submissions/ draft (localStorage), secret word, types
    payments/   mock provider
  pixel/        sprite engine — assets.ts is the manifest, assets/ holds art
  pages/        one file per route
  components/   layout, WritingPad, SafetyInterstitial, EnvelopeCeremony,
                ForestScene and Bunny (the home page's scene and character)
server/
  db.ts         schema + the public_submissions view (the publication rule)
  app.ts        every route
  repo.ts       every database operation
  auth.ts       admin sessions + rate limiting
  payments.ts   payment records, amount verification
  providers/    Epoint and Payriff — deliberately unimplemented
  email.ts      mailer (written, not yet wired into routes)
scripts/
  preflight.ts  the pre-build safety gate
  check-art.ts  artwork inspector
  downscale-art.py  lossless pixel-art recovery
  recover-from-jpeg.py  next-best recovery when the enlargement was a JPEG
  make-blink-frames.py  closed-eye frames for the bunny's blink
data/advice.db  the database — this is the thing to back up (not in Git)
docs/           this file, NOTES.md, PROMPT.md, ART_GUIDELINES.md, screenshots/
.github/        the checks GitHub runs on every pull request
```

---

## Outstanding

### Waiting on Farida

1. **Real crisis numbers** for `src/content/crisis.ts`, with labels. Currently
   obvious fakes (`000 000 00 00`) that are struck through, not clickable, and
   carry a warning in every build. **This blocks the production build.**
2. **Her age**, for "I'm AGE_PLACEHOLDER years old" in the Why-one-manat copy.
   Also blocks the build. If she prefers not to say, the line works without it.
3. **A real problem-and-reply** for the homepage example.

### Waiting on others

4. ~~The forest background scene~~ **Delivered 2026-10-04.** It is
   `src/pixel/assets/forest_day.png` (480x279, recovered from a 2x JPEG) and
   `ForestScene.tsx` draws it full-bleed behind the home page.
5. **Epoint / Payriff API documentation.** `server/providers/*.ts` throw
   deliberately rather than guessing. The callback signature scheme is the
   security-critical part — the callback route returns 501 rather than
   believing an unverified caller.

### Not built

6. **Email is written but not wired.** `server/email.ts` exists with a
   `ConsoleMailer` (logs) and `SmtpMailer`. It still needs connecting to two
   places: notify on answer, and deliver a recovered link to an inbox.
7. **Animation frames.** The frog has one frame. The bunny has her open
   frame plus a closed-eye frame drawn from it by `npm run art:blink`; the
   home page animates her with CSS (bob, blink, lantern sparkle). The
   envelope ceremony still runs on a DRAFT placeholder. The manifest declares
   the intended counts and the inspector honestly says how many have arrived.

---

## Tone

Farida values being told the truth about what is broken, including when the
breakage is the assistant's own. Several real bugs in this project were found
by deliberately trying to break things rather than by trusting that code
written carefully was therefore correct — a sprite cache that stored the wrong
theme, a silent failure that made a moderation button do nothing, a contrast
"fix" that made contrast worse.

Verify claims by measuring. Say plainly when something cannot be done, and why.
