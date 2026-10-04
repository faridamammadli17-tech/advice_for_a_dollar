# Getting the art into the site

The two images that came through cleanly in chat — the bunny and the frog at
the computer — **look right**. Hard edges, flat colour, no smearing. Those are
the files we want.

The problem is not their quality any more. It is that they are in a chat
window, and the site needs them as **files in this folder**.

## What to do

Wherever those files live on the computer right now — the folder you picked
them from when you attached them — drag or copy them into:

    src/pixel/assets/

Name them:

| File | What it is |
| --- | --- |
| `bunny_idle_01.png` | the bunny |
| `typist_idle_01.png` | the frog at the retro computer |
| `frog_idle_01.png` | the frog on its own, if there is one |
| `background_day.png` | the forest scene, when it arrives |

That is the whole step. Nothing needs converting or resizing first.

## The single most important rule: send as a FILE, not a photo

This is what separated the frog from the forest scene.

- The **frog** was sent at full resolution and only compressed. The pixel grid
  was still intact underneath, so it was recovered perfectly.
- The **forest scene** went through WhatsApp as a photo, which **downscaled**
  it. Resampling merges neighbouring pixels permanently — no amount of cleverness
  separates them again.

JPEG compression is survivable. Downscaling is not.

In WhatsApp, Telegram, iMessage and email: attach as a **document / file**,
never as an image or photo. On a Mac, dragging the file straight into this
folder is best of all.

## One thing to watch: .png that is secretly a JPEG

Two of the four files sent in that batch were rejected because the data inside
them was JPEG while the filename said `.png`.

Renaming a file does not convert it. A JPEG called `bunny.png` is still a JPEG,
and still carries the smeared edges that make pixel art unusable.

To check one on this machine:

```bash
file src/pixel/assets/bunny_idle_01.png
```

`PNG image data` is good. `JPEG image data` means that file needs re-exporting
as a real PNG from whatever drew it.

## Then tell me

I will read each file, measure it — true pixel dimensions and colour count —
and register it in `src/pixel/assets.ts`. That is one line per image, and the
DRAFT placeholders disappear.
