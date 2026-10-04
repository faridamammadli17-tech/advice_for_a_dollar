# Advice for a Dollar — Pixel Art Brief

For the artist. Everything you need to draw, animate, and hand off art for this site.

If something here conflicts with what Farida tells you directly, **Farida wins** — just flag it so this document can be corrected.

---

## 1. What this site is, and what the art has to do

Advice for a Dollar is a one-person advice service. A stranger writes down a problem, pays a small amount, and a real human — Farida — writes back personally.

The art carries the emotional job. Someone arriving here is often having a bad day. The world they land in should feel **small, warm, hand-made, and safe** — like peeking into a cosy corner of a forest where somebody is already sitting there, listening.

**Aim for:** playful · cosy · internet-native · slightly absurd · unmistakably made by a person.

**Avoid:** slick corporate mascots · anything that looks like a chatbot, robot, or AI assistant · clinical or medical imagery · anything cold, clean, or "enterprise".

> One hard rule with no exceptions: **nothing may suggest a bot is answering.** No robots, no screens with chat bubbles, no speech-synthesis motifs, no glowing AI orbs. A real person writes every reply, and the art has to support that.

---

## 2. Style anchor

The reference images Farida shared set the direction:

- a dense, lush pixel forest — layered greens, deep shadow, soft light pooling on the grass
- fat red toadstools with cream spots and pale yellow stems
- a frog in a purple witch hat, sitting on a mushroom cap, content
- a soft peach bunny, round, with blush cheeks and a heart marking
- a small isometric retro CRT computer with a beige keyboard
- the frog sitting at that computer

That's the world. Chunky, rounded silhouettes. Generous outlines. Warm light. Things slightly too big and slightly too soft to be realistic.

**Read the references for *feeling and silhouette*, not for exact colour** — the palette below is the rule, and it's tighter than the references.

---

## 3. Palette

Five brand colours. These are fixed:

| Name | Hex | Where it lives |
| --- | --- | --- |
| Plum | `#752445` | deepest shadow, outlines on warm shapes, mushroom underside |
| Rose | `#EA6993` | mushroom caps, bunny ears, accents, the wax seal |
| Blush | `#F8CAE4` | highlights, bunny body, soft light, particles |
| Sage | `#CFDD9D` | lit grass, leaf highlights, glow pools |
| Fern | `#2F582C` | forest shadow, deep foliage, grounding darks |

**The rule:** each colour may have **up to 2 shades** (one lighter, one darker), plus **one shared outline colour**. With Cream below, that's a ceiling of 19 colours total. Do not introduce off-palette colours, and do not use gradients that smuggle in new ones.

### Cream — approved, the sixth colour

| Name | Hex | Where it lives |
| --- | --- | --- |
| Cream | `#F2E6C9` | paper, the letter, the envelope, mushroom spots and stems |

Same 2-shade allowance as the other five. The working ceiling is now **six colours, up to two shades each, plus one shared outline** — 19 maximum.

**A wood neutral was proposed alongside it and not approved.** Worth planning around rather than discovering halfway through the desk: the retro computer, the keyboard, branches and the log all have to be built from the six colours you have. Plum with Cream highlights is the closest thing to warm wood in this palette. A limited palette where wood reads plum-toned is a legitimate look rather than a compromise — but it does mean props will sit further from the reference art's browns than the characters will. If it fights you once you're in it, say so and it can be revisited.

---

## 4. The grid rule — the one that breaks everything if ignored

Draw everything at **1×, on a strict pixel grid.** The site scales your art up by whole numbers only — ×2, ×3, ×4 — never 1.5, never 2.5.

This is why:

- A 64×64 bunny at ×3 becomes a crisp 192×192 bunny. Every original pixel becomes exactly a 3×3 block.
- That same bunny at ×1.5 becomes 96×96, where some original pixels become 2 screen pixels and others become 1. The result is a subtly lumpy, wobbly-edged bunny. There is no way to fix it after the fact.

So: **never pre-scale your exports.** Send the 64×64 file. The site does the scaling, correctly. If you send a 192×192 file it has to be scaled *down* to be used, which destroys it.

Practical consequences while you work:

- Pencil tool, 1px, anti-aliasing **off**. Always.
- No soft brushes, no blur, no drop shadows, no partial-opacity edges. Every pixel is either fully one palette colour or fully transparent.
- Zoom in to draw, but check your work at 100% too — that's roughly how much detail actually survives.

---

## 5. Canvas sizes

| Asset | Canvas (1×) | Shown at | Notes |
| --- | --- | --- | --- |
| Small UI icons (arrow, heart, lock, star, check, copy, close) | **16 × 16** | ×3 → 48px | keep 1px transparent margin all round |
| Interface objects (envelope, key, coin, stamp) | **32 × 32** | ×3 → 96px | |
| Standard character idle (bunny) | **64 × 64** | ×3 → 192px | figure ≈48–56px tall, anchored bottom-centre |
| Character + prop (frog at computer) | **96 × 80** | ×3 → 288px | |
| Hero scene (frog + desk + bunny) | **160 × 96** | ×3 → 480px | |
| Envelope animation frames | **64 × 64** | ×4 → 256px | fixed frame size across the whole sequence |
| Logo / bunny head | **32 × 32** | ×2 → 64px | must stay readable shrunk to 16px |
| Full-bleed background scene | **480 × 270** | ×3 → 1440 × 810 | read §6 before starting this one |

**On the logo:** 32×32 is the canvas, but the real test is that it still reads at **16×16** as a browser tab icon. Squint at it small and early. If the ears vanish or it turns into a blob, simplify the silhouette until it survives.

**On character height:** the ≈48–56px figure inside a 64×64 canvas isn't wasted space. The headroom holds ears, hats, and blink/hop frames without anything clipping at the edge.

---

## 6. The mobile safe zone — the most important constraint here

The background scene is 480 pixels wide. On a desktop it's scaled ×3, filling a 1440px screen. On a phone (~390px wide) it can only scale **×2** — anything more and it's absurdly zoomed in, anything fractional and it goes lumpy (§4).

×2 on a 390px screen means the phone shows only about **195 of your 480 background pixels.** Centred. The rest is cropped off.

```
      your 480 × 270 background canvas
┌──────────┬───────────────────┬──────────┐
│          │                   │          │
│  CROPPED │    SAFE ZONE      │ CROPPED  │
│    on    │    192 × 270      │    on    │
│  mobile  │                   │  mobile  │
│          │  everything that  │          │
│  sky,    │  MATTERS lives    │  sky,    │
│  grass,  │  in here          │  grass,  │
│  filler  │                   │  filler  │
│          │                   │          │
└──────────┴───────────────────┴──────────┘
  ~144px        centre 192px       ~144px
```

So:

- **Inside the centre 192 × 270:** the frog, the desk, the bunny, the hero mushroom — anything a visitor needs to see to understand the world.
- **Outside it:** only extendable scenery. Sky, grass, distant foliage, wall texture. Things that can be sliced away without anyone noticing something is missing.
- Don't put a single important element — a character's face, a key story beat — near the left or right edge. On half of all visits it won't exist.

Tip: keep a 192px-wide guide layer switched on in your editor while composing. The `/dev/sprites` page on the site will show the same overlay, so you can check any composition against the real crop.

---

## 7. The two characters

**There are two, and there is no owl.** An earlier version of this brief said three.

They are **unnamed** for now — the site shows `???` under each. Don't design around names.

| | Who they are | Notes |
| --- | --- | --- |
| **Frog** | the one writing | From the visitor's perspective, the frog *is* them — sitting at the computer with something to get off their chest. Purple witch hat. |
| **Bunny** | the one writing back | Round, soft, blush cheeks. The face of the reply. Likely to become the logo. |

Both characters are already in the site at 128×128. What is outstanding is the **forest background scene**, and any animation frames for the two characters.

### Critical

The two must never read as *two different people giving advice.* The site says, in these exact words: *"All advice is written by one real human wearing different hats."*

The bunny stands for the reply the way an envelope stands for a letter. It is not a second advisor sitting alongside Farida, and no copy anywhere attributes advice to the bunny rather than to her.

---

## 8. Animation

All animation is frame-by-frame. Keep **every frame of a character on the same canvas size**, with an identical registration point (**bottom-centre**). If the feet drift between frames, the character will visibly jitter when it loops.

### Idle loops
2–4 frames at **~6fps**. Breathing, a slow sway, an ear twitch. Subtle — these play forever in the background, so anything energetic becomes annoying within ten seconds.

### Blink
A **single overlay frame**, fired randomly every 3–6 seconds. Draw it as just the closed eyes on a transparent canvas, aligned to the idle pose — not a full redrawn frame.

### Typing (the frog)
Two alternating hand positions at **~10fps**, plus a subtle 2-frame head bob on a slower cycle. Small note/`!` particles optional. This eases in when the visitor starts typing and returns to idle ~0.7s after they stop, so the two states need to blend without a visible pop.

### The envelope ceremony (~2.5s)

When someone submits their problem, it becomes a small ceremony. This is the emotional high point of the whole site — the moment a person's worry becomes a letter that's actually going somewhere.

All frames on a fixed **64 × 64** canvas. Suggested budget at ~12fps:

| Stage | Frames | What happens |
| --- | --- | --- |
| Letter forms | 4 | text gathers into a sheet of paper |
| Fold | 4 | the sheet folds down |
| Slide in | 4 | the letter moves into the envelope |
| Flap closes | 3 | |
| Seal stamps | 3 | wax heart presses down — squash it on impact, then settle |
| Particle burst | 3 | small sparks outward (draw as a separate overlay layer if easier) |
| Hop & settle | 5 | the envelope hops once, lands, wobbles still |

≈26 frames ≈ 2.2s, plus a short hold. Treat the budget as flexible — if the fold wants 6 frames and the burst wants 2, that's fine. The total is what matters.

### Reduced motion
Some visitors have "reduce motion" switched on in their device settings, often because animation makes them ill. For every animated asset, make sure the **first frame works as a still image**, because that's what those visitors will see. Nothing should look broken or mid-gesture when frozen.

---

## 9. Day and night

The site ships a **day theme and a night theme.**

- **The background scene needs both versions.** Night is not just "darker" — light pools differently, the mushroom spots and any glow read as light *sources*, and the sage highlights drop away while the ferns take over.
- **Characters do not need redrawing.** The site can tint them. Draw them for day; if a character looks wrong when tinted, we'll handle that case specifically rather than doubling your workload.

---

## 10. Export rules

- **PNG** with transparency.
- **1× only.** Never pre-scaled. (§4)
- Anti-aliasing **off**. No soft shadows. No semi-transparent edge pixels — every pixel fully opaque or fully transparent.
- No gradients that introduce off-palette colours.
- Stay within: the 6 colours (5 brand + Cream) + up to 2 shades each + 1 outline colour.

**Naming:** lowercase, snake_case, `character_state_frame.png`

```
bunny_idle_01.png
bunny_idle_02.png
bunny_blink_01.png
frog_typing_01.png
envelope_seal_03.png
```

Either numbered frames like that, **or** a single horizontal sprite sheet with a **uniform frame width** — both work, pick whichever you prefer. If you send sheets, tell us the frame width.

---

## 11. What to draw, in order

Placeholder blocks are already in the site, so nothing is blocked — send things as they're ready rather than saving up a big delivery.

**First — the foundation**
1. Bunny idle (64×64, 2–4 frames) + blink overlay
2. Frog typing (96×80, 2 hand frames + 2 head-bob frames) + idle
3. Bunny head logo (32×32) — check it at 16px

**Second — the experience**
5. Envelope ceremony (64×64, ~26 frames)
6. Background scene, day (480×270) — mind §6
7. Background scene, night (480×270)
8. Hero scene: frog + desk + bunny (160×96)

**Third — the details**
9. Interface objects (32×32): envelope, key, coin, stamp
10. UI icons (16×16): arrow, heart, lock, star, check, copy, close

---

## 12. Quick checklist before you send anything

- [ ] Exported at 1×, not scaled up
- [ ] Anti-aliasing off — no soft or semi-transparent edges
- [ ] Within palette (6 colours + 2 shades each + 1 outline)
- [ ] Every frame of a character on the same canvas, feet at the same spot
- [ ] Frame 1 works as a standalone still
- [ ] Background composition survives the centre-192px crop
- [ ] Logo still readable at 16px
- [ ] Filenames lowercase snake_case
- [ ] Nothing in it reads as a robot, a bot, or an AI

---

## 13. Delivering — please read this part

Three files have already been lost to this, so it is worth being blunt about it. The art itself was fine every time; only the way it travelled was wrong.

### PNG, always. Never JPEG.

JPEG is built for photographs. It works by blurring detail that the eye will not miss — which is exactly the hard pixel edges that make pixel art work. One save as JPEG and the art is permanently damaged. It cannot be cleaned up, downscaled back, or recovered.

A real example from this project: a 128×128 character arrived as a JPEG carrying **12,824 colours**. The original has **14**.

**Renaming does not convert.** A JPEG called `bunny.png` is still a JPEG. The extension is just a label.

### Send as a FILE, not as a photo

WhatsApp, Telegram, iMessage and email all **resize** anything sent as a photo. Resizing averages neighbouring pixels together permanently — several source pixels become one, and no arithmetic separates them again.

This is the difference between two files in this project:

- one arrived at full size, only compressed → **recovered perfectly**
- one was sent as a photo and got downscaled → **gone, unrecoverable**

In every app: attach as **document** or **file**. Never "photo" or "image".

### Native size, not enlarged

Export at the size you drew at — 64×64, 128×128, whatever it is. Do not scale up first.

If your tool only exports enlarged, that is survivable **provided** it uses nearest-neighbour at a whole-number factor: a clean ×15 enlargement can be reduced back exactly. Smooth or fractional scaling cannot. If you can choose, native size avoids the question entirely.

### A quick self-check before sending

Open the file and zoom right in. Every pixel should be a crisp square of one flat colour. If the edges look soft, or you can see faint coloured fringing around hard lines, it has been through a JPEG or a resize — go back to the source file.

### Where to put them

Straight into `src/pixel/assets/`, or to Farida however is easiest, as **files**.

| File | What it is |
| --- | --- |
| `background_day.png` | the forest scene |
| `background_night.png` | the same scene at night, if you are doing one |
| `bunny_idle_02.png`, `_03` … | animation frames |
| `frog_typing_01.png` … | animation frames |

Farida can run `npm run art:check` on anything received — it reports each file's **real** format, its true size, and whether it is usable, so a problem is caught in seconds rather than after it is built into the site.

Everything is treated as a **draft** until she says otherwise. Every asset is registered in one place in the code, so swapping a draft for a final version is a one-line change — send revisions freely, they are cheap to take.

Questions, or something here that fights what you want to make: say so. The constraints exist to keep the site crisp, not to box you in.
