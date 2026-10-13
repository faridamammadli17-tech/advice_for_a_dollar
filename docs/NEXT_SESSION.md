# Continue here: brief for a new chat

Paste this whole file into a new Claude Code chat. It says what the project
is, where it stands, the rules that must not be broken, and how the last
sessions worked. The long versions live in this repository: `docs/HANDOFF.md`
(rules and traps), `docs/NOTES.md` (every decision, in order; the last entry
is the most recent round), `README.md` (plain-language tour).

## Where everything is

- Repository: `faridamammadli17-tech/advice_for_a_dollar`
- Working branches: the first three design rounds are on
  `claude/new-session-40ml7r`; rounds four to six (2026-10-06) are on
  `claude/sharp-cray-8x10z0`, which contains everything on the first branch
  plus those rounds. Develop and push on the branch the session names; never
  on another branch without being asked.
- Pull request: https://github.com/faridamammadli17-tech/advice_for_a_dollar/pull/1
  (open, created by the owner from the Claude Code UI, base `main`, from the
  first branch). GitHub runs tests, types, lint and build on every push.
  Rounds four to six are not in that pull request: the owner decides whether
  they go onto the first branch or get their own pull request.
- Preview page (front end only, no server, private, shows the latest
  version): https://claude.ai/artifact/8bXKMWZKcVxfBJrUYx4a6D. In that
  build the safety screening runs in the browser with the same rules
  (`screenOnServer` in `writeStep.ts`) and the sending step keeps a
  pretend submission in the browser (`src/lib/preview/fakeSubmissions.ts`),
  so the whole flow can be walked there, including the reply page with a
  labelled stand-in reply. Both are preview build only.
- Latest work at the time of writing: the seventh round (2026-10-13, every
  page restyled and the flow change), on `claude/sharp-cray-8x10z0`; see
  the last entry of `docs/NOTES.md`.

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
   placeholder "Try giving as much detail as possible", the button "Get
   advice", "1 AZN minimum · pay what you want", the reply line ("A real
   person reads this and writes back. Normally within 24 hours...") and
   "Chiron" are final. The old headline, paragraph and "What is on your
   mind?" label were deleted by the owner on 2026-10-06 and do not come
   back. The em dashes elsewhere are part of how the owner writes; do not
   rewrite text to avoid a missing glyph.
3. **Leave the safety / crisis screen alone**: no forest, no bunny, no
   animation, system fonts, the neutral paper colours pinned on `.safety`
   in theme.css (Farida's dashboard, `.admin-shell`, shares that block).
   Its phone numbers are placeholders on purpose and the release build
   refuses until Farida supplies real ones (`ALLOW_PLACEHOLDER_CONTENT=1
   npm run build` for local testing only; that bundle must never go online).
   **The safety screen runs before anyone reaches the secret word**,
   through the one function `checkWriting` in
   `src/lib/submissions/writeStep.ts`; the box with the rest of the flow
   cannot open without it. Never add a second path around it.
4. **Colours, site-wide** (the day block of `src/styles/theme.css` since
   2026-10-13): wine `#752445`, light green `#CFDD9D`, dark green `#2F582C`,
   cream `#fcffe1`, and two leftovers: pink `#EA6993` only as the hard
   shadow under buttons and Chiron's card and as the fireflies' glow, and
   pale pink `#F8CAE4` only as text on the dark-green header and footer and
   on buttons. **Pale pink is never a fill** (owner, 2026-10-06). Inner pages
   are a light-green page with a cream `.page-panel`; the home page is the
   forest with the same furniture. Pick the background first, then the text
   colour that reads best. Body text at 4.5:1 or better; pink never carries
   text (3.3:1 at best). Measured pairs are in `docs/NOTES.md`: wine on
   cream 9.8:1, dark green on cream 8.0:1, wine on light green 6.9:1.
5. **Font**: VCR OSD Mono via `@font-face` (`src/fonts/`), fallback
   `'Courier New', monospace` for the glyphs it lacks (em dash, en dash,
   middle dot, manat sign; also ə ş ğ ı İ).
6. **Pixel art**: whole-number scale only, `image-rendering: pixelated`, no
   stretching. Animation moves by whole art pixels with `steps()`; no
   fractional translate, rotation or non-integer scale. Everything stops under
   `prefers-reduced-motion`. Do not redesign the characters.
7. **The frog never moves.** (Owner, 2026-10-06.) Only the writing on his
   monitor animates. Do not add breathing, blinking, head or hand movement
   back, and do not replace him with a sprite sheet: that idea was dropped.
8. **The forest background is the owner's file, untouched, pixel for pixel.**
   `ForestScene.tsx` draws `src/pixel/assets/originals/forest-scene-2x-jpeg.jpg`
   itself (the file she sent, 960x558). No CSS filter, opacity, blend mode,
   gradient or tinted layer on `.forest` or `.forest-stage`; no re-encoding
   or conversion in the build. Only whole-number scaling and
   `image-rendering: pixelated`. Check it the way the last session did: draw
   the served file into a canvas and compare with the file; compare a
   screenshot's forest pixels with the file (last result: 0 differences).
9. The owner never edits submissions; secret words are hashed; recovery never
   confirms existence; the publication rule is enforced in SQL. See HANDOFF.

## What the site is now (seven design rounds, all done)

Every page shares the header (dark-green band, logo, pale-pink menu, white
for the page you are on), the footer (the same band), wine buttons and
wine-bordered panels. Inner pages sit in a cream panel on a light-green
page; the home page sits on the forest. "Get advice" on the home page runs
the length check and the safety screen, then opens a box over the home page
(`src/components/FlowDialog.tsx` + `SubmissionFlow.tsx`) with the rest of
the flow: step indicator with step 1 done, secret word, private or public,
pay, the magic link. "Change what I wrote" closes it. There is no separate
/ask page any more: /ask redirects to the home page's writing area, as do
all "Get advice" links. The reply page /a/:token stays a page. The home
page itself:

- Forest scene full-bleed behind the page: the delivered JPEG, unchanged.
  `src/components/ForestScene.tsx` draws it at a whole-number scale (anchored
  to the ground, and to the left edge from 1160px so the painted bunny and
  frog on their mushroom stay in view) and the seven black creatures back as
  sprites cut from the same file (`src/pixel/assets/creatures/`, made by
  `npm run art:creatures`), each over a patch of meadow for its hole; they
  bob, shuffle and blink by one art pixel (two file pixels). Ten slow
  fireflies.
- Writing box in the middle (640px wide at most): light green, cream writing
  area, wine text, dark-green placeholder. Hover and focus states lift it.
  Above the writing area only the line "Write down the thing you have been
  carrying": the textarea's label, 24px (20px on a phone), wine, two lines
  beside the frog on a wide box; on a phone (480px and under) it takes the
  full width and the frog sits under it on the right.
- The frog at his computer at the right end of that line, 3x (288x204)
  where the box has its full width and 2x (192x136) below 700px, his desk's
  feet two pixels into the writing area's top border.
  `src/components/TypingFrog.tsx` and `.css`, placement under "the frog" in
  `src/pages/Home.css`. He is the delivered 128px frame cut into layers by
  `scripts/make-typist-layers.py` only so the screen text can be separated;
  the body layers are static. Seven lines are typed onto his monitor one at
  a time, held, cleared, and it starts again; under reduced motion the page
  shows fully written.
- Below the box's content: the button and price line, then the reply line,
  then Chiron's name card: the bunny's portrait (the logo's art, 1x, 128px)
  over the word "Chiron", cream with a wine border and pink shadow, centred,
  hanging 44px off the box's bottom edge (the stage reserves that room).
  Just the name, no title, by the owner's instruction. He blinks.
  `src/components/Bunny.tsx` (`BunnyPortrait`).
- The standing bunny with the staff is gone from the page (its art files
  stay for the sprite inspector). The logo stays.
- Header and footer are the dark green band; menu and footer text pale pink,
  current page white. Logo = the bunny's close-up portrait at 128px (also
  the Instagram picture); on phones the written name hides.
- Sections below the hero alternate cream and light green.

Known cosmetic things nobody asked about yet: at 1440×900 the header hides
the top of the painted bunny's ears and the bottom of Chiron's card sits
just below the first screen; at tablet widths the menu wraps under the logo;
at 1366×768 and 1280×800 the forest is shown a step larger than the old
480px copy allowed (the 2x file only permits 2 or 4 screen pixels per art
pixel), so the stump with its creatures at the right is off screen there.

## Decisions still waiting on the owner

- Whether rounds four to seven go onto the pull request's branch or into a
  second pull request; then merge when happy.
- The standing bunny still pictured on the magic-link step, the reply
  page, the unknown-link page, the empty archive and the recover page,
  though he left the home page. Hers to decide.
- With a real payment provider: does the box hold the provider's embedded
  form, or close for the trip to the provider's page and reopen on the
  magic link? Depends on the provider's documentation.
- Whether the remaining pink (the hard shadows and the fireflies' glow) and
  the pale-pink text on the dark-green bands should go too.
- Whether anything is wanted on the right of the page at laptop widths now
  that the standing bunny is gone (open meadow and the dark bush today).
- Ask the artist for a 1x export of the forest (480x279 PNG): it would be
  pixel-exact too and allow a 3x step on laptops.
- Draw the four missing glyphs (em dash, en dash, middle dot, manat) as a
  tiny companion font, or live with the Courier New fallback.
- Widen the cloud environment's network policy if a real tunnel link is
  wanted (api.trycloudflare.com and localtunnel.me are refused there); the
  artifact preview is the workaround.
- Content only Farida can supply: real emergency numbers, her age for the
  "Why one manat?" paragraph (or a rewrite), a real example exchange, Epoint
  or Payriff API documentation for real payments, switching email on.

## Traps learned the hard way

- Pictures attached to the chat arrive shrunk and re-saved as JPEG (a
  2048x128 sprite sheet came through as 500x31). Ask for art to be uploaded
  into the repository on github.com or shared as a file or link.
- The owner's forest file is a 2x enlargement saved as JPEG, so it carries
  compression noise; the 480px PNG copy in `src/pixel/assets/forest_day.png`
  is a cleaned reconstruction used only to find the creatures and in the
  inspector. Never draw that copy on the page.
- CSS `background-position` percentages are relative to the box minus the
  image; use pixels for sprite offsets.

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
`reducedMotion: 'reduce'` to confirm no visible element has an animation
(the fireflies are `display: none` there and still report a name). Start
servers with `setsid ... &`; `pkill -f` and `kill` of the group tend to
kill the shell itself, so check with `pgrep -f "[v]ite preview"` afterwards.

Republishing the preview page: `VITE_PREVIEW_ROUTER=hash
ALLOW_PLACEHOLDER_CONTENT=1 npx vite build --base=./ --outDir <scratch>`;
make `preview.html` keeping only title, referrer meta, icon link,
stylesheet link, a `<style>` giving html/body background `#7dc26a`, the
root div and the module script, with paths like `assets/...` (no `./`);
read the artifact at the URL above first, then publish `preview.html` to
that URL with `root` set to the build folder and a `files` map of the new
`assets/index-*.css` and `.js` (list the artifact's files and pass `null`
for the old ones). Unchanged assets (font, art, forest) keep their names
and need not be re-sent.

README screenshots live in `docs/screenshots/`; regenerate them after a
visual change (home.png at 1440×900, home-writing.png a crop of the box
while typing, home-tablet.png at 768×1024, the mobile ones at 390×844 at
2x, home-mobile-chiron.png scrolled 520px so the card shows).

Commits so far end with the Claude Code attribution lines the session
provides. PR activity: subscribe to pull request 1 again in the new session
if it should be watched.
