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

All five planned phases are built. **160 tests pass**; typecheck, lint and
build are clean.

| | |
| --- | --- |
| Front end | React + TypeScript + Vite |
| Server | Fastify |
| Database | SQLite via Node's built-in `node:sqlite` |
| Tests | 160 across 4 files, including 50 full-stack HTTP tests |

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

`src/lib/safety/` — 43 rules, 16 masks, 61 tests. A flagged submission stops
the flow, is never charged, and can never be published.

The check runs in `POST /api/submissions` regardless of what the client did.
The UI screens too, for a fast interstitial, but the client's verdict is never
trusted. Flagged rows exist only when Farida flags one by hand (text the
screener flags is never stored at all); they can still be answered through
the dashboard, because the rule is about payment and publication, not about
replying.

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
cannot leak a row. An exhaustive test walks all 192 state combinations (including whether an answer exists) and
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
rate-limited request — same body, same 1.2 s floor. The search is capped at 48 candidates inside a window of at most three months, all checked in parallel, so the time taken cannot say how many submissions a window holds. It returns a link only when
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
| Palette | Five brand colours. On the **home page, only those five and nothing white** (Farida, 2026-10-04): pale pink card, light green writing box, wine and dark green text (6.9:1 and 5.7:1 on both). Cream `#F2E6C9` stays on the inner pages. A wood/brown neutral was proposed and **rejected**. |
| Font | **VCR OSD Mono** everywhere except the safety screen and the dashboard, which keep system fonts on purpose. It lacks the em dash, en dash, middle dot and manat sign; those fall back to Courier New. The copy is never rewritten to avoid them. |
| Logo | The bunny's **portrait**, at its native 128px, in the header of every page and as the favicon. It is also the Instagram picture. |
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

**Behind a proxy or tunnel, set `TRUST_PROXY=loopback`.** The login and
recovery limits key on the visitor's address. Behind nginx, Caddy or a
Cloudflare tunnel every connection arrives from the proxy, so without this
every visitor shares one limit and eight wrong guesses by anyone lock the owner
out. Never set it to `true`: that trusts a header anyone can forge.

**Backups are `npm run backup`, not a file copy.** The database runs in
write-ahead-log mode, so while the server runs the newest submissions live in
`advice.db-wal`; copying `advice.db` alone produced an empty file. The command
takes a consistent snapshot through SQLite's own backup API, and a clean stop
(Ctrl-C) now folds the log back into the file.

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

**The home page draws its sprites with `<img>`, not `SpriteCanvas`.** Chiron's
portrait, the frog at his computer, the forest and its creatures are plain
images with `image-rendering: pixelated`, sized by a CSS variable `--px` that
is always a whole number (the portrait and the frog 1x, their native size;
the creatures move in art pixels, which are two of the delivered file's
pixels). `ForestScene.tsx` computes the smallest whole-number scale that
covers the viewport. The animations are CSS keyframes stepped with
`steps(1)`, moving by whole art pixels, so a sprite never lands between
pixels; they all stop under `prefers-reduced-motion`. Everything else on the
site still goes through `SpriteCanvas` and the shared loop.

**The frog and the creatures are the delivered art cut into layers, not
redrawn.** `npm run art:typist` splits the 128px frog into desk, body, head,
closed-eye head, arm and screen text (`src/pixel/assets/typist/`). Since
2026-10-06 only the screen text is animated: the frog holds still by the
owner's decision, so the body, head and arm layers never move and the
closed-eye head is not drawn (the cut layers are kept so the text can be
separated from the screen). `npm run art:creatures` finds the seven little black creatures on the
clean 480px copy (`forest_day.png`) and cuts them out of the DELIVERED file
(`originals/forest-scene-2x-jpeg.jpg`, 960x558) at its own pixel grid, into
`src/pixel/assets/creatures/`: each one as a sprite, a closed-eye frame, and
a patch of meadow for the hole it leaves. If the artist sends a new frog or a
new scene, run the script again rather than editing the layers by hand.

**The forest is Farida's file, untouched, and nothing may sit between it and
the screen.** (Her rule, 2026-10-06.) `ForestScene.tsx` draws the delivered
JPEG itself as the background; Vite copies it byte for byte (same checksum in
`dist/`). No CSS filter, opacity, blend mode, gradient or tinted layer may go
on `.forest` or `.forest-stage`, only whole-number scaling and pixelated
rendering. Each creature is drawn over its meadow patch at the exact spot it
was painted, so at rest the screen is the file to the pixel; the patch shows
only where a creature has stepped. Verified by drawing the served file into a
canvas (0 of 535,680 pixels differ from the file decoded outside the browser)
and by comparing a screenshot with the file (0 of 611,798 visible forest
pixels differ at 1440x900). The 480px copy is used only to find the creatures
and in the sprite inspector. The cost of serving the 2x file is that its
whole-number scales are 2 or 4 screen pixels per art pixel, never 3, so on a
1366x768 or 1280x800 laptop the scene is shown a step larger (and more
cropped on the right) than the 480px copy allowed. A 1x export from the
artist (480x279 PNG) would restore the 3x step and would be pixel-exact too.

**The header logo is 128px because nothing smaller is allowed.** Whole-number
scaling means the portrait cannot shrink to 64px without the artist exporting
one. On phones the written site name steps aside so the menu fits beside it.

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
                ForestScene, Bunny (Chiron's portrait) and TypingFrog
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
  make-typist-layers.py  the frog at his computer, cut into layers to animate
  cut-scene-creatures.py  the forest's creatures as sprites cut from the delivered file
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

4. ~~The forest background scene~~ **Delivered 2026-10-04.** The delivered
   file (`src/pixel/assets/originals/forest-scene-2x-jpeg.jpg`, 960x558) is
   what `ForestScene.tsx` draws full-bleed behind the home page, untouched.
   A 1x PNG export from the artist would allow a 3x step on laptops.
5. **Epoint / Payriff API documentation.** `server/providers/*.ts` throw
   deliberately rather than guessing. The callback signature scheme is the
   security-critical part — the callback route returns 501 rather than
   believing an unverified caller.

### Not built

6. **Email is written but not wired.** `server/email.ts` exists with a
   `ConsoleMailer` (logs) and `SmtpMailer`. It still needs connecting to two
   places: notify on answer, and deliver a recovered link to an inbox.
7. **Animation frames.** The bunny has her open frame plus a closed-eye
   frame drawn from it by `npm run art:blink`; the home page animates her
   with CSS (bob, blink, lantern sparkle). The frog has one delivered frame,
   which the home page animates as layers (breath, head, arm, blink, screen
   text); on /ask he is still that single frame. The envelope ceremony still
   runs on a DRAFT placeholder. The manifest declares the intended counts and
   the inspector honestly says how many have arrived.

---

## Tone

Farida values being told the truth about what is broken, including when the
breakage is the assistant's own. Several real bugs in this project were found
by deliberately trying to break things rather than by trusting that code
written carefully was therefore correct — a sprite cache that stored the wrong
theme, a silent failure that made a moderation button do nothing, a contrast
"fix" that made contrast worse.

Verify claims by measuring. Say plainly when something cannot be done, and why.
