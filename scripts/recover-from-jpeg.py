"""
Recover pixel art from an enlarged JPEG (or any enlarged image).

`downscale-art.py` is the lossless tool: it refuses unless every block is
perfectly uniform, which a JPEG never is. This one is for the next-best case,
where the art was enlarged by a whole number and THEN saved as a JPEG. Each
block of NxN pixels still holds one original pixel plus compression noise, and
the most common colour in the block is almost always the original. That is
what this samples.

    python3 scripts/recover-from-jpeg.py <input> <output.png> <factor> [options]

    --lift-white      make the white background transparent (only white
                      connected to the picture's edge; highlights inside the
                      drawing are kept)
    --colours N       tidy the palette down to N colours (no dithering). Use
                      for a scene with JPEG noise left over; skip it for a
                      character, where it can merge real colours
    --preview PATH    also write a 4x nearest-neighbour preview to look at

Needs Pillow:  python3 -m pip install pillow

Recorded uses (2026-10-04):
    forest scene   960x558 JPEG, factor 2,  --colours 40           -> forest_day.png
    standing bunny 1920x1920 JPEG, factor 15, --lift-white         -> bunny_idle_01.png
    (the portrait was a lossless 15x PNG and went through downscale-art.py)

Always run `npm run art:check` on the result and look at it at 4x before
registering it. A recovered file is a reconstruction, and a clean PNG export
from the artist is still better.
"""
import argparse
import sys
from collections import Counter

try:
    from PIL import Image
except ImportError:  # pragma: no cover - a message, not a stack trace
    sys.exit("This tool needs Pillow:  python3 -m pip install pillow")


def block_mode_downscale(image, factor):
    image = image.convert("RGBA")
    width, height = image.size
    source = image.load()
    out = Image.new("RGBA", (width // factor, height // factor))
    target = out.load()
    for by in range(height // factor):
        for bx in range(width // factor):
            counts = Counter()
            for dy in range(factor):
                for dx in range(factor):
                    counts[source[bx * factor + dx, by * factor + dy]] += 1
            target[bx, by] = counts.most_common(1)[0][0]
    return out


def lift_white(image, threshold=228):
    """Transparent background: white-ish pixels reachable from the border."""
    width, height = image.size
    pixels = image.load()
    stack = [(x, y) for x in range(width) for y in (0, height - 1)]
    stack += [(x, y) for y in range(height) for x in (0, width - 1)]
    seen = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        seen.add((x, y))
        r, g, b, _a = pixels[x, y]
        if min(r, g, b) < threshold:
            continue
        pixels[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return image


def tidy_palette(image, colours):
    alpha = image.getchannel("A")
    quantized = image.convert("RGB").quantize(
        colors=colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    result = quantized.convert("RGB")
    result.putalpha(alpha)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("factor", type=int)
    parser.add_argument("--lift-white", action="store_true")
    parser.add_argument("--colours", type=int)
    parser.add_argument("--preview")
    args = parser.parse_args()

    image = Image.open(args.input)
    if image.size[0] % args.factor or image.size[1] % args.factor:
        sys.exit(f"{image.size[0]}x{image.size[1]} is not a whole multiple of {args.factor}.")

    result = block_mode_downscale(image, args.factor)
    if args.lift_white:
        result = lift_white(result)
    if args.colours:
        result = tidy_palette(result, args.colours)

    result.save(args.output)
    print(f"wrote {args.output}: {result.size[0]}x{result.size[1]}, {len(result.getcolors(1 << 20) or [])} colours")
    if args.preview:
        result.resize((result.size[0] * 4, result.size[1] * 4), Image.Resampling.NEAREST).save(args.preview)
        print(f"preview at 4x: {args.preview}")


if __name__ == "__main__":
    main()
