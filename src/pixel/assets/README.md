# Artwork goes here

Farida has already chosen the art — the pixel images she shared. **No new
character art is to be drawn or commissioned.** They just need to exist here as
files, because the code cannot point at a picture that only lives in a chat.

## ⚠️ The files must be PNG, and must be the originals

The forest scene arrived as a WhatsApp JPEG (kept in `originals/` for
reference). It cannot be used as-is, and this is not a preference:

    supplied:  736 × 406, JPEG, 81,344 distinct colours
    expected:  pixel art of this kind has roughly 20–40

WhatsApp re-encoded it as a photograph. Every hard pixel edge has been smeared
into a gradient of near-identical colours. Scaling that up with nearest-
neighbour — which is what this site does — magnifies the smear instead of the
art, and the whole point of the pixel discipline is lost.

**JPEG damage is permanent.** It cannot be cleaned up, downscaled away, or
recovered. The original PNG is needed.

### Canva will not work as the source

Checked the shared Canva board directly. Canva serves images through a display
pipeline, not a file store:

    format:JPG  quality:92  height:1600 / 1920 / 2266

Every rendition is **re-encoded as JPEG and upscaled** — even the one served as
PNG is blown up to 2266px tall. Those are rendering artefacts of Canva's
viewer, not the files that were uploaded. Nothing clean can be pulled out of a
shared link.

**What does work, if the original upload was a proper PNG:**

1. Open the design in Canva while signed in
2. Left sidebar → **Uploads**
3. Hover the image → the **⋮** menu → **Download**

That returns the original file as uploaded. The catch: if what went *into*
Canva was a screenshot, that is what comes back out. Canva preserves the
upload; it cannot restore detail that was never there.

**If that gives a screenshot too**, the art has to come from wherever it
originally existed — the artist who drew it, the asset pack it came from, or
the site it was downloaded from. A pixel artist will always have the source
PNG, usually at something like 32×32 or 64×64.

### How to send them so they survive

- Export or save as **PNG**, never JPEG.
- Send as a **file / document**, not as a photo — WhatsApp, Telegram, iMessage
  and email all re-compress images sent as photos. Attaching as a document
  keeps the bytes intact.
- Or simply copy them straight into this folder from wherever the originals
  live.

## What is needed

| File | What it is | Registered as |
| --- | --- | --- |
| `background_day.png` | the forest scene | `ASSETS.background_day` |
| `frog_idle_01.png` | the frog in the purple witch hat | `ASSETS.frog` |
| `typist_idle_01.png` | the frog at the retro computer | `ASSETS.typist` |
| `bunny_idle_01.png` | the peach bunny | `ASSETS.bunny` |

Animation frames follow `character_state_frame.png` — `bunny_idle_02.png`,
`frog_typing_01.png`, and so on.

## Then what

Open `src/pixel/assets.ts` and set `src` on the matching entry:

```ts
bunny: {
  ...
  src: '/src/pixel/assets/bunny_idle_01.png',   // was: null
}
```

That one line replaces the DRAFT placeholder. Update `width` and `height` to
the file's true pixel dimensions at the same time — the inspector at
`/dev/sprites` validates them in development and throws loudly if a file and
its entry disagree, so a mismatch is impossible to miss.
