"""
Make a closed-eye frame from an open-eye sprite, for the blink.

The home page blinks by layering a closed-eye PNG over the open one for a
moment every few seconds (src/components/Bunny.tsx). This script draws that
closed frame: inside each lens it paints the eye over with the glass colour,
then draws a one-pixel lid with the ends lifted, so the eyes read as calmly
shut rather than struck through.

    python3 scripts/make-blink-frames.py standing
    python3 scripts/make-blink-frames.py portrait

Each preset names the exact colours of the delivered art, so when the artist
sends a new version, look at the pixels (any image editor's colour picker)
and update the preset rather than guessing. The two eyes are told apart by a
column that splits them; `rows` bounds the search so nothing else that
happens to share an eye colour (a button, a flower) is touched.

Needs Pillow:  python3 -m pip install pillow
"""
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("This tool needs Pillow:  python3 -m pip install pillow")

ASSETS = "src/pixel/assets"

PRESETS = {
    "standing": {
        "open": f"{ASSETS}/bunny_idle_01.png",
        "closed": f"{ASSETS}/bunny_blink_01.png",
        "iris": ["#687690", "#6a768e", "#8f8f8f", "#8f8f91", "#d2daef", "#ffffff"],
        "highlights": [],
        "glass": "#d8cccc",
        "lid": "#504d60",
        "rows": (39, 49),
        "split": 61,
        "lid_at": 0.5,
    },
    "portrait": {
        "open": f"{ASSETS}/bunny_portrait_01.png",
        "closed": f"{ASSETS}/bunny_portrait_blink_01.png",
        "iris": ["#131e36", "#434343", "#7c7c7c", "#000000"],
        "highlights": [
            "#f9f9f9", "#f9d495", "#f9d9a0", "#f9d698",
            "#f9cf8a", "#f9cc83", "#f9d291", "#f9ce89",
        ],
        "glass": "#f8c978",
        "lid": "#41355f",
        "rows": (70, 94),
        "split": 58,
        "lid_at": 0.55,
    },
}


def rgba(hex_colour):
    return tuple(int(hex_colour[i : i + 2], 16) for i in (1, 3, 5)) + (255,)


def make_blink(preset):
    image = Image.open(preset["open"]).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    iris = {rgba(c) for c in preset["iris"]}
    highlights = {rgba(c) for c in preset["highlights"]}
    glass = rgba(preset["glass"])
    lid = rgba(preset["lid"])
    shadow = tuple(max(0, channel - 28) for channel in glass[:3]) + (255,)
    row_start, row_end = preset["rows"]

    for side, columns in (("left", range(0, preset["split"])), ("right", range(preset["split"], width))):
        eye = [(x, y) for y in range(row_start, row_end) for x in columns if pixels[x, y] in iris]
        if not eye:
            sys.exit(f"{side} eye: no pixels in the iris colours between rows {row_start} and {row_end}")
        x0, x1 = min(p[0] for p in eye), max(p[0] for p in eye)
        y0, y1 = min(p[1] for p in eye), max(p[1] for p in eye)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if pixels[x, y] in iris or pixels[x, y] in highlights:
                    pixels[x, y] = glass
        lid_row = y0 + round((y1 - y0) * preset["lid_at"])
        for x in range(x0 + 1, x1):
            y = lid_row - (1 if x in (x0 + 1, x1 - 1) else 0)
            pixels[x, y] = lid
            if y + 1 < height and pixels[x, y + 1] == glass:
                pixels[x, y + 1] = shadow
        print(f"{side} eye: columns {x0}-{x1}, rows {y0}-{y1}, lid on row {lid_row}")

    image.save(preset["closed"])
    print(f"wrote {preset['closed']}")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in PRESETS:
        sys.exit(f"usage: python3 scripts/make-blink-frames.py <{'|'.join(PRESETS)}>")
    make_blink(PRESETS[sys.argv[1]])
