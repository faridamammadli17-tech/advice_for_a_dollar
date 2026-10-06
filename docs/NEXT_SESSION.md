# Continue here: brief for a new chat

Paste this whole file into a new Claude Code chat. It says what the project
is, where it stands, the rules that must not be broken, and how the last
sessions worked. The long versions live in this repository: `docs/HANDOFF.md`
(rules and traps), `docs/NOTES.md` (every decision, in order; the last entry
is the most recent round), `README.md` (plain-language tour).

## Where everything is

- Repository: `faridamammadli17-tech/advice_for_a_dollar`
- Working branches: the first three design rounds are on
  `claude/new-session-40ml7r`; the fourth round (2026-10-06) is on
  `claude/sharp-cray-8x10z0`, which contains all of the first branch plus
  that round. Develop and push on the branch the session names; never on
  another branch without being asked.
- Pull request: https://github.com/faridamammadli17-tech/advice_for_a_dollar/pull/1
  (open, created by the owner from the Claude Code UI, base `main`, from the
  first branch). GitHub runs tests, types, lint and build on every push. The
  fourth round is not in that pull request yet: the owner decides whether it
  goes onto the first branch or gets its own pull request.
- Preview page (front end only, no server, private): https://claude.ai/artifact/8bXKMWZKcVxfBJrUYx4a6D
- Latest work at the time of writing: the fourth design round (see the last
  entry of `docs/NOTES.md`).

## Who you are working with

The person in the chat is not a developer and does not want to deal with
code. The project owner is Farida, also not an engineer. What they want:

- a working, polished, publicly presentable result, not clever code
- plain-language reports: what changed, what did not work, what they must
  do themselves (said in non-technical words)
- links they can actually open, with an honest note on what kind of link it
  is and when it stops working
- honesty about anything that failed or was not done

## Rules that are not negotiable

1. **No AI-written advice anywhere**: not in replies, examples or the archive.
   The home page example slot stays empty until Farida writes a real one.
2. **Never change the copy.** Design rounds are design only. On the home page
   the one line "Write down the thing you have been carrying", the
   placeholder "Try giving as much detail as possible", the button, "1 AZN
   minimum · pay what you want", the reply line and "One manat" are final;
   the deleted headline, paragraph and "What is on your mind?" label were
   deleted by the owner on 2026-10-06 and do not come back. The em dashes are
   part of how the owner writes; do not rewrite text to avoid a missing glyph.
3. **Leave the safety / crisis screen alone**: no forest, no bunny, no
   animation, system fonts. Its phone numbers are placeholders on purpose and
   the release build refuses until Farida supplies real ones
   (`ALLOW_PLACEHOLDER_CONTENT=1 npm run build` for local testing only; that
   bundle must never go online).
4. **Palette on the home page is five colours and nothing else**: wine
   `#752445`, pink `#EA6993`, pale pink `#F8CAE4`, light green `#CFDD9D`,
   dark green `#2F582C`, plus the cream `#fcffe1` the owner chose for the
   writing area itself. Pick the background first, then the text colour
   (white, black or palette) that reads best. Body text at 4.5:1 or better;
   pink never carries text (3.3:1 at best). Measured pairs are in
   `docs/NOTES.md`.
5. **Font**: VCR OSD Mono via `@font-face` (`src/fonts/`), fallback
   `'Courier New', monospace` for the glyphs it lacks (em dash, en dash,
   middle dot, manat sign; also ə ş ğ ı İ).
6. **Pixel art**: whole-number scale only, `image-rendering: pixelated`, no
   stretching. Animation moves by whole art pixels with `steps()`; no
   fractional translate, rotation or non-integer scale. Everything stops under
   `prefers-reduced-motion`. Do not redesign the characters: the frog's head
   layer only ever moves down (nothing is drawn behind it).
8. **The forest background is the owner's file, untouched, pixel for pixel.**
   `ForestScene.tsx` draws `src/pixel/assets/originals/forest-scene-2x-jpeg.jpg`
   itself. No CSS filter, opacity, blend mode, gradient or tinted layer on
   `.forest` or `.forest-stage`; no re-encoding or conversion in the build.
   Only whole-number scaling and `image-rendering: pixelated`. Check it the
   way the last session did: draw the served file into a canvas and compare
   with the file; compare a screenshot's forest pixels with the file.
7. The owner never edits submissions; secret words are hashed; recovery never
   confirms existence; the publication rule is enforced in SQL. See HANDOFF.

## What the home page is now (four design rounds, all done)

- Forest scene full-bleed behind the page: the delivered JPEG, unchanged.
  `src/components/ForestScene.tsx` draws it at a whole-number scale and the
  seven black creatures back as sprites cut from the same file
  (`src/pixel/assets/creatures/`, made by `npm run art:creatures`), each over
  a patch of meadow for its hole; they bob, shuffle and blink by one art
  pixel (two file pixels). Ten slow fireflies.
- Writing box in the middle: light green `#CFDD9D`, cream `#fcffe1` writing
  area, wine text, dark-green placeholder. Hover and focus states lift it.
  Above the writing area only the line "Write down the thing you have been
  carrying" (the textarea's label, 24px, two lines beside the frog).
- The frog at his computer at 1x at the right end of that line, his desk on
  the writing area's top edge (`src/components/TypingFrog.tsx` and `.css`;
  placement under "the frog" in `src/pages/Home.css`). Breath, head to the
  keys and back, hand tapping, blink, seven lines typed then cleared.
- Under the reply line, Chiron's name card: the bunny's portrait (the logo's
  art, 1x) over the word "Chiron", pale pink with a wine border, hanging 44px
  off the box's bottom edge. Just the name, no title. He blinks.
  `src/components/Bunny.tsx` (`BunnyPortrait`).
- The standing bunny with the staff is gone from the page. The logo stays.
- Header and footer are the dark green band; menu and footer text pale pink,
  current page white. Logo = the bunny's close-up portrait at 128px (also
  the Instagram picture); on phones the written name hides.
- Sections below the hero alternate pale pink and light green.

Known cosmetic things nobody asked about yet: at 1440×900 the header hides
the top of the painted bunny's ears; at tablet widths the menu wraps under
the logo; at 1366×768 and 1280×800 the forest is shown a step larger than
before (the 2x file only allows 2 or 4 screen pixels per art pixel), so the
stump with its creatures at the right is off screen there.

## Decisions still waiting on the owner

- Draw the four missing glyphs (em dash, en dash, middle dot, manat) as a
  tiny companion font, or live with the Courier New fallback.
- Widen the cloud environment's network policy if a real tunnel link is
  wanted (api.trycloudflare.com and localtunnel.me are refused there); the
  artifact preview is the workaround.
- Whether the fourth round goes onto the pull request's branch or into a
  second pull request; then merge when happy.
- Whether anything is wanted on the right of the page at laptop widths now
  that the standing bunny is gone (open meadow and the dark bush today).
- Ask the artist for a 1x export of the forest (480x279 PNG): it would be
  pixel-exact too and allow a 3x step on laptops.
- Content only Farida can supply: real emergency numbers, her age for the
  "Why one manat?" paragraph (or a rewrite), a real example exchange, Epoint
  or Payriff API documentation for real payments, switching email on.

## How to work on it

```bash
npm install                 # Node 22.16 or newer (node:sqlite)
npm run server              # API + SQLite, port 8787
npm run dev                 # website, port 5173
npm test                    # 160 tests
npm run typecheck && npm run lint
ALLOW_PLACEHOLDER_CONTENT=1 npm run build   # local only
npm run admin:hash          # set the dashboard password into .env
npm run backup              # snapshot the database
npm run art:typist          # re-cut the frog layers (python3 + Pillow)
npm run art:creatures       # re-cut the creatures from the delivered forest file (python3 + Pillow)
npm run art:blink           # bunny closed-eye frames
```

Python tools need `pip install --user pillow` in the cloud container.

Verifying in a browser (what previous sessions did): `npx vite preview
--port 4175 --strictPort` on the override build, then playwright-core
(`npm i playwright-core` in a scratch folder) with
`executablePath: '/opt/pw-browsers/chromium'`; screenshot at 1440, 1280,
1160, 1024, 768 and 390 wide, measure element boxes in the page, check
`document.documentElement.scrollWidth` equals the viewport, check
`document.fonts.check('17px "VCR OSD Mono"')`, and emulate
`reducedMotion: 'reduce'` to confirm every animation name is `none`.
Start servers with `setsid ... &` and kill the process group; `pkill -f`
tends to kill the shell itself.

Republishing the preview page: `VITE_PREVIEW_ROUTER=hash
ALLOW_PLACEHOLDER_CONTENT=1 npx vite build --base=./ --outDir <scratch>`;
make `preview.html` from `index.html` keeping only title, referrer meta,
icon link, stylesheet link, a `<style>` giving html/body background
`#7dc26a`, the root div and the module script, with paths like
`assets/...` (no `./`); publish it with the Artifact tool passing the
existing URL above and a `files` map of `assets/*` and `favicon.png`.

README screenshots live in `docs/screenshots/`; regenerate them after a
visual change (home.png at 1440×900, home-writing.png a crop of the box
while typing, home-tablet.png at 768×1024, the mobile ones at 390×844 at
2x, home-mobile-chiron.png scrolled 420px so the card shows).

Commits so far end with the Claude Code attribution lines the session
provides. PR activity: subscribe to pull request 1 again in the new session
if it should be watched.
