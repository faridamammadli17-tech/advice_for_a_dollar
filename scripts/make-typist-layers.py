#!/usr/bin/env python3
"""
Cut the frog at his computer into the layers the home page animates.

    python3 scripts/make-typist-layers.py [SOURCE] [OUT_DIR]

SOURCE defaults to src/pixel/assets/typist_idle_01.png (the delivered 128x128
frame) and OUT_DIR to src/pixel/assets/typist/. Nothing is redrawn: every
layer is the artist's own pixels, split by region and colour, so that CSS can
move the head, the arm and the body by whole pixels (TypingFrog.tsx).

Layers, all on the same 96x68 canvas (the 128 frame cropped to the figure):

    desk.png        the monitor and keyboard, which never move
    body.png        the frog below the neck, minus the arm
    head.png        hat and face, cut at the chin so it can only drop
    head_blink.png  the same with the eye closed
    arm.png         the near arm, hand and cuff over the keyboard
    text.png        lines of "text" on the screen, revealed line by line

Where a moving layer can uncover the layer behind it (the arm lifting off the
body and keyboard), the pixels it would reveal are filled with their nearest
neighbour of the same layer, so a one-pixel move never shows a hole.

Requires Pillow (`pip install --user pillow`).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/pixel/assets/typist_idle_01.png')
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'src/pixel/assets/typist')

# The crop: source pixel (CROP_X, CROP_Y) becomes (0, 0) in every layer.
CROP_X, CROP_Y, CROP_W, CROP_H = 17, 38, 96, 68

# The monitor, its stand and the keyboard, by colour.
DESK = {
    '#fff072', '#654230', '#8a694a', '#ae9f6c', '#f1ebb9', '#978548', '#d2ca8f',
    '#79472c', '#815f39', '#8b6b46', '#b09e6a', '#d5c79e', '#d6c99d',
    # the picture on the screen
    '#054ded', '#1c7ae7', '#27a7f6', '#f9f7f6', '#d4d4d4', '#375b11', '#83c011',
    '#5b9c1a', '#10225e',
}
WHITE_ARM = {'#ffffff', '#b3c3e8', '#8ca2d6', '#f8fff1'}
EYE = '#0c0124'
EYE_HIGHLIGHT = '#ffffff'
FACE = '#37d252'

# The near arm, row by row: everything from the first frog pixel on the row up
# to and including column `right` belongs to the arm (hand on the keys, white
# underside of the forearm, the blue cuff and the dark shading under it).
ARM_RIGHT_EDGE = {74: 69, 75: 71, 76: 73, 77: 78, 78: 81, 79: 82, 80: 78,
                  81: 77, 82: 77, 83: 80, 84: 79, 85: 77}
ARM_LEFT_LIMIT = 60
HEAD_BOTTOM_ROW = 75          # the chin; row 76 is the neck shadow, body
EYE_BOX = (77, 65, 86, 74)    # x0, y0, x1, y1 inclusive, around the eye

# "Text" on the screen: (row, [(x, length), ...]) in source pixels. Dark on the
# sky, white on the hill; word-shaped runs with one-pixel gaps.
SKY_INK, HILL_INK = '#0c0124', '#f9f7f6'
TEXT_LINES = [
    (54, SKY_INK, [(42, 3), (46, 2), (49, 4)]),
    (56, SKY_INK, [(42, 2), (45, 4), (50, 3), (54, 2)]),
    (58, SKY_INK, [(42, 4), (47, 3)]),
    (60, SKY_INK, [(42, 3), (46, 3), (50, 2), (53, 3)]),
    (64, HILL_INK, [(42, 2), (45, 3), (49, 4)]),
    (66, HILL_INK, [(42, 4), (47, 2), (50, 3), (54, 2)]),
    (68, HILL_INK, [(42, 3), (46, 2)]),
]


def hexof(p):
    return '#%02x%02x%02x' % p[:3]


def main() -> None:
    src = Image.open(SRC).convert('RGBA')
    if src.size != (128, 128):
        sys.exit(f'expected a 128x128 frame, got {src.size}')
    w, h = src.size
    px = src.load()

    def solid(x, y):
        return 0 <= x < w and 0 <= y < h and px[x, y][3] >= 128

    # ---- classify every solid pixel: desk / arm / head / body
    cls = {}
    for y in range(h):
        first_frog = None
        for x in range(w):
            if not solid(x, y):
                continue
            c = hexof(px[x, y])
            if c in DESK or x < ARM_LEFT_LIMIT:
                # Left of the frog there is only the computer (the yellow
                # star on the screen is the same yellow as his hat's).
                cls[x, y] = 'desk'
                continue
            if first_frog is None and x >= ARM_LEFT_LIMIT:
                first_frog = x
            if y in ARM_RIGHT_EDGE and first_frog is not None and x <= ARM_RIGHT_EDGE[y]:
                cls[x, y] = 'arm'
            elif y <= HEAD_BOTTOM_ROW:
                cls[x, y] = 'head'
            else:
                cls[x, y] = 'body'

    layers = {name: Image.new('RGBA', (w, h), (0, 0, 0, 0)) for name in ('desk', 'body', 'head', 'arm')}
    for (x, y), name in cls.items():
        layers[name].putpixel((x, y), px[x, y])

    # ---- fill what the arm would reveal when it lifts or reaches
    filled = 0
    for (x, y), name in cls.items():
        if name != 'arm':
            continue
        best = None
        for r in range(1, 9):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r:
                        continue
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    other = cls.get((nx, ny))
                    if other == 'arm':
                        continue
                    d = dx * dx + dy * dy
                    if best is None or d < best[0]:
                        best = (d, other, (nx, ny))
            if best is not None:
                break
        if best is None or best[1] is None:
            continue  # nearest thing behind the arm is empty space
        _, other, (nx, ny) = best
        layers[other].putpixel((x, y), px[nx, ny])
        filled += 1

    # ---- the blink: eye pixels become face, the lowest one in each column a lid
    blink = layers['head'].copy()
    eye_cols = {}
    x0, y0, x1, y1 = EYE_BOX
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if cls.get((x, y)) != 'head':
                continue
            c = hexof(px[x, y])
            if c == EYE or c == EYE_HIGHLIGHT:
                eye_cols.setdefault(x, []).append(y)
    face = tuple(int(FACE[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    lid = tuple(int(EYE[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    for x, ys in eye_cols.items():
        for y in ys:
            blink.putpixel((x, y), face)
        blink.putpixel((x, max(ys)), lid)
    layers['head_blink'] = blink

    # ---- the text on the screen
    text = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    lines_out = []
    for row, ink, runs in TEXT_LINES:
        rgba = tuple(int(ink[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for x, n in runs:
            for i in range(n):
                text.putpixel((x + i, row), rgba)
        start = runs[0][0]
        end = runs[-1][0] + runs[-1][1]  # exclusive
        lines_out.append({'y': row - CROP_Y, 'x': start - CROP_X, 'width': end - start})
    layers['text'] = text

    # ---- crop and save
    OUT.mkdir(parents=True, exist_ok=True)
    box = (CROP_X, CROP_Y, CROP_X + CROP_W, CROP_Y + CROP_H)
    for name, im in layers.items():
        im.crop(box).save(OUT / f'{name}.png', optimize=True)
    meta = {
        'canvas': {'width': CROP_W, 'height': CROP_H},
        'source': {'file': SRC.name, 'cropX': CROP_X, 'cropY': CROP_Y},
        'lines': lines_out,
        'eyeCount': len(eye_cols),
        'filledBehindArm': filled,
    }
    (OUT / 'layers.json').write_text(json.dumps(meta, indent=2) + '\n')
    counts = {}
    for name in cls.values():
        counts[name] = counts.get(name, 0) + 1
    print('pixels per layer:', counts, '| filled behind arm:', filled, '| eye columns:', len(eye_cols))
    print('text lines (cropped coords):', lines_out)


if __name__ == '__main__':
    main()
