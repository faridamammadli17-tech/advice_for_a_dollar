# NOTES — Advice for a Dollar

Running log of decisions, assumptions, and things deferred. Updated as the build progresses.

Status: **Phases 1–4 complete.** Front end, backend, admin dashboard, all wired.
Phase 5 (real payments, hardening) not started.

---

## Decisions made by Farida — 2026-09-20

### Q1 · Currency — DECIDED
Price is **1 AZN**, displayed and charged in AZN. Not USD, not converted. "For now."

Implications for the build:
- Suggested amounts become **1 / 3 / 5 AZN** plus a custom field (not $1/$3/$5).
- `amountPaidCents` in the data model is a misleading name for AZN. Will store **minor currency units (qəpik)** and rename the field `amountMinorUnits`, with `currency: 'AZN'` stored alongside it, so a later switch to USD doesn't require a migration.
- **Flagged for Farida:** the product is named *Advice for a Dollar* but the price is 1 AZN. That's a deliberate choice she's made for now — noting it only so the copy never says "$1" anywhere while the charge is 1 AZN. Copy will say "1 AZN" or "1 manat".

### Q3 · Follow-up — DECIDED
One-way in the sense that it is **not an open chat**. The exchange is closed-ended:

> problem → Farida's answer → visitor's **one** follow-up → Farida's **one** final reply → done.

Implications for the build:
- Data model change required. PROMPT.md Section 14 has:
  ```ts
  followUp: { body: string; createdAt: string } | null;
  ```
  This needs to become:
  ```ts
  followUp: {
    body: string;
    createdAt: string;
    reply: string | null;      // Farida's single final reply
    repliedAt: string | null;
  } | null;
  ```
- The answer page needs two more states: **follow-up sent, awaiting final reply** and **final reply received / conversation closed**.
- After the final reply the UI must make clear the exchange is complete, warmly — and offer: submit another problem, browse, say thanks.

### Q4 · Email — DECIDED
Optional email **is** collected, for the "your answer is ready" reminder. **Retention: 6 months**, then deleted.

Implications for the build:
- Email is optional at submission, never required.
- A scheduled job purges `email` (sets it null) 6 months after `createdAt`. Must be a real job, not a promise in the privacy page.
- Privacy page states the 6-month retention honestly and plainly.
- Email doubles as the second factor for magic-link recovery (see below) — but only for visitors who gave one, and only within the 6-month window. After purge, that recovery route is gone for that submission. **This needs to be said out loud on the confirmation page**, since it's a real consequence for the visitor.

### Q10 · Crisis resources — PARTIALLY DECIDED
For now the safety interstitial lists **102** and **112** only. Farida will supply the final list.

- I will **not invent** any additional numbers, hotline names, organisation names, or URLs.
- These two will render with minimal, neutral labelling until Farida confirms exactly how each should be described. I believe 112 is Azerbaijan's unified emergency number and 102 is police — **but the safety screen must not carry a label I guessed**, so the wording needs her confirmation before this screen ships.
- Marked in code as `TODO(crisis-resources)` in one single place so the final list is a one-file change.

### Admin authentication — DECIDED
**Simple password login.** Single owner account, password hashed with argon2, session cookie (httpOnly, secure, sameSite=strict), rate-limited login. No admin route reachable or data-leaking without it.

### Artist guidelines — DECIDED
Build them. → delivered as `ART_GUIDELINES.md` (and a shareable web version).

### Q12 · Language — DECIDED
**English only, for now.**

Implications for the build:
- No i18n library, no translation scaffolding, no locale routing in any phase
  until this changes.
- But do not hardcode English into places that would be expensive to unpick:
  copy stays in components rather than being baked into sprite art or image
  files, so adding Azerbaijani later is a content job, not a redesign.
- Layout keeps a little slack in buttons and labels rather than being pixel-fit
  to English string lengths — Azerbaijani runs longer, and "for now" suggests
  this may come back.

### Palette neutrals — PARTIALLY DECIDED
**Cream `#F2E6C9` approved** as the sixth colour: paper, the letter, the
envelope, mushroom spots and stems. Same 2-shade allowance as the other five,
so the working ceiling is 6 colours x 2 shades + 1 outline = 19.

**Bark `#7A5236` was NOT approved.** Wood, the desk, the retro computer, the
keyboard, branches and the log must therefore be built from the six approved
colours; Plum with Cream highlights is the closest available warm wood.

Consequence worth tracking: props will sit noticeably further from the
reference artwork's browns than the characters will. That is a legitimate
stylistic choice rather than a fault, but if the artist finds it fights the
props, it is worth revisiting rather than forcing.

Applied in: `src/styles/theme.css` (`--c-bark` removed, with a comment so it is
not reintroduced by accident), `ART_GUIDELINES.md`, the shared web brief, and
`src/pixel/sprites/testcard.ts` — the test card ramp now carries all six
colours, so Cream is covered by the automated colour check.

---

## Decisions I proposed, awaiting confirmation

1. **Backend:** Node/TypeScript (Fastify) + Postgres via Supabase, EU region (Frankfurt), deployed on Fly.io or Railway. Closest low-latency mainstream region to Azerbaijan, reliable webhook endpoint for Epoint/Payriff, readable data view for a non-engineer owner, cheap at low volume.

2. **Secret word uniqueness vs. hashing (Section 5):** Do **not** enforce global uniqueness — a salted hash can't be looked up, and forcing it would mean storing something weaker. Instead scope the secret word to one submission and require a second factor for recovery:
   - Gave an email → recovery by **email + secret word**, link delivered to that inbox. (Only works within the 6-month email retention window.)
   - No email → recovery by **secret word + approximate submission date**; the server narrows candidates by date and checks the hash only within that bounded set.
   - Either way: uniform response text, uniform timing, never confirms or denies that a submission exists. Rate-limited per IP and per secret word.

3. **Archive/moderation enforcement:** All public reads go through one function, `getPublicSubmissions()`, requiring `visibility = 'public' AND publicState = 'approved' AND NOT safetyFlag.flagged`. Backed by a **database view that hard-codes the same condition**, so an application bug alone cannot leak a private, unreviewed, or flagged row. Required test: seed a private-but-approved row and a public-but-unreviewed row, assert neither appears in any archive query.

*(The palette-extension proposal that sat here has been decided — see "Palette
neutrals" above: Cream approved, Bark not.)*

---

## Still open — need Farida

From PROMPT.md Section 21:

- **Q2** Secret word — my proposal above is unconfirmed.
- **Q5** Nicknames — should the `nickname` field exist at all, or always be null? (Spec says anonymous only. Recommend: drop the field.)
- **Q6** Helpful / Not helpful / Pet the bunny — implement or defer? (Recommend: defer; pet-the-bunny as pure client-side delight with nothing stored.)
- **Q7** Archive at launch — on from day one, or feature-flagged off until there's enough approved content? (Recommend: flagged off, on when ~15 approved problems exist.)
- **Q8** Editing public problems — may Farida lightly edit before publishing? Is the submitter told?
- **Q9** Deletion semantics — does a deleted published problem vanish from the archive? Are payment records retained?
- **Q11** Minimum age — is there a floor, and how is it communicated?
- **Q13** Volume overflow — a way to pause new submissions or show a longer expected response time?

---

## Deferred (per spec)

- Public archive may ship behind a feature flag.
- Helpful / Not helpful / Pet the bunny — no backend behaviour until approved.
- Visitor accounts of any kind — not building.

---

## Phase 1 — Foundation & visual system

Status: **COMPLETE.** Node v24.21.0 / npm 11.19.0 installed 2026-09-20.

### Acceptance gate — all passing

| Criterion | Result |
| --- | --- |
| `npm run typecheck` | **PASS**, exit 0, zero errors |
| `npm run lint` | **PASS**, exit 0, zero errors and zero warnings |
| `npm run build` | **PASS** — 50 modules, 176 kB JS / 2.34 kB CSS (57 kB / 1 kB gzipped) |
| Sprite validation | **20/20 sprites pass** in the live inspector |
| Renderer checks | 12/12 (`verify/renderer-check.html`) |
| Loop + timing checks | 14/14 (`verify/loop-check.html`) |
| Screenshots at 1440 / 390 | Both captured, day and night |
| No horizontal overflow at 390px | Confirmed — wide ladders scroll inside their own containers |
| Console errors or warnings | None |
| One shared animation loop | **72 subscribers, one rAF chain** — measured live |
| Reduced motion | Honoured; sprites pin to frame 0 |
| Dev-only route absent from production | Confirmed by grepping the built bundles |

The earlier self-audit paid off: **typecheck passed first time**, because the
genuine `frameIndex` narrowing error had already been found and fixed by reading.

### Things found and fixed once the toolchain existed

1. **Dev-only CSS was shipping to visitors.** Rollup tree-shook the inspector
   *component* out of the JS bundle, but `import './DevSprites.css'` is a side
   effect, so the inspector's stylesheet was being bundled into the CSS every
   visitor downloads. Fixed by loading the route through `lazy()` behind a DEV
   check — **CSS fell from 8.43 kB to 2.34 kB**, and the built bundles now
   contain zero inspector markers.
2. **Two React Router warnings** (`v7_startTransition`, `v7_relativeSplatPath`).
   Opted into both future flags — silences them and avoids a surprise at v7.
3. **Port 5173 was occupied by an unrelated Vite server that had been running
   for 34 days**, orphaned to PID 1. Left it alone rather than killing someone
   else's process; the dev server now honours a `PORT` from the environment and
   `.claude/launch.json` sets `autoPort`.

### One thing that looked like a bug and was not

The inspector showed **"shared loop: idle" alongside 72 subscribers**, and 54
animated canvases were frozen. That looked like a serious defect. Instrumenting
the module (`window.__spriteLoop`, DEV-only) showed `document.hidden === true`:
the automation browser pane renders offscreen, so the document genuinely *was*
hidden, and the loop was correctly refusing to burn cycles on it — which is the
battery behaviour the design exists to provide. Fronting the pane flipped the
status to **running**, and the loop's frame handle advanced 6 → 16 across a
single real paint.

Worth recording because the instinct was to "fix" correct code. The display was
honest; the environment was the unusual part.

### What WAS verified, and how

Node was not needed to check the hardest and most visual part. `verify/renderer-check.html`
loads the **real** `src/styles/theme.css` and runs a JavaScript port of the
**real** rendering logic from `src/pixel/`, then asserts against it. Serve and
open it with:

```
python3 -m http.server 8777
# then open http://localhost:8777/verify/renderer-check.html
```

Verified:

- **12/12 checks pass**, including sprite validation for the test card and for
  DRAFT placeholders at 16x16, 64x64, 96x80 and 480x270.
- **Integer scaling is exact.** Reading back the pixels of the test card at x4
  on a DPR-2 screen: 16,384 subpixels checked, **0 non-uniform** — every source
  pixel became a perfectly uniform 8x8 block. The canvas contains exactly
  **7 distinct colours** (transparent + the 5 brand colours + ink) and zero
  blended values, which is proof that nothing is being anti-aliased.
- **Both themes resolve**, and differently: day ink `#1e2c1b`, night ink `#e9eedc`.
  All 18 semantic tokens and all 5 brand colours resolve in both.
- **System dark with no `data-theme` stamp works** — the un-stamped state that
  most visitors are actually in.
- **Nested theme forcing works**: `data-theme="day"` panels stayed light inside a
  dark page. The inspector's side-by-side day/night view depends on this.
- **390px holds** with no horizontal overflow. No console errors or warnings.

A second harness, `verify/loop-check.html`, covers the shared animation loop and
frame timing — **14/14 pass**:

- **One shared loop, proven by counting.** With 1 subscriber the loop made 13
  `requestAnimationFrame` calls over 12 frames; with **5 subscribers it made the
  same 13**. Five independent loops would have made ~65. All five subscribers
  ticked an identical number of times (12 each).
- **No drift.** 6fps driven by one second of 60fps ticks lands on exactly frame 6.
  The remainder is carried between ticks rather than discarded.
- **A non-looping animation holds its last frame** (the 26-frame envelope, given
  100 seconds, sits on frame 25 — it does not wrap).
- **Degenerate input is survived**: a single-frame animation never moves, and an
  fps of 0 returns frame 0 instead of dividing by zero.
- **Delta is clamped**: a 10-minute hidden-tab gap reports 100ms, not 600,000ms,
  so returning to a tab cannot fast-forward an animation through hundreds of frames.
- **A subscriber can remove itself mid-tick** without disturbing the iteration.
- The loop stops when the last subscriber leaves.

Both harnesses remain useful as fast regression checks independent of the app.
themselves, StrictMode double-invocation, routing.

### Self-audit fixes (no compiler available)

Re-reading the code found a genuine type error and several smaller faults:

1. **Real type error in `SpriteCanvas`.** `frameIndex` is `number | undefined`,
   and the code tested a hoisted boolean (`isPinned`) before using it.
   TypeScript does not narrow a value through a separate boolean, so
   `Math.max(frameIndex, 0)` would not have compiled. Now narrowed inline.
2. **Extracted `src/pixel/frameCache.ts`.** `SpriteCanvas.tsx` was exporting both
   a component and a function, which breaks React Fast Refresh. The component
   file now exports only the component.
3. **Extracted `src/pixel/timing.ts`.** Frame advance is now a pure function —
   better separated, and testable without a DOM, which is what made the timing
   checks above possible.
4. **Stable empty-frames constant.** `frames` fell back to a fresh `[]` each
   render, which would have given `draw` a new identity every render and
   restarted the animation continuously whenever an animation id was missing.
5. **Removed a changing `key`** on the inspector's stats panel, which was
   remounting the DOM twice a second instead of just re-rendering.
6. Fixed a garbled comment in `global.css`.

### A real bug the verification caught

The first run rendered every sprite **magenta**. That was the deliberate
"token failed to resolve" fallback firing correctly — the harness was painting
each canvas *before* attaching it to the DOM, and custom properties resolve to
nothing on a detached element.

The harness ordering was the immediate fault, but it exposed a genuine one in
`src/pixel/palette.ts`: the resolver **cached** the unresolved result. A single
early or detached render would have poisoned the cache with magenta for the
rest of the session. Fixed — unresolved palettes are now returned but never
cached, and they warn in development. Worth remembering as the class of bug
that a "looks fine to me" review does not catch.

### Phase 1 decisions

1. **No hand-drawn character art.** Rule 8 of the spec forbids placeholder
   character art. So `frog`, `bunny`, `owl`, `typist`, `envelope`, the icons and
   the backgrounds are all **DRAFT colour blocks at exact final dimensions**,
   generated from the manifest — hatched, with pips counting the frame so
   animation timing can be checked before any art exists.
2. **One exception: the test card** (`src/pixel/sprites/testcard.ts`). It is a
   diagnostic instrument, not artwork — a 1px checkerboard, 1px rules on both
   axes, and a five-colour ramp. It is the only thing in the codebase that can
   prove the renderer is honest before real art arrives.
3. **`assets.ts` is the single manifest.** Nothing else hardcodes a sprite
   dimension. Swapping a draft for delivered art is a one-line `src` change.
4. **Site-wide `no-referrer`**, not just on token pages. Strictly more private
   and removes the risk of a future page forgetting.
5. **`/dev/sprites` does not exist in a production build** — the route is
   registered only under `import.meta.env.DEV`, rather than being hidden behind
   a condition inside the page.
6. **`noUncheckedIndexedAccess` is on.** Stricter than default, and right for
   code that indexes character grids constantly.
7. **`/` is a foundation status page, not the homepage.** Phase 1 explicitly
   does not build the product.

### Carried into Phase 2

- Wire `typist` to the textarea: ease into `typing`, return to `idle` ~700ms
  after the visitor stops.
- The envelope ceremony must never block or delay the real submission result.
- `safetyFlag` screening runs server-side **before** payment, and the safety
  interstitial has no character voice, no mascots, no animation.

---

## Assumptions log

- **Phase 1:** the palette is six fixed colours — the five brand colours plus
  Cream. `--c-cream` is live in `theme.css` and exercised by the test card.
  No brown exists in the system by decision; if wood starts fighting the
  artist, that is the thing to revisit.
- Otherwise nothing assumed silently. Every judgement call is written above and
  marked as needing confirmation.

---

## Phase 2 — Homepage & visitor experience

Status: **in progress.** Safety screening and the homepage are done; the
submission flow and the answer page are next.

### Done

- **Safety screening** (`src/lib/safety/`) — 42 rules across the five categories
  the spec names, 16 masks for idioms and disclaimers, **55 passing tests**
  covering both true positives and false positives.
- **Money** (`src/lib/money.ts`) — AZN in minor units (qəpik), never floats.
  Suggested amounts 1 / 3 / 5 AZN.
- **Feature flags** (`src/config/features.ts`) — the archive and the static
  pages are off, so nothing links to a page that does not exist yet.
- **Copy in one file** (`src/content/placeholder.ts`) with a loud dev banner.
- **Site furniture** — header, footer, page shell, theme toggle.
- **The writing experience** — textarea with a real label, the typist easing
  between typing and idle at the spec's 700ms, draft saved on every keystroke.
- **Homepage** — hero, why one manat, the example slot, trust, final call.

### Decisions

1. **The homepage example is a labelled empty slot, not invented text.** The
   spec forbids AI-generated advice as filler, and a convincing fake would be
   worse than a gap — a gap cannot be mistaken for Farida's voice.
2. **The ambient world is a bounded stage, not a full-bleed background.** The
   background asset is still a DRAFT hatched block; stretching it across the
   homepage would bury every other element. `AmbientWorld` becomes the
   full-bleed scene the moment `ASSETS.background_day.src` is real.
3. **Sprite scale drops to 1x below 720px.** A canvas is sized in device
   pixels, so CSS cannot shrink it — hence `useMediaQuery`. Whole numbers only.
4. **Draft text is persisted from the first keystroke**, because the spec
   requires that payment failure never destroys what someone wrote.

### Found while building

- **`cannot` and `will not` defeated the safety rules.** They were written for
  the contracted spellings, so "I cannot breathe" and "he will not let me
  leave the house" both slipped through. Fixed in normalisation rather than by
  patching 42 patterns. Caught only because the tests used the long forms.
- **Grief and crisis share vocabulary.** "Thinking about death" sits below the
  flag threshold on its own, because a flagged submission can never reach
  payment — over-flagging locks a grieving person out of the service entirely.
  Frequency is the separating signal: "every day" flags, bare mention does not.

### Still to build in this phase

`/ask` (write → screening → secret word → visibility → mock payment → envelope
ceremony → confirmation), `/a/:token` with all its states, the safety
interstitial UI, the mock payment provider, and the submission store.

### Still needed from Farida

- **Crisis hotline wording** for 102 and 112. The interstitial will look
  unfinished until this lands, deliberately.
- Real copy for "Why one manat?" and About.
- A real problem-and-reply for the homepage example.

### Submission flow — built and walked end to end (2026-09-21)

`/ask` and `/a/:token` are complete on mock APIs. Every path below was walked
in a real browser, not just reasoned about:

| Path | Result |
| --- | --- |
| Crisis text at the writing step | Stopped. **0 submissions created, 0 charged**, draft preserved, **0 canvases on the safety screen** |
| Ordinary problem | write → secret word → visibility → pay → ceremony → confirmation |
| Declined card (mock: any amount ending .13) | Error shown, back on the pay step, **draft intact at 206 chars**, nothing created |
| Successful payment | 43-char base64url token, **not derived from the id** |
| Secret word storage | Hash + salt stored; the plaintext word appears **nowhere** in the record |
| Unknown magic link | Warm explanation, no stack trace, offers recovery |
| Delete | Body, answer and email destroyed; tombstone keeps the payment record; `publicState` forced to `rejected`; old link dead |

### Decisions taken while building

1. **Q9 (deletion) — provisional answer taken.** Farida has not decided, so the
   flow takes the more protective route: the body text, the answer and the
   email are destroyed immediately, and only a tombstone remains carrying the
   amount and currency for refunds and accounting. The old link stops working
   either way. **Still worth her confirming** — the alternative is keeping the
   text for moderation history, which this deliberately does not do.
2. **Screening runs inside the API layer, not the UI.** `createSubmission`
   re-screens and refuses even though the writing step already screened. A rule
   enforced in a component is a rule you can skip by routing around the
   component.
3. **Private submissions never enter review.** `visibility: 'private'` sets
   `publicState: 'not_requested'`, so the archive query in Phase 3 cannot find
   them even if it were written carelessly.
4. **The amount is re-validated server-side** against the minimum, rather than
   trusting what the browser sent. Phase 5 checks it against the provider's
   reported amount on the callback.
5. **Confirmation is a step, not a route.** The secret word is only known in
   memory at submission time, so there is nowhere to reload it from — which is
   exactly why the page says to save it now.

### Known gaps in this phase

- `/recover` is linked from the footer and the unknown-link page but is **not
  built yet** — it is Phase 4 work, and currently 404s. Either build a stub or
  hide the link before anyone sees this.
- Secret word hashing is SHA-256 in the browser, clearly marked as a Phase 2
  placeholder. Phase 4 replaces it with argon2id on the server.
- The envelope ceremony renders the DRAFT placeholder sprite, so it currently
  reads as a hatched block rather than a letter being sealed.

---

## Phase 3 — Public community

Status: **complete on mock data.** Archive, categories, sorting, individual
problem pages, and all six static pages.

### The publication gate

Everything public passes through `getPublicSubmissions` /
`getPublicSubmissionById` in `src/lib/archive/queries.ts`. Nothing else in the
codebase may read submissions for public display. It fails closed.

`queries.test.ts` includes an **exhaustive** test: it enumerates every
combination of `visibility` x `publicState` x `status` x `safetyFlag` — 48 of
them — and asserts that exactly **one** is publishable:

    public / approved / answered / flagged=false

A new status added later without thought fails that test rather than quietly
leaking. 18 archive tests, 73 in total across the project.

### Proven in the running page, not just in tests

The dev fixtures deliberately include four **leak canaries** — a private row, an
unreviewed row, a safety-flagged row, and an approved-but-unanswered row — whose
body text contains the string `LEAK CANARY`. With all seven rows in the store:

| Attack | Result |
| --- | --- |
| Archive listing | 3 cards shown, **0 canaries**, 7 rows in the store |
| `/problem/:id` for the **private** row | Refused — "This one isn't here." |
| `/problem/:id` for the **flagged** row | Refused — same |
| Lookup by private token instead of id | Refused (unit test) |

### Decisions

1. **The archive ships on, but empty.** Nothing is invented to fill it, so it
   shows its empty state until real submissions are approved. `FEATURES.archive`
   turns it off in one line if an empty archive reads worse than none at launch
   — the spec allows either. (This is Q7, answered provisionally.)
2. **No counts, no votes, no popularity.** Newest and oldest only. Ranking other
   people's worst days by engagement would work against the entire point.
3. **Public pages are addressed by `id`, never by `token`.** The token is the
   visitor's credential; a unit test asserts it cannot be used as a public key.
4. **`PublicProblem` is built field by field**, not spread from `Submission`, so
   a field added later cannot become public by accident. A test asserts the
   exact key set and that no token, hash, salt or email appears in the output.
5. **Privacy is written from the code**, not from a template — it lists exactly
   what is retained, including the payment record that survives deletion. It
   must be corrected whenever the data model changes.
6. **Terms is marked as needing a lawyer.** It describes actual behaviour so
   whoever writes the real thing starts from something accurate.

### Still Farida's to write

- **About** — her story. The page carries a visible "unfinished" notice.
- **Terms** — needs legal review, not engineering.
- Crisis wording for 112 and 102 (still the blocker on the safety screen).
- Real copy for "Why one manat?" and a real homepage example.

### Note

The dev fixtures are currently seeded into the local browser store so the
archive is populated when you look at it. The "Seed archive fixtures" button on
`/archive` is development-only and does not exist in a production build.

---

## Phase 4 — Backend

Status: **API complete and verified. Admin dashboard UI not built** — the
routes exist and are tested, but there is no screen for Farida yet.

### A recommendation I changed

Earlier I proposed **Postgres via Supabase**. I have switched to **SQLite
through Node's built-in `node:sqlite`**, and the earlier advice should be
treated as superseded.

Why:

- Postgres is not installed on this machine, and Supabase means an account, a
  network dependency and credentials to manage.
- `node:sqlite` ships inside Node 24. No service to run, no native compilation,
  nothing to keep patched.
- A backup is "copy one file". That matters when the person operating this is
  not an engineer.
- At one-person-answering-advice volume, none of Postgres's advantages apply.

The cost, stated plainly: SQLite is single-writer and does not scale
horizontally. If this ever needs several machines serving writes, it means a
migration. That is years away at this volume, and the repository layer is the
only thing that would change.

**Also changed: scrypt instead of argon2id.** argon2 needs native compilation,
which is the kind of dependency that breaks on an OS upgrade and strands a
non-engineer with a project that will not build. scrypt is built into Node,
memory-hard in the same way, and tuned here to ~64 MB per hash. argon2id is
marginally preferred by cryptographers; "very good and always works" beats
"slightly better and sometimes will not install" for a project one person
maintains.

### The publication rule, now in SQL

`db.ts` defines a `public_submissions` VIEW that hard-codes every condition.
Application code reads the archive through the view and never through the
table. **30 server tests insert illegal states directly with raw SQL**,
bypassing every TypeScript guard, and confirm the view still refuses them.

### Verified against the running server, over HTTP

| Test | Result |
| --- | --- |
| Admin routes with no session | **401** on every one |
| Login, wrong password | 401, body identical to any other failure |
| Login, right password | 200, `HttpOnly` cookie set |
| Crisis text posted **straight to the API**, bypassing the UI | **Blocked. 0 rows created** |
| Client sending `amountMinorUnits: 1` | Refused server-side |
| Public submission immediately after submitting | **Not in the archive** — it is `in_review` |
| Approving a **private** submission | Refused |
| Approving before an answer exists | Allowed, but still not in the archive |
| Answer added | Now appears |
| Safety-flagged afterwards | **Vanishes from the archive** |
| Recovery: right word / wrong word / empty | **Byte-identical responses** |
| Recovery when rate-limited | Also identical — the limit itself is not observable |

### Bug found and fixed

`SUM` over zero rows returns `NULL` in SQLite, so a brand-new install showed a
dashboard of blanks instead of zeros. Every aggregate is now wrapped in
`COALESCE`, with a regression test.

### Operating it

    npm run admin:hash     # type a password, get two env lines; the password is never stored
    npm run server         # API on :8787

### Not done in this phase

- **The admin dashboard UI.** Every operation exists as a tested endpoint —
  list, answer, approve, reject, categorise, flag, reply to follow-up,
  analytics, purge emails — but Farida has no screen to click yet.
- **The front end still talks to localStorage**, not to this API. Wiring it
  across is the next piece of work.
- **Email delivery** for recovery is a `TODO(email)`. The link is deliberately
  never returned in the HTTP response — it goes to the address already on file
  or nowhere at all.

---

## CORRECTION FROM FARIDA — the characters (2026-09-21)

**PROMPT.md Section 10 is wrong and is superseded by this entry.** The spec
says three characters. Farida has corrected it: **there are two.**

| Character | Role | From whose perspective |
| --- | --- | --- |
| **Frog** | the problem-writer | the visitor — the frog is *you* |
| **Bunny** | the advice-giver | the reply — the bunny carries Farida's answer |

**There is no owl.** Every reference to a third character has been removed from
the code, the asset manifest, the sprite inspector, the artist brief and the
shared web brief.

### The artwork is already chosen

Farida's instruction: **only the pixel images she supplied may be used to
illustrate these two.** They are not mood references to draw *from* — they are
the art. Nothing is to be commissioned or drawn in their place.

Those images are the ones she shared at the start of the project:

1. A lush pixel forest — the frog in a purple witch hat, sitting on a red
   toadstool.
2. A soft peach bunny with blush cheeks and a heart marking.
3. A small isometric retro CRT computer with a beige keyboard.
4. The frog sitting at that computer — this is the typist.

**Action needed from Farida:** those images currently exist only in our
conversation. They need to be saved into `src/pixel/assets/` as PNG files so
the manifest can point at them. Until then the DRAFT placeholders remain,
because the code cannot reference a picture it does not have on disk.

Once the files are in place, each is a one-line change in
`src/pixel/assets.ts` — set `src` on the entry and the placeholder disappears.

### One thing worth watching

"Bunny is the advice-giver" needs care in the UI, because the spec is also firm
that **nothing may imply the characters are different humans giving advice** —
the line "All advice is written by one real human wearing different hats" is
load-bearing. The bunny works as the face of the reply, the way a stamp or an
envelope stands for a letter. It must not read as a second advisor alongside
Farida. Current usage (bunny on the confirmation page, the waiting state and
the archive empty state) is consistent with that.

### Admin dashboard — built (2026-09-21)

`/admin` now exists: password login, a queue that defaults to "Needs me",
safety flags shown as an unmissable banner plus a red-bordered row, and per-row
actions for reply, publish, don't-publish, categorise and flag. Analytics across
the top, including revenue. Deliberately plain — it is Farida's workbench, not
part of the visitor experience, so no pixel art and no ceremony.

The front end now talks to the API through `src/lib/api/client.ts`, and Vite
proxies `/api` to the Fastify server so the browser sees one origin. That is
required rather than convenient: the admin session is an httpOnly SameSite
cookie and would not survive a cross-origin request.

### Two bugs found by using it

**1. Every body-less POST was being rejected, silently.**

The API client set `Content-Type: application/json` on every request. Fastify
rejects a POST that announces a JSON body and then sends nothing, so *approve*,
*reject* and *logout* all came back 400. The earlier curl tests passed because
curl sends no content-type unless given a body — the bug only existed on the
browser path.

The client now sets the header only when there is a body.

**2. The real problem: the failure was invisible.**

`act()` ignored the result, so a rejected request looked exactly like a
successful one that changed nothing. Clicking *Publish* did nothing at all, with
no error and no clue. A moderation control that fails quietly is worse than one
that fails loudly — a failed publish that looks like a success is how something
ends up believed-published and not actually public.

Failures now surface in a banner, 401 says the session expired, and the compose
box **only clears on success** so a reply is never lost to a failed send.

### Verified through the dashboard, end to end

| Step | Result |
| --- | --- |
| Wrong password | Refused, vague message, nothing leaked |
| Right password | Signed in; queue and stats load |
| Private submission | **No Publish button at all** |
| Reply written and sent | Row moves to answered; revenue and counts update |
| Answered but not approved | **Still not in the archive** |
| Approved and answered | Appears in the archive |
| Approved but *unanswered* | **Still not in the archive** — both conditions required |

### Remaining in Phase 4

- The **visitor-facing** pages still use localStorage rather than this API.
  `/ask` and `/a/:token` need pointing at `src/lib/api/client.ts`; the archive
  pages need pointing at `/api/archive`.
- **Q8 is still unanswered** and blocks one admin feature: may Farida lightly
  edit a problem before publishing, and is the submitter told? No editing of
  submission text is built, deliberately.
- Email delivery for recovery remains `TODO(email)`.

### Front end wired to the API — Phase 4 complete (2026-09-21)

`/ask`, `/a/:token`, `/archive` and `/problem/:id` now talk to the Fastify
server. The browser no longer holds any submission data.

**Deleted, deliberately:**

- `src/lib/submissions/store.ts` — the localStorage persistence layer
- `src/lib/submissions/api.ts` — the mock backend
- `src/lib/archive/devFixtures.ts` — the seed fixtures and leak canaries
- `src/lib/archive/queries.ts` and its tests — **a second implementation of the
  publication rule**

That last one matters most. Two implementations of "what may be published"
means two places to get it wrong, and they drift. The server is now the single
authority: the rule lives in the `public_submissions` SQL view, and the browser
has no ability to ask for anything outside it.

The exhaustive 48-combination test moved to `server/repo.test.ts` so that
coverage was preserved before the client-side copy was removed, not after.

`draft.ts` stays. An in-progress draft *should* be local — it is the one thing
that must survive a failed payment without ever reaching a server.

### Verified end to end against the real server

| Step | Result |
| --- | --- |
| Crisis text at the writing step | Blocked by the server; 0 rows; draft preserved; 0 canvases on the screen |
| Ordinary problem, requested public | Submitted; **`afad:submissions` in localStorage is now `null`** |
| Row in SQLite | `public / pending / in_review`, 100 AZN, **secret word not in plaintext** |
| Archive immediately after | Empty — asking is not approval |
| Farida answers + categorises | Visitor sees the reply through the magic link |
| Archive after answer, before approval | Still empty |
| Archive after approval | Appears, under Friendship |
| Visitor sends follow-up | Accepted; box disappears; "Farida will reply once more" |
| Category filter | friendship=1, money=0 |

### A type-safety note worth keeping

The API returns the safety category as `string | null`. Handing that straight
to the interstitial would have compiled only because the shapes happened to
line up — a string off the network is not a union member. `asSafetyCategory()`
now narrows it at the boundary and falls back to `null`, which makes the
interstitial show its most general wording. Failing toward the general case is
the right direction on that screen.

### Phase 4 is done. Remaining across the project

- `/recover` is built and on. Email delivery for it remains TODO(email).
  uniform responses; the page and the email delivery do not.
- **Q8 unanswered**, and it blocks one admin feature: may Farida lightly edit a
  problem before publishing, and is the submitter told? No editing of
  submission text is built, deliberately.
- Phase 5: real Epoint/Payriff integration, refunds, E2E tests, accessibility
  and performance review.

---

## Two decisions from Farida — 2026-09-21

### Q8 · Editing published problems — DECIDED, and it is a NO

**Farida does not edit submissions. Ever.** What someone wrote is what appears,
or it is not published at all.

This closes Q8 and it is now a product rule rather than an unbuilt feature. The
admin dashboard has no field for editing submission text and should never gain
one. If a problem cannot be published as written — too identifying, against the
guidelines — the answer is to not publish it, not to quietly rewrite it.

Worth stating plainly because it is a genuine strength: a visitor can trust that
anything they read in the archive is what that person actually wrote.

### Crisis numbers — placeholders, with a guard

112 and 102 have been **removed** and replaced with obvious non-numbers
(`000 000 00 00`, `000 000 00 01`) while Farida finds the real list.

Putting fake numbers on a crisis screen is genuinely dangerous, so three things
make it impossible for them to reach anyone quietly:

1. **They do not look real.** Unmistakable non-numbers rather than plausible
   digits — nobody could mistake them for something to dial.
2. **They are not links, and they are struck through.** While the placeholder
   flag is set the numbers render as inert text, not `tel:` links, so nothing is
   one tap away from dialling nowhere. A banner says so in **every** build, not
   only development.
3. **`npm run build` refuses to produce a production bundle.**
   `scripts/preflight.ts` fails the build while the flag is set. Building anyway
   for local testing requires `ALLOW_PLACEHOLDER_CONTENT=1` — an explicit
   environment variable, so it cannot be switched on in a file and forgotten.

Verified: the build fails with placeholders, succeeds with the override, and
the guard clears the moment the flag flips to false.

**To finish this:** put the real numbers and their labels in
`src/content/crisis.ts` and set `CRISIS_NUMBERS_ARE_PLACEHOLDERS = false`. The
warning banner and the build guard both switch themselves off.

Preflight also warns (but does not block) while the site copy is still
placeholder text.

---

## Phase 5 — Payments and hardening

Status: **payments scaffolded (provider integration blocked on documentation);
security and accessibility reviews done and fixes applied.**

### Payments — what is built, and what deliberately is not

Built, and provider-agnostic:

- A `payments` table recording **every attempt**, not only successes. A failed
  payment is how you learn cards are being declined, or that someone tried
  three times and gave up partway through writing something hard.
- **Amount verification.** `confirmCapture` compares what the provider reports
  against what was attempted and refuses on any mismatch — in either direction.
  An unexpected overcharge is a bug to stop on, not a windfall.
- **Replay safety.** Providers retry callbacks; capturing twice does not double
  anything, and a replayed callback cannot resurrect a refunded payment.
- **Refunds from the transaction id alone**, with no visitor contact details —
  which matters because a private submission may have none and a deleted one
  certainly has none.
- Payment analytics: attempts, captures, failures, refunds, revenue.

**14 tests** cover these, including forged-callback and mismatch cases.

NOT built, deliberately: the Epoint and Payriff adapters throw
`ProviderNotConfiguredError` at every entry point. The spec forbids inventing
their API details and I have not. Each file lists exactly what is needed —
checkout endpoint, credential names, **callback signature scheme**, payload
shape, refund endpoint.

The signature scheme is the security-critical one: without verifying it, anyone
who finds the callback URL can claim a payment succeeded. The callback route
currently returns **501** rather than accepting anything unverified.

### Security review — findings and fixes

**The server was sending no security headers at all.** Now every response
carries:

`Referrer-Policy: no-referrer` · `X-Content-Type-Options: nosniff` ·
`X-Frame-Options: DENY` · `Cross-Origin-Opener-Policy: same-origin` ·
`Permissions-Policy` · a `Content-Security-Policy` restricted to same-origin ·
and HSTS in production.

`Referrer-Policy` matters most here: a magic link **is** the credential and it
sits in the URL, so without it, following any outbound link from a token page
would hand the token to the destination.

Already correct, confirmed: the admin cookie is `HttpOnly; SameSite=Strict`,
and `Secure` is set under `NODE_ENV=production`.

### Accessibility review — findings and fixes

Audited every page against labels, names, heading order, landmarks, alt text
and contrast.

- **Missing skip link** — added. Off-screen until focused, first in tab order,
  3px focus ring, jumps to `#main`.
- **Five contrast failures**, all marginal (3.77–4.28 against 4.5), all plum
  text on light surfaces. Added a dedicated `--accent-text` token: the same hue
  pushed darker for text, while `--accent-strong` stays the brand colour for
  borders and fills.

Everything else passed: every control has a label, headings run 1→2→2→3
without skipping, every canvas is `aria-hidden` or has a role, `<main>` and
`lang` are present.

**A bug I introduced and then caught.** My first contrast fix set the skip
link's background to `--accent-text` — which is dark plum in day but **light
pink at night**, so hardcoded white text on it dropped to **1.92:1**, far worse
than the 4.28 I was fixing. The lesson is narrow and worth keeping: an overlay
that appears over arbitrary content must not use tokens that flip between
themes. Its colours are now pinned literals, 12.55:1 in both.

Final: **0 contrast failures in both themes**, across 25 distinct
colour/size combinations.

### Remaining

- Epoint/Payriff integration — blocked on their documentation.
- `/recover` page and email delivery.
- Formal E2E test suite. The flows have been walked repeatedly in a real
  browser and the results recorded here, but that is not the same as an
  automated suite that runs on every change.
- Performance: the bundle is 229 kB (72 kB gzipped) with no code-splitting
  beyond the dev-only inspector. Fine at this size; worth revisiting if it grows.

---

## CORRECTION — no night mode for launch (2026-09-21)

Farida: day only for the initial release. Night mode comes after launch.

### How it is switched off

`FEATURES.nightMode = false`. **Disabled, not deleted** — it is coming back, and
tearing it out only to rebuild it later is work done twice.

The existing CSS already supported this. `theme.css` guards its dark media
query with `:root:not([data-theme='day'])`, so stamping `data-theme="day"` on
the root element makes the whole `prefers-color-scheme: dark` block inert. A
visitor on a dark-mode device sees the day theme, which is what "no night mode"
has to actually mean — hiding the toggle alone would not have done it.

Verified with the device set to dark **and** a stored `night` preference from a
previous visit: both overridden, day theme rendered, no toggle in the header.

**To bring it back:** set `nightMode: true`. Nothing else needs changing.

### A real bug this uncovered

With the device in dark mode, every sprite rendered in NIGHT colours on a light
page — dark blocks on a cream background.

Cause: React effects run after the first paint, so the original
`data-theme` stamp happened one frame too late. During that frame the document
was un-stamped, the dark media query applied, and `SpriteCanvas` — which
resolves its palette from live CSS custom properties and **caches the result
under a theme key** — cached night colours under the key `'day'`. Every sprite
then stayed wrong until a hard reload.

Fixed with `src/theme/applyTheme.ts`, called synchronously in `main.tsx` before
`createRoot`. There is now no frame in which the document is unstamped.

Worth recording because it is the same shape as the magenta-cache bug in Phase
1: a cache that stores an answer computed before the thing it depends on was
ready. The difference is that magenta was visibly wrong, and this was a
perfectly valid colour from the wrong theme — which is why it survived until a
dark-mode device happened to load the page.

Confirmed at pixel level: sprite colours are now `213,217,194` and
`141,154,131`, matching the day `--draft-fill` and `--draft-edge`.

### Still true

The sprite inspector at `/dev/sprites` still shows day and night side by side.
That is deliberate: it is development-only, it never ships, and the night
artwork still needs checking for when the theme returns.

---

## Lost-link recovery — built (2026-09-21)

`/recover` exists and `FEATURES.recovery` is on. This was the last
visitor-facing gap: somebody who lost their link previously had nothing.

### How it works

Two factors, because one is not enough and a salted hash cannot be looked up
globally:

- **the secret word**, and
- **roughly when they wrote** — a month picker, widened to a month either side,
  because "near enough" is all anyone remembers about a bad week

The server narrows candidates by date first and only then verifies hashes
against that small set. There is no global "does this secret word exist" query,
which is exactly what the Phase 0 design argued for.

### A decision I changed

The Phase 4 endpoint never returned the link at all — it was uniform to the
point of uselessness. That made recovery impossible for anyone who had not
given an email, which is most visitors, and they are precisely who the feature
is for.

The spec allows the link to be shown "only after the second factor verifies
server-side", and two factors do verify here. So a verified match now returns
the link. What is still never revealed is whether a submission exists for a
word that does **not** verify.

### Timing

Every response leaves after a **700ms floor**. Verifying against a narrowed set
takes time proportional to how many candidates there are, and a miss returns
sooner than a hit — without the floor, response time alone would answer "does a
submission exist for that month".

Measured: correct word 0.71s, wrong word 0.71s.

### A tension worth recording

The rate limit has to be invisible: if being throttled looked different from
not matching, that difference would itself answer the existence question. But
an invisible limit means somebody who mistypes six times gets "nothing matched"
forever and concludes their word is wrong — a miserable outcome for someone
who has already lost the link to something difficult they wrote.

Found this by accident: after six test attempts, the correct word started
returning null. The security behaviour was right; the human outcome was not.

Resolved by stating the limit **unconditionally on the page**, for everyone,
rather than showing it when it becomes relevant. The throttled visitor learns
to come back later, and nothing leaks, because the sentence is identical
whether or not they matched.

### Tests

Two added (102 total): recovery finds only the submission inside the given
window when two share a secret word months apart, and normalisation means
casing and stray spaces do not lock anyone out.

### Still not done here

Email delivery. When a visitor gave an email, the link should go to that inbox
rather than the screen. `TODO(email)` remains — but the date-window path works
without it, so recovery is usable today.

---

## Project moved (2026-09-21)

The project now lives at `~/Desktop/advice for a dollar new`. It was moved from
`~/advice for a dollar new`, which is now empty apart from a stale `.vite`
cache folder that a running dev server recreated. All 111 files came across
intact; nothing was lost.

**Worth noting: this project is still not under version control.** A move is
harmless, but there is no `git init` here, so there is no undo for anything
else. Worth doing before much more work accumulates.

## About page — Farida's copy, in verbatim (2026-09-21)

Her words are now on `/about`, unedited. Two conflicts with the rest of the
site are **flagged in the code but deliberately not fixed**, because both are
hers to resolve and quietly rewording them would hide a real question about
what the product is.

### 1. Is it one person, or several?

The About copy says **"the people responding"** and **"We're simply ... capable
people and empaths"** — then one paragraph later, **"pay a dollar for ME to
read it"**.

Everything else on the site is firmly singular:

- the FAQ says "Farida. One person, every time"
- every reply is signed "From: Farida"
- the trust section carries the spec-mandated line **"All advice is written by
  one real human wearing different hats"**

If more than one person will answer, that mandated line has to change, the
signature on every reply has to change, and the promise the site makes about
who is reading becomes a different promise. This is a product decision, not a
copy edit.

### 2. "A dollar" versus 1 AZN

The About copy says **"pay a dollar"**. The decision on record is **1 AZN**,
and every price on the site reads "1 AZN". The product is *named* Advice for a
Dollar, so this may well be figurative — but a visitor who reads About and then
reaches checkout meets a contradiction.

## The artwork — first file received, and it cannot be used yet

The forest scene arrived as a WhatsApp JPEG. Kept at
`src/pixel/assets/originals/forest-scene-whatsapp.jpeg` for reference, but it
is not usable as pixel art:

| | |
| --- | --- |
| supplied | 736 × 406, JPEG, **81,344 distinct colours** |
| expected for this art | roughly 20–40 |

WhatsApp re-encoded it as a photograph, smearing every hard pixel edge into a
gradient of near-identical colours. This site scales art with nearest-neighbour
at whole-number factors, so the smear gets magnified rather than the art.

**JPEG damage is permanent** — it cannot be downscaled away or cleaned up. The
original PNGs are needed.

How to send them so they survive: export as **PNG**, and send as a **file or
document** rather than as a photo. WhatsApp, Telegram, iMessage and email all
re-compress anything sent as a photo. Or copy them straight into
`src/pixel/assets/` from wherever the originals live.

Full instructions are in `src/pixel/assets/README.md`.

## Artwork — all four sources checked, none usable yet (2026-09-21)

Farida has supplied the art three ways now. None of them carry the actual pixel
data, and this is measured rather than assumed.

| Source | Form | Distinct colours | Usable |
| --- | --- | --- | --- |
| Forest scene | WhatsApp JPEG, 736×406 | **81,344** | No |
| Bunny | Screenshot PNG, 712×710 | **33,454** | No |
| Frog at computer | Screenshot PNG, 942×914 | **39,487** | No |
| Computer | Screenshot PNG, 770×756 | **19,978** | No |
| Canva shared board | `format:JPG quality:92`, upscaled to 1600–2266px | — | No |

Pixel art in this style carries roughly **20–60 colours**.

### Recovery was attempted and does not work

Point-sampled the centre of every block at each candidate grid size from 4px to
15px, on the cleanest of the three screenshots. A genuine integer upscale would
collapse sharply at one size — thousands of colours everywhere, a few dozen at
the true block size. Instead the count fell smoothly (2,639 → 322) with no
sharp drop, which is the signature of an image that was **smooth-scaled before
capture**. The pixel grid is gone, not merely enlarged, and no downsampling
recovers it.

### Canva is not a way around this

Inspected the shared board directly. Canva serves images as JPEG at quality 92,
upscaled to 1600–2266px — a viewer pipeline, not a file store. Nothing clean
can be extracted from a shared link.

**What can work:** in Canva while signed in, left sidebar → **Uploads** → hover
→ **⋮** → **Download** returns the original file *as uploaded*. If a screenshot
was uploaded, a screenshot comes back.

**Otherwise:** the art has to come from wherever it originally existed — the
artist, the asset pack, or the download it came from. Whoever drew it has the
source PNG, most likely at something like 32×32 or 64×64.

### Worth raising once

These read as existing pixel-art assets rather than commissioned work. Since
this site takes money from visitors, it is worth Farida confirming she has the
right to use them commercially before launch — whoever supplies the source
PNGs can usually confirm the licence at the same time.

The DRAFT placeholders stay in place meanwhile. Nothing is blocked: the whole
site runs on them, and each real file is a one-line change in
`src/pixel/assets.ts` when it arrives.

---

## First real artwork is live (2026-09-21)

**The frog at the computer is on the site**, rendering crisply at 128×128.

### How it was recovered

`typist_idle_01.PNG` arrived as 1920×1920 — which looked wrong, but the file
was only 69kB. That is far too small for a real 1920×1920 image, and the giveaway
was the colour count: **14**.

Analysis found horizontal run lengths of 15, 30, 45, 60, 75 — all multiples of
15 — and every 15×15 block perfectly uniform. It was a **clean nearest-neighbour
15× upscale of a 128×128 original**, which is lossless: each block holds exactly
one source pixel.

`scripts/downscale-art.py` (`npm run art:recover`) detects the factor by testing
which ones leave every block uniform, then samples one pixel per block. It
refuses rather than guessing when no factor works, because a non-uniform block
means smooth scaling and the original pixels are genuinely gone.

Result: 1920×1920, 69kB → **128×128, 888 bytes, 14 colours, bit-for-bit the
original art.**

Verified rendering in the browser: 256px on screen at 2× with DPR 2, **5,776
subpixels checked, zero non-uniform**, 14 colours — exactly the source palette.

### The other three files cannot be used

| File | Actually | Colours | |
| --- | --- | --- | --- |
| `typist_idle_01.PNG` | **PNG** 1920×1920 | **14** | ✅ recovered |
| `bunny_idle_01.PNG` | JPEG 3968×3968 | 12,824 | ✗ |
| `37D85AD3….PNG` | JPEG 1920×1920 | 11,964 | ✗ |
| `A98FC0DC….PNG` | JPEG 1920×1920 | 25,597 | ✗ |

All three carry a `.PNG` extension over JPEG data. Renaming does not convert.

**The useful part: the frog proves the export pipeline can produce clean PNGs.**
Same source, same 1920×1920 size — one came out PNG and three came out JPEG. So
whatever exported the frog, doing the same for the others is all that is needed.

### What changed in the engine

The manifest has carried an unused `src` field since Phase 1. It now works:

- `src/pixel/imageCache.ts` loads delivered PNGs, using `import.meta.glob` so
  Vite bundles them and rewrites paths for production. A literal
  `/src/pixel/assets/x.png` would have worked in development and 404'd in a build.
- `Sprite` gained an optional `src`. When set, pixels come from the image and
  the character grid is unused.
- `SpriteCanvas` draws image-backed sprites with `imageSmoothingEnabled = false`
  at integer scale, same discipline as the grid path. While an image is still
  loading it paints nothing rather than flashing a placeholder.
- `validateSprite` skips grid checks for image sprites — there is no grid to check.

DRAFT placeholders still cover everything not yet delivered, so a missing file
degrades to scaffolding rather than a blank.

### Two new tools

    npm run art:check      # inspects src/pixel/assets/ — real format, size, verdict
    npm run art:recover <in.png> <out.png>

## Both characters are now real art (2026-09-21)

The frog and the bunny are both on the site at their native 128×128.

### The bunny needed a different technique

It arrived as `png bunny.PNG` — still a JPEG inside, 3968×3968, 12,824 colours.
Renaming a file does not convert it.

But **3968 = 128 × 31 exactly**, which suggested a 31× upscale underneath the
JPEG damage. JPEG ringing concentrates at edges and leaves the middle of a flat
block relatively clean, so:

1. average only the **middle third** of each 31×31 block, skipping the ringing
2. that gave 128×128 with 78 colours — close, but noisy
3. merge colours within a small distance of each other, keeping the most
   frequent as representative → **12 colours**
4. map near-white to transparent, since the art sat on a white background

Result: 128×128, 12 colours, transparent background, 2kB.

### Important distinction between the two

| | Frog | Bunny |
| --- | --- | --- |
| Source | real PNG, clean 15× upscale | JPEG, 31× upscale |
| Method | **lossless** — one pixel per block | **reconstruction** — averaged and quantised |
| Confidence | bit-for-bit the original | very close, not guaranteed identical |

The frog is exactly what the artist drew. The bunny is a careful reconstruction
that looks right but may differ in a stray pixel or a near-identical shade. If a
real PNG export of the bunny ever turns up it should replace this one — it is a
one-line change and `npm run art:check` will confirm it.

### Layout adjusted for 128px art

The layout assumed 64×64 characters. At 128×128 native:

- world stage: both characters at **1×** (was 2×), which sits them side by side
- writing pad: frog at **1×**, and hidden below 560px rather than scaled down —
  128 is his native size, so there is no smaller whole-number option, and a
  canvas sized in device pixels cannot be shrunk with CSS

### Still outstanding

- The forest background — Farida is waiting on it.
- Two unidentified JPEGs remain in `originals/`, unusable and unnamed.

## The forest scene cannot be recovered (2026-09-21)

Tested properly rather than assumed. It is genuinely gone, and the reason
matters because it is different from the bunny.

| Evidence | Reading |
| --- | --- |
| `gcd(736, 406) = 2` | only a factor of 2 divides both dimensions — far too small to be an upscale |
| run lengths: 2, 4, 3, 8, 16, 6, 5 | a clean Nx upscale shows **one** dominant value, not a spread |
| colours by block size: 39,994 → 3,584 | falls smoothly, never collapses. The bunny hit **78** at its true factor |
| aspect 1.8128 | not 16:9 (1.7778) — it was cropped as well as resized |

### Why the bunny survived and this did not

The bunny arrived at **full resolution** (3968×3968) and was only
JPEG-*compressed*. Compression adds noise around edges but leaves the block
structure intact, so averaging the middle of each block recovered the pixels.

WhatsApp **downscaled** the forest scene. Resampling averages neighbouring
pixels together permanently — several source pixels become one output pixel,
and there is no arithmetic that separates them again.

**JPEG compression is survivable. Downscaling is not.**

### What is needed

The original file, whenever the artist delivers it. Farida is already waiting
on it, so nothing is lost by this — the DRAFT placeholder covers the background
and `AmbientWorld` becomes the full-bleed scene the moment
`ASSETS.background_day.src` points at a real file.

When it arrives: send it as a **file/document**, never as a photo. That is the
single difference between what happened to the frog (survived) and what
happened to this (did not).

---

## Automated end-to-end tests (2026-09-21)

This closes the gap I flagged earlier and kept flagging: the important
behaviours had only ever been checked **by hand, in a browser**. Walking a flow
once proves it worked once. These run on every change.

`server/app.test.ts` — **27 full-stack HTTP tests** through `app.inject()`.
Real routes, real screening, real database, real publication view. No network,
no browser, and nothing mocked out.

Total: **129 tests across 4 files.**

Most of them assert a *refusal* rather than a success. A test proving something
is allowed is worth far less here than one proving something is impossible.

### Mutation testing — proof the suite has teeth

27 new tests passing first time is suspicious, so I broke the code deliberately
and checked the suite noticed. A test suite that stays green while the code is
broken is worse than no suite at all, because it manufactures confidence.

| Sabotage | Tests that failed |
| --- | --- |
| Removed `safety_flagged = 0` from the public SQL view | **3** |
| Let the client's payment amount through unchecked | **2** |
| Skipped server-side safety screening entirely | **1** |
| Removed the admin session requirement | **7** |

All four were caught; all four were then restored and verified clean — no
`if (false)` residue, every guard back in place, 129 passing again.

### One thing the mutation testing revealed

Skipping safety screening trips only **one** test. Everything else has three or
more. For the highest-priority rule in the product that is thinner coverage
than it deserves — the suite would still fail, so the build would still break,
but it is worth widening when the crisis-resource wording lands and that area
is being touched anyway.

---

## Copy decisions resolved (2026-09-21)

### It is "I", not "we" — RESOLVED

One person answers. The About copy is now singular throughout:

- "the people responding are not doctors" → "I am not a doctor"
- "We're simply … capable people and empaths" → "I'm simply … a capable person
  and an empath"

This keeps the spec-mandated line — "All advice is written by one real human
wearing different hats" — true, and keeps every reply's "From: Farida"
signature honest.

### It is 1 AZN, not a dollar — RESOLVED

"pay a dollar for me to read it" → "pay 1 AZN for me to read it". The site now
says 1 AZN everywhere, with no contradiction between About and checkout.

### "Why one manat?" — Farida's words are in

Lightly corrected from her draft: grammar and typos only, no change of meaning.
Her original is kept verbatim in a comment above the copy so nothing is lost.
Changes were: "I have in a high school" → "I've been in high school";
"should getting between us" → "to get between us"; "pschologists" →
"psychologists"; sentence breaks for reading.

### Her question — "do I say us, or me, or my petname?"

**"us" is right**, and it does not contradict "I, not we". They are two
different words doing two different jobs:

| | |
| --- | --- |
| "**We** are capable people and empaths" | several advisers — conflicts, now gone |
| "price getting between **us**" | you and me — one person, warm, and the point of the page |

The first claims a team. The second draws the reader in. Only the first was
ever a problem.

### One thing still needed: her age

The copy reads "I'm AGE_PLACEHOLDER years old". Preflight now **blocks the
build** on any unfilled `*_PLACEHOLDER` token in quoted copy, so it cannot
reach the site literally.

If she would rather not give a number, the line works without it: "I've been in
high school and in university, I've been unemployed, employed…". The age adds
warmth but is not load-bearing.

## The forest scene — traced to Pinterest, and not recoverable

The Pinterest link resolves to `i.pinimg.com/736x/…` at **736×406 — exactly
the dimensions of the WhatsApp file**. So the WhatsApp copy *was* the Pinterest
rendition; nothing was lost in transit that was not already lost.

Probed Pinterest's higher-resolution renditions directly:

| Rendition | Size | Colours |
| --- | --- | --- |
| `/736x/` | 736×406 | 81,344 |
| `/originals/` | **750×414** | **104,181** |
| `/1200x/` | 750×414 | 104,181 |

`/originals/` is the largest Pinterest holds, and at 750×414 with 104k colours
the pixel grid was destroyed **before** it ever reached Pinterest. There is
nothing to recover, by any method.

## Licensing — worth settling before launch

The pin is titled "Enchanted Forest Pixel Art" and carries no author credit.
Pinterest is a discovery board, not a source: the artwork belongs to whoever
made it, and a pin says nothing about permission to use it.

This site takes money from visitors, which makes any use of it commercial. The
same question applies to the frog and the bunny if they came from similar
places.

Not a blocker for building — the site runs fine — but worth settling before
launch rather than after. The practical route is the same one that solves the
file-quality problem: find whoever made each piece, ask for the source PNG, and
confirm the licence in the same message.

---

## Licensing — settled (2026-09-21)

Farida has a working artist, and they have given **full permission to use their
art**. The question I raised earlier is closed and does not need revisiting.

## Artist brief updated for them

The brief had drifted out of date. It said the artwork was already chosen and
nothing was to be commissioned — written when the plan was to use found images.
There is now an artist producing work, so:

**§7 rewritten.** Both characters are noted as already in the site at 128×128.
What is outstanding is stated plainly: the **forest background scene**, plus any
animation frames.

**§13 rewritten** as the most important section in the document, because it is
where three files have already been lost. It now carries the actual evidence
rather than general advice:

- **PNG, never JPEG** — with the real number from this project: a 128×128
  character arrived as a JPEG carrying 12,824 colours where the original has 14.
  And: renaming does not convert.
- **Send as a FILE, not a photo** — messaging apps resize photos, and resizing
  is permanent. Illustrated with the two real outcomes here: one file arrived
  full-size and only compressed and was recovered perfectly; one was sent as a
  photo, got downscaled, and is gone.
- **Native size, not enlarged** — with the nuance that a clean nearest-neighbour
  whole-number enlargement *is* survivable, since that is exactly how the frog
  was recovered.
- **A self-check before sending** — zoom in; every pixel should be a crisp
  square of flat colour. Soft edges or coloured fringing means it has been
  through a JPEG or a resize.

Also noted that Farida can run `npm run art:check` on anything received, so a
bad file is caught in seconds rather than after it is built into the site.

The shared web version of the brief is updated to match.

---

## Inspector was reporting frame counts that did not exist (2026-09-21)

The sprite inspector showed the typist as "4 frames" and the bunny as "3
frames". Both have exactly **one** delivered image.

Cause: when an entry gained real artwork, the image sprite was still built with
`spec.frames` empty frames — the *intended* animation contract from the
manifest, not what had actually arrived. The inspector dutifully reported the
intention.

That is precisely backwards for a tool whose whole job is to show what is
really there. Image sprites now carry one frame per delivered file, and the
description says so explicitly: *"(1 of 4 frames delivered)"*. When the artist
sends the remaining frames the delivered count catches up with the intended one.

## README added

There was none. `NOTES.md` is a decision log — useful for understanding *why*,
useless for "how do I start this thing".

`README.md` covers running it (two Terminal windows, what each is for, how to
stop them), setting the admin password, what the dashboard does and the three
things it deliberately refuses to do, adding artwork, every npm command, the
pre-release safety check and why the build refuses right now, where things live,
and what is still outstanding.

Written for a non-engineer, because that is who has to operate it.

Two things it states plainly that are easy to miss:

- **Backing up is copying `data/advice.db`.** One file holds every submission,
  reply and payment record.
- **The project is still not under version control.** No undo, and the folder
  has already moved once.

---

## Into Git, verified end to end, and the admin login fixed (2026-10-04)

The project now lives on GitHub at `faridamammadli17-tech/advice_for_a_dollar`.
The database `data/advice.db` is deliberately ignored by Git: it holds what
people wrote and must never be uploaded. Back it up by stopping the server and
copying the file.

**Verified by running, not by reading.** On a fresh machine with Node 22: the
tests, typecheck, lint, the blocked build, the override build, the artwork
inspector, a real server start, and every page in a headless browser. All as
the handoff claimed. The screenshots in `docs/screenshots/` come from the
production bundle, driven through the whole visitor flow with a message that
says plainly it is a test. No invented problem and no invented advice appear
anywhere in them.

**Admin login could not work by following the README.** The README said to
paste the two lines from `npm run admin:hash` into `.env` and restart. Nothing
loaded `.env`: no dotenv dependency, no `loadEnvFile`, no `--env-file` flag.
Every login was refused, with no hint why. `server/index.ts` now reads `.env`
at start with Node's built-in `process.loadEnvFile`, before anything looks at
`process.env`; values already in the environment win, so a hosting service can
set them without a file. Proved against the real server: wrong password 401,
right password 200 with the session cookie, dashboard data only with that
cookie. `.env.example` was also stale (it named argon2, `ADMIN_SESSION_SECRET`
and `DATABASE_URL`, none of which the server reads, and omitted the salt it
requires). Rewritten to match reality.

**Three more things from the first audit pass, fixed with tests.**

- The admin list used `SELECT *`, so every dashboard refresh sent the
  secret-word hash and salt, the visitor's magic-link token and the screening
  details to the browser. The dashboard never showed them, so rule 5 was
  technically kept, but anything in the browser can leak from it. The query
  now names its columns.
- A reply made only of invisible characters (zero-width spaces, which phones
  and rich-text editors paste without anyone noticing) was accepted, marked
  the submission answered, and would have published a blank answer signed
  "From: Farida". The routes now strip those characters before deciding
  whether text is empty. While there, every public route treats a payload
  that is not text (a number or a list where words were expected) as empty
  rather than crashing.
- The homepage example is guarded by its own switch. Flipping it off before
  replacing the text would have shown "PLACEHOLDER" under "From: Farida", and
  the pre-build check would not have noticed. It notices now.

**Housekeeping.** The four long documents moved into `docs/`, so the front of
the repository is the README and the code. A GitHub Actions workflow runs the
tests, typecheck, lint and the override build on every pull request.
`package.json` states the Node requirement (22.5 or newer, for `node:sqlite`).

**The newer handoff.** A `HANDOFF.md` newer than this archive exists: it
describes 137 tests in 5 files, a sixteen-frame frog writing animation and a
`scripts/make-typing-frames.py`. None of that is in this repository. If that
work exists on the Desktop, it still needs to be brought in.

---

## The forest, the bunny, and the home page redesign (2026-10-04, later)

Three pieces of art arrived: the forest scene, the standing bunny with her
lantern staff, and a close-up portrait of her. Farida's brief for the home
page: the forest as the whole background, the writing box in the middle, the
bunny at its bottom-right corner close enough to be listening, the portrait
centred beneath, and everything gently alive rather than static.

**Getting the art intact.** The portrait was a lossless 15x PNG with
transparency and went straight through `downscale-art.py`. The other two were
JPEGs, which that tool rightly refuses. The scene was a 2x enlargement of
480x279 and the bunny a 15x enlargement of 128x128; for both, the most common
colour of each block is the original pixel, which is what the new
`recover-from-jpeg.py` samples. The bunny's white background was lifted by
flood fill from the edges, so her white eye highlights survived. A first
attempt tidied her palette down to 28 colours and lost the pink boots and the
lantern's purple; the lesson is in the tool's help text: tidy a scene, never a
character. The originals sit in `src/pixel/assets/originals/`.

**Composition.** One card holds the headline and the writing box, on a
translucent cream so it reads on the green. The bunny overlaps the card's
bottom-right corner on wide screens and steps under it, still touching, below
1100px, so nothing hangs off a tablet. The frog typist is hidden on this one
box: the bunny is the character here, and his 128px row pushed the box below
the fold on a laptop. He still types along on /ask. The trust section moved
up to sit directly under the hero with the portrait centred at its top, since
"who is reading this" is the natural next question after the box. The scene
is drawn at the smallest whole-number scale that covers the viewport,
anchored to the ground, and on wide screens anchored left so its own mushroom
bunny and frog stay in view.

**Motion.** A one-pixel breathing bob stepped with `steps(1)` so the sprite
never smears; a closed-eye frame layered on top for a moment every few
seconds; three sparkles and a soft glow at the lantern; eight fireflies and a
slow patch of sunlight on the meadow; and the card lifts with a plum shadow
when someone starts writing. All of it stops under `prefers-reduced-motion`.
The closed-eye frames are drawn from the open ones by `make-blink-frames.py`,
which records the exact eye colours, so the artist's next version is a preset
change, not a repaint.

**Checked in a real browser** at 1440, 1280, 1024, 768 and 390 pixels wide:
no horizontal overflow, the bob measured at exactly one art pixel, the blink
layer toggling, and the card and bunny above the fold on a laptop.

---

## The audit, and what it changed (2026-10-04, later still)

Six focused audits ran against the imported code, each told to break things
by running them rather than by reading them: admin authentication, lost-link
recovery and secret words, payments and privacy, the public routes, the
safety screen, and the publication rule. Everything below was reproduced
before it was fixed, and each fix has a test. What held under every attack
tried: no AI-written advice anywhere; the publication view; the rule that
nothing ever rewrites a visitor's text; the secret-word hashing; the identical
recovery responses; the security headers; no third-party resources.

What did not hold, and what changed:

- **Admin login could not work by following the README.** Nothing loaded
  `.env`. Fixed in `server/index.ts`, proved against the real server.
- **Behind any reverse proxy, everyone shared one rate limit.** Eight wrong
  passwords from anyone locked the owner out for fifteen minutes, repeatably;
  six recovery guesses switched recovery off for every visitor. `TRUST_PROXY`
  now exists for that deployment, defaults off, and the README says when to
  set it. Never `true`: that trusts a header anyone can forge.
- **The documented backup produced an empty file.** Write-ahead-log mode kept
  the newest rows in `advice.db-wal`, and the server never closed the database.
  `npm run backup` takes a consistent snapshot while the server runs, and a
  clean stop now closes the database so the file is complete on its own.
- **A submission could be created with no payment, and one payment could pay
  for any number of submissions.** "Received" summed what submissions claimed.
  A transaction is now required, used once, checked before the text is stored,
  and revenue is the sum of captured payments.
- **The recovery window was chosen by the requester.** A window of "1970 to
  2100" tested a guessed word against every submission ever made, at 44 ms of
  CPU each, and above sixteen candidates the response time revealed how many
  there were. The window is now clamped to three months and a year back, the
  candidates capped at 48 and all checked in parallel, and the floor raised to
  1.2 s so the time says nothing.
- **Nothing limited text length or submissions per address.** Two hundred
  near-megabyte submissions in twenty seconds, for free, and the dashboard
  loads every row's full text. Now 10,000 characters, 64 KB requests, ten
  submissions an hour and sixty screenings a quarter-hour per address.
- **The admin list sent secret-word hashes and salts, magic-link tokens and
  emails to the browser.** Named columns now.
- **Invisible characters.** A reply of zero-width spaces published as a blank
  answer; a soft hyphen split a crisis word in two; full-width letters evaded
  the screen entirely. All format characters are stripped and compatibility
  letters folded, on both the route and the screen.
- **The screen's own blind spots.** An idiom mask could swallow a real
  statement across a sentence break ("I want to kill myself. Laughing is...");
  "scared to death of my husband" was masked away as an intensifier; "I just
  want to die" never flagged alone. Masks now stop at sentence breaks; the
  abuse rule hears the idiom; emphatic forms flag by themselves. "I wanted to
  die when she read it out" still does not flag, deliberately, and the
  dashboard now marks rows where a rule matched below the threshold with "a
  safety rule noticed something", so Farida reads them knowing.
- **The publication view was frozen inside existing database files.** It was
  created with `IF NOT EXISTS`, so a tightened rule would never have reached
  Farida's real database. Dropped and recreated on every start. The
  48-combination test became 192 and now varies the answer too.
- **Network addresses were kept forever** in the rate-limit table and the
  Privacy page did not mention them. Purged once their window passes, and the
  page says so.
- Smaller: the category and flag routes crashed on odd input; a repeated
  archive parameter crashed with an internal message, and no error was ever
  logged (there is one error handler now); the Secure cookie flag depended on
  the exact string `production`; deletion kept the secret-word hash and salt;
  the dashboard said "published" for an approved problem nobody had answered;
  the recover page hung forever if the server was down; email matching was
  case-sensitive and a blank email counted as one; `PAYMENT_PROVIDER` relabelled
  pretend payments as a real provider; amounts had no ceiling or type check.

Still open, written down for whoever wires the real providers: create the
submission only after the provider's verified confirmation (today the browser
charges first and submits second), record the attempt before sending anyone
to pay, and wire the refund path (`markRefunded` has no caller). The archive
shows its first hundred entries with no paging. At the proxy, exclude `/a/`
and `/api/a/` from access logs, and repeat the API's security headers on
whatever serves the HTML.

---

## Her colours, her font, and the bunny at the top right (2026-10-04, evening)

Farida's second brief corrected the first: the bunny belongs at the top right
of the writing box, the close-up portrait goes centred beneath the staff she
holds and, smaller, into the header as the logo (it is the Instagram picture
too), the page uses her five colours with nothing white, and everything is set
in VCR OSD Mono. The copy stays exactly as written.

**Contrast, measured.** Wine on pale pink 6.95:1, wine on light green 6.91:1,
dark green on pale pink 5.70:1, dark green on light green 5.67:1, pale pink
on wine 6.95:1. So wine and dark green are the only text colours and both
work on both light surfaces. Pink is 3.31:1 at best (on wine) and 2.1:1 on the
light surfaces, so it never carries text: it is the button's shadow, the glow,
the fireflies. The button is wine with pale-pink text rather than pink, for
that reason. Cream, approved in September for the paper surfaces, stays on the
inner pages; the home page is the five colours only.

**The font.** Loaded with `@font-face` from the project's own files, so every
visitor gets it. Used for headings and body text. It lacks four characters:
the em dash (which the copy uses throughout), the en dash, the middle dot (in
"1 AZN minimum · pay what you want") and the manat sign. The stack falls back
to Courier New for those glyphs. Looked at closely, the fallback dash and dot
are thinner than the pixel strokes around them; at reading size they pass
without drawing the eye. The honest options are to live with it, or to draw
those four glyphs as a tiny companion font in the same pixel style; Farida
decides. Not in the font either: ə, ş, ğ, ı and İ, which would matter the day
there is Azerbaijani copy. The safety screen and the dashboard keep the plain
system fonts, deliberately.

**Composition.** From 1160px up, the bunny overlaps the card's top-right
corner by ten art pixels (inside its padding, never over text) and the
portrait sits centred under the staff, at art pixel 96 of her 128, measured
to the pixel in the browser. Below that she stands on the card's top edge,
right-aligned, and the portrait follows the card on the right; there the
portrait sits 64px left of the staff line, because centring it under the
staff would push it off a phone's edge. The logo is the portrait at its native
128px, since whole-number scaling allows nothing smaller; on phones the menu
sits beside it and the written name steps aside.

**A link to open.** This environment's network policy refuses the tunnel
services (api.trycloudflare.com, localtunnel.me), so no tunnel could be
opened from here. Instead a static preview build (`VITE_PREVIEW_ROUTER=hash`,
relative paths) is published as a private page: the whole front end, no server
behind it, so the writing flow stops politely at its first step. A real shared
preview needs either that policy widened or the server hosted somewhere.

---

## The frog at his computer, the creatures, and the dark green band (2026-10-04, night)

Farida's third brief, all design: swap the box's colours, bring the dark green
in at the top, delete the close-up under the staff, build the typing frog
properly, stop dimming the forest, and make it move. Not a word of copy changed.

**Colours.** The box is light green with the pale-pink writing area inside
it; the header and footer are the dark green band, with pale pink for the
menu and footer text (5.7:1 on it) and white for the page you are on (8.2:1).
Text is chosen after the background now, not before it: wine on the light
green box (6.9:1), dark green for the quieter line under the button (5.7:1).
Nothing on the page falls under 4.5:1. The sections below the hero keep their
pale pink and light green.

**The frog.** The second delivered frame (128px, recovered losslessly from a
15x enlargement, the first version kept in `originals/`) is cut into layers
by `scripts/make-typist-layers.py`: desk, body, head, closed-eye head, arm,
and lines of text for the screen. Nothing is redrawn. He is drawn at 3x
(a 264px-wide figure) at the foot of the writing box. His chest rises one
pixel as he breathes, his head drops two pixels to look at the keys and
lifts again, his hand taps and reaches, he blinks, and seven lines of text
type themselves onto the monitor, then the screen clears and starts over.
Every move is a whole-pixel `steps()` translate. The head is cut at the chin
and only ever drops, which is why no neck gap can open; the pixels the arm
would uncover when it lifts are filled from their neighbours in the layer
behind. The one visible arm is the only arm the artist drew, so it is the
only one that types.

**Where he sits.** The scene's own frog and bunny on their mushroom occupy
the leftmost 148 scene pixels, which on a wide screen (scene at 4x, anchored
left) is the leftmost 592px of the window, under the box's left edge. So on
wide screens he slides right along the box's bottom edge until he clears
them by twelve pixels: at 1440px wide he starts about 200px in from the box's
left corner, at 1280px about 125px in. Below 1160px the scene is centred and
the painted pair is off screen, so he sits at the bottom-left corner proper,
flush with the box's edge. Measured at 1440, 1280, 1160, 1024, 768 and 390:
no overlap with the painted characters at any of them, no horizontal
scrollbar, and the monitor tucks seven art pixels into the box's bottom
padding, eleven pixels under the last line of text.

**The forest.** The pink radial overlay that wandered over it is gone; the
scene is drawn at full colour. Its seven little black creatures are lifted
out by `scripts/cut-scene-creatures.py` into sprites, with the holes painted
over in `stage.png`, and drawn back at their exact spots, so at rest the page
shows the delivered picture to the pixel. Each one bobs, shuffles a pixel to
the side and back, and blinks on its own rhythm. Detection alone found
sixteen candidates, because the painted bunny's outline and skin share the
creatures' fur and eye colours; the seven real ones are picked by hand in
the script. Two more at the right edge are left painted (they are cut off by
the image edge and off screen at every common size). Fireflies: ten, slow.

**Checked.** Chromium at six widths; `prefers-reduced-motion` leaves every
animation off (frog, creatures, fireflies hidden, bunny) and the frog's
screen fully typed; no console errors. 160 tests, typecheck, lint, the
override build. The preview page is republished at the same address.

---

## Cream, one line, Chiron, and the forest as delivered (2026-10-06)

Farida's fourth brief, with one deliberate change to her earlier rule: the
deletions in it are hers. Everything she did not mention stays as it was.

**The box.** The writing area is cream (#fcffe1), her choice; the first
colour outside the five. Wine stays the text colour on it (9.8:1) and dark
green the placeholder (8.0:1). Above the writing area there is one line now,
"Write down the thing you have been carrying", which is the textarea's label
and so its accessible name, set at 24px (20px on a phone) in sentence case
as she wrote it. The small site-name line, the headline, the paragraph and
the "What is on your mind?" label are gone from the home page; the /ask page
keeps its own label and placeholder. The placeholder reads "Try giving as
much detail as possible". The button, the price line and the line about a
real person replying are untouched.

**The frog** moved from the foot of the box to the label row, at 1x (his
native 96x68 canvas; there is no smaller whole number), at the right end of
the row with his desk's feet two pixels into the writing area's top border.
The line wraps to two lines beside him on a box of full width and three on a
phone. All his animation is as before. The CSS that slid him along the
bottom edge to clear the painted frog is gone with him.

**The standing bunny** with the lantern staff is removed from the page
(`Bunny.tsx` now holds only the portrait; the art files stay for the
inspector). The logo stays.

**Chiron.** The bunny has a name. A name card hangs off the bottom edge of
the box, centred: his portrait, the logo's artwork at 1x, over the word
"Chiron" and nothing else, by her instruction, so the character does not
look like the one who answers. Pale pink on the light-green box, wine border,
pink hard shadow; it comes after the reply line in the flow, so it can never
cover it, and 44px of it hang below the border (the stage reserves that
room). He blinks.

**The forest is her file.** Her rule: pixel for pixel, no filter, no
re-encoding, nothing between the image and the screen. Measured first: the
480px copy the page used to draw (recovered from her 2x JPEG and tidied to
40 colours) differed from her file by more than 24 levels in some channel at
10.3% of pixels, because the JPEG carries compression noise (only 36% of its
2x2 blocks are uniform) and the tidying moved colours. So the page now draws
the delivered JPEG itself. Vite copies it unchanged (the checksum in `dist/`
is the file's). The seven creatures are cut out of that file at its own grid
by the same script, each with a patch of meadow for its hole; at rest a
creature covers its patch exactly. Checked in Chromium: the served file drawn
into a canvas matches the file decoded outside the browser at all 535,680
pixels; a screenshot at 1440x900 matches the file at all 611,798 visible
forest pixels; `.forest` and `.forest-stage` report filter none, opacity 1,
blend normal, image-rendering pixelated. The one cost: the 2x file's
whole-number scales are 2 and 4 screen pixels per art pixel, never 3, so at
1366x768, 1280x800 and 1024x768 the scene is a step larger and more of its
right side (the stump with three creatures) is off screen than before. A 1x
PNG from the artist would give the 3x step back and be pixel-exact as well.

**Balance.** With the bunny gone the right side of the page at laptop
widths is open meadow and the dark bush; the scene cannot show both the
mushroom pair and the stump at that width at any whole-number scale. The
box carries itself: the frog at its top right, Chiron at its bottom centre.
Reported to Farida as a question rather than filled.

**Checked.** Chromium at 1440, 1280, 1160, 1024, 768 and 390 wide: no
horizontal scroll, the font loaded, no console errors; reduced motion leaves
no visible element animating (fireflies hidden). 160 tests, typecheck, lint,
the override build. README screenshots retaken; the preview page republished.

---

## No more pink fills, and a bigger frog (2026-10-06, later)

Farida's fifth brief, three items. Two are done; the third waits on a file.

**Pale pink is no longer a background anywhere.** Every pale-pink (#f8cae4)
fill on the home page is cream (#fcffe1) now: the sections below the hero,
Chiron's card, the surface token the example panel uses, and the fireflies'
dots. Wine (9.8:1) and dark green (8.0:1) read clearly on it. What stays, as
she asked: wine borders, the wine button, and pale pink as the text colour
on the dark-green bands and the button. The hot-pink shadows and the
fireflies' glow were not named and stay; flagged to her.

**The frog is bigger.** 3x (288x204 on screen) where the box has its full
width, 2x (192x136) below 700px. At 3x each line of writing on his monitor
is a three-pixel stroke and reads clearly as writing appearing; at 2x it is
visible but small, and there is no room beside the line for 3x on a phone.
On a phone (480px and under) the line takes the full width and he sits
under it, right-aligned, on the writing area's top edge. His desk is pulled
down by six art pixels plus six so its feet land two pixels into the border
at either size. The box is taller now (708px at full width), so on a
1440x900 screen the bottom of Chiron's card sits just below the first
screen.

**The new sprite sheet did not arrive.** Farida's brief describes
`frog-writing-spritesheet.png`, 2048x128, sixteen 128x128 frames in which
only the monitor changes (lines of writing, a blinking caret, a pause, a
clear), with her tested CSS for 2x and the numbers for 3x, and asks for the
built animation to be replaced by it, with no body movement added, no
cutting into layers, and pixel (never percentage) end positions. The file
was not attached to the message, so the current layered frog stays for now.
When it arrives: put it in `src/pixel/assets/`, replace `TypingFrog.tsx`
and `.css` with a single element using her CSS at 3x/2x as above (the
hundredths of her frame step: 16 frames in 2.286s), delete the typist layers
and `scripts/make-typist-layers.py` from the build, keep the reduced-motion
rule, and check the transparent margins of her frames so the desk still
sits on the writing area's edge.

---

## The frog holds still (2026-10-06, later still)

The copy of the sprite sheet that reached the chat was a 500x31 JPEG preview
of the 2048x128 sheet, shrunk by a non-whole factor and unusable, and Farida
chose not to pursue it: the delivered frog stays as drawn, completely still,
and only his screen moves. So `TypingFrog` no longer breathes, glances,
taps or blinks; the layers (desk, body, head, arm) are drawn once and never
move, and the closed-eye head is no longer rendered. The lines of writing
still appear on the monitor one at a time, pause, clear and start again, by
whole pixels, and stop under reduced motion with the page fully written.
Checked in Chromium: with motion allowed the only animations on the page are
the seven screen lines, the creatures, Chiron's blink and the fireflies.
