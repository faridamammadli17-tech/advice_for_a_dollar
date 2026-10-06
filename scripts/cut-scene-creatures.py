#!/usr/bin/env python3
"""
Lift the little black creatures out of the forest scene so they can move.

    python3 scripts/cut-scene-creatures.py [CLEAN] [DELIVERED] [OUT_DIR]

CLEAN defaults to src/pixel/assets/forest_day.png (the 480x279 copy with a
tidy palette, used only to FIND the creatures), DELIVERED to the file Farida
sent, src/pixel/assets/originals/forest-scene-2x-jpeg.jpg (960x558, a 2x
enlargement with JPEG noise in it), and OUT_DIR to src/pixel/assets/creatures/.
Neither input is ever changed. The script writes, all cut from the DELIVERED
file at its own pixel grid:

    creature_N.png        one sprite per creature, cropped to its own pixels
    creature_N_blink.png  the same with its eyes shut (eye pixels become fur)
    creature_N_patch.png  meadow for the hole it leaves: its own pixels filled
                          from the nearest surrounding ones, transparent
                          elsewhere
    creatures.json        where each one sits, in DELIVERED pixels

ForestScene.tsx draws the delivered file itself, untouched, then each
creature's patch and the creature on top of it at its recorded spot. At rest
the creature covers its patch exactly, so the screen shows the delivered
picture to the pixel; the animation moves each creature by whole art pixels
(two delivered pixels) and the patch shows through where it stepped from.

A creature is a connected patch of fur colour with at least one eye pixel
touching it, found on the clean copy. Requires Pillow.
"""
from __future__ import annotations

import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/pixel/assets/forest_day.png')
DELIVERED = Path(
    sys.argv[2] if len(sys.argv) > 2 else 'src/pixel/assets/originals/forest-scene-2x-jpeg.jpg'
)
OUT = Path(sys.argv[3] if len(sys.argv) > 3 else 'src/pixel/assets/creatures')

FUR = (0x15, 0x1c, 0x23)
EYE = (0xe5, 0xc2, 0xae)
MAX_EYE_PIXELS = 24

# Roughly where each creature is (scene pixels). The scene's painted bunny and
# frog share the fur colour in their outlines and the eye colour in their
# skin, so the creatures are picked by hand rather than by detection alone.
# Two of them sit together at the top right; they are cut apart.
# `whole` takes the entire patch of fur as drawn; the default first opens the
# patch (drops one-pixel lines such as the stump's outline) and grows back.
ANCHORS = [
    {'at': (443, 42)},                  # top right, the bigger of the pair
    {'at': (432, 54)},                  # top right, the smaller, below left
    {'at': (32, 66)},                   # top left, above the bunny's ears
    {'at': (441, 139)},                 # right, in the grass
    {'at': (452, 150), 'whole': True},  # right, the tiny one beside it
    {'at': (428, 187)},                 # on the stump
    {'at': (68, 268)},                  # bottom left, half behind the edge
]


def main() -> None:
    im = Image.open(SRC).convert('RGBA')
    w, h = im.size
    px = im.load()

    def is_fur(x, y):
        return 0 <= x < w and 0 <= y < h and px[x, y][:3] == FUR

    def is_eye(x, y):
        return 0 <= x < w and 0 <= y < h and px[x, y][:3] == EYE

    # ---- the fur, with one-pixel lines (stump edges, outlines) opened away
    fur = {(x, y) for y in range(h) for x in range(w) if is_fur(x, y)}

    def neighbours8(x, y):
        return [(x + dx, y + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]

    core = {p for p in fur if all(q in fur for q in neighbours8(*p))}
    core = {q for p in core for q in neighbours8(*p) + [p] if q in fur}

    def component(seed, members, four=True):
        seen = {seed}
        queue = deque([seed])
        while queue:
            cx, cy = queue.popleft()
            steps = ((1, 0), (-1, 0), (0, 1), (0, -1)) if four else tuple(
                (dx, dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy)
            for dx, dy in steps:
                q = (cx + dx, cy + dy)
                if q in members and q not in seen:
                    seen.add(q)
                    queue.append(q)
        return seen

    # ---- eyes: small patches of eye colour sitting in fur
    eye_pixels = {(x, y) for y in range(h) for x in range(w) if is_eye(x, y)}
    eyes_by_pixel = {}
    remaining = set(eye_pixels)
    while remaining:
        patch = component(next(iter(remaining)), remaining, four=False)
        remaining -= patch
        if len(patch) > MAX_EYE_PIXELS:
            continue
        rim = {q for p in patch for q in neighbours8(*p) if q not in patch}
        if sum(1 for q in rim if q in fur) < len(rim) * 0.5:
            continue
        for p in patch:
            eyes_by_pixel[p] = frozenset(patch)

    creatures = []
    taken = set()
    for anchor in ANCHORS:
        ax, ay = anchor['at']
        if anchor.get('whole'):
            seed = min(fur, key=lambda p: (p[0] - ax) ** 2 + (p[1] - ay) ** 2)
            body = component(seed, fur - taken, four=False)
        else:
            seed = min(core, key=lambda p: (p[0] - ax) ** 2 + (p[1] - ay) ** 2)
            body_core = component(seed, core - taken)
            # grow one pixel back into the fur, for the edge pixels opening removed
            body = {q for p in body_core for q in neighbours8(*p) + [p] if q in fur} - taken
        eyes = set()
        for p in body:
            for q in neighbours8(*p):
                if q in eyes_by_pixel:
                    eyes |= eyes_by_pixel[q]
        if not eyes:
            sys.exit(f'no eyes found for the creature near {(ax, ay)}')
        pixels = body | eyes
        # Anything the creature fully encloses (the green pupils inside the
        # big one's eye rings) travels with it. Flood the box from its rim
        # over non-creature pixels, four-connected; what is left is inside.
        xs = [p[0] for p in pixels]
        ys = [p[1] for p in pixels]
        box = (min(xs), min(ys), max(xs), max(ys))
        x0, y0, x1, y1 = box
        outside = set()
        queue = deque()
        for x in range(x0 - 1, x1 + 2):
            for y in (y0 - 1, y1 + 1):
                outside.add((x, y))
                queue.append((x, y))
        for y in range(y0 - 1, y1 + 2):
            for x in (x0 - 1, x1 + 1):
                outside.add((x, y))
                queue.append((x, y))
        while queue:
            cx, cy = queue.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (cx + dx, cy + dy)
                if x0 - 1 <= q[0] <= x1 + 1 and y0 - 1 <= q[1] <= y1 + 1 \
                        and q not in pixels and q not in outside:
                    outside.add(q)
                    queue.append(q)
        holes = {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)
                 if (x, y) not in pixels and (x, y) not in outside and 0 <= x < w and 0 <= y < h}
        pupils = {p for p in holes if any(q in eyes for q in neighbours8(*p))}
        eyes |= pupils
        pixels |= holes
        taken |= pixels
        creatures.append({'pixels': pixels, 'eyes': eyes, 'box': box})

    creatures.sort(key=lambda c: (c['box'][1], c['box'][0]))

    # ---- the delivered file, at its own grid
    delivered = Image.open(DELIVERED).convert('RGB')
    dw, dh = delivered.size
    if dw % w or dh % h or dw // w != dh // h:
        sys.exit(f'{DELIVERED} ({dw}x{dh}) is not a whole-number enlargement of {SRC} ({w}x{h})')
    factor = dw // w
    dpx = delivered.load()

    def enlarge(points):
        return {(x * factor + dx, y * factor + dy)
                for (x, y) in points for dy in range(factor) for dx in range(factor)}

    all_pixels = set()
    for c in creatures:
        c['pixels'] = enlarge(c['pixels'])
        c['eyes'] = enlarge(c['eyes'])
        all_pixels |= c['pixels']

    def nearest(x, y, avoid, allow=None):
        """The closest pixel outside `avoid` (and inside `allow`, if given)."""
        best = None
        for r in range(1, 12 * factor):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r:
                        continue
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < dw and 0 <= ny < dh) or (nx, ny) in avoid:
                        continue
                    if allow is not None and (nx, ny) not in allow:
                        continue
                    d = dx * dx + dy * dy
                    if best is None or d < best[0]:
                        best = (d, (nx, ny))
            if best is not None:
                return best[1]
        return None

    # ---- the sprites, the blink frames and the patches
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob('creature_*.png'):
        stale.unlink()
    (OUT / 'stage.png').unlink(missing_ok=True)
    out = []
    for index, c in enumerate(creatures, start=1):
        xs = [p[0] for p in c['pixels']]
        ys = [p[1] for p in c['pixels']]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        cw, ch = x1 - x0 + 1, y1 - y0 + 1
        fur_pixels = c['pixels'] - c['eyes']
        sprite = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        blink = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        patch = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        for (x, y) in c['pixels']:
            colour = dpx[x, y] + (255,)
            sprite.putpixel((x - x0, y - y0), colour)
            if (x, y) in c['eyes']:
                # Shut: the eye takes the colour of the nearest fur pixel, so
                # the JPEG's own grain carries on across it.
                source = nearest(x, y, c['eyes'], allow=fur_pixels)
                colour = dpx[source] + (255,) if source is not None else colour
            blink.putpixel((x - x0, y - y0), colour)
            # The meadow under it: the nearest pixel that is not a creature.
            source = nearest(x, y, all_pixels)
            if source is not None:
                patch.putpixel((x - x0, y - y0), dpx[source] + (255,))
        sprite.save(OUT / f'creature_{index}.png', optimize=True)
        blink.save(OUT / f'creature_{index}_blink.png', optimize=True)
        patch.save(OUT / f'creature_{index}_patch.png', optimize=True)
        out.append({
            'id': index, 'x': x0, 'y': y0, 'width': cw, 'height': ch,
            'eyes': len(c['eyes']), 'fur': len(fur_pixels),
            'touchesEdge': x0 == 0 or y0 == 0 or x1 == dw - 1 or y1 == dh - 1,
        })
    (OUT / 'creatures.json').write_text(json.dumps({
        'scene': {'width': dw, 'height': dh, 'artPixel': factor, 'file': DELIVERED.name},
        'creatures': out,
    }, indent=2) + '\n')
    for c in out:
        print(c)
    print(f'{len(out)} creatures, {len(all_pixels)} delivered pixels covered by sprites')


if __name__ == '__main__':
    main()
