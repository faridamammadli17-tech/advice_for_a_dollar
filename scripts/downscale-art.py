"""
Recover native pixel art from a clean integer upscale.

Some tools export pixel art already enlarged by a whole-number factor with
nearest-neighbour scaling. That is lossless: every NxN block holds exactly one
original pixel, so sampling one pixel per block restores the original file
byte-for-byte.

This detects the factor by testing which ones leave every block uniform, then
writes the recovered image. It refuses rather than guessing if no factor works,
because a non-uniform block means the image was smooth-scaled and the original
pixels are genuinely gone.

    python3 scripts/downscale-art.py <input.png> <output.png>
"""
import struct, sys, zlib


def read_png(path):
    data = open(path, "rb").read()
    pos, idat, w, h, ct = 8, b"", None, None, None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, _bd, ct = struct.unpack(">IIBB", chunk[:10])
        elif typ == b"IDAT":
            idat += chunk
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    stride = w * ch
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i + stride]); i += stride
        for x in range(stride):
            a = line[x - ch] if x >= ch else 0
            b = prev[x]
            c = prev[x - ch] if x >= ch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        rows.append(bytes(line)); prev = line
    return w, h, ch, rows


def write_png(path, w, h, ch, rows):
    ct = {1: 0, 2: 4, 3: 2, 4: 6}[ch]
    raw = b"".join(b"\x00" + r for r in rows)          # filter 0, every row
    def chunk(tag, payload):
        return (struct.pack(">I", len(payload)) + tag + payload
                + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF))
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, ct, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)


def blocks_uniform(rows, w, h, ch, f):
    """Every pixel inside each fxf block must be identical."""
    for by in range(h // f):
        for bx in range(w // f):
            base = rows[by * f][bx * f * ch:bx * f * ch + ch]
            for dy in range(f):
                r = rows[by * f + dy]
                for dx in range(f):
                    o = (bx * f + dx) * ch
                    if r[o:o + ch] != base:
                        return False
    return True


def main():
    src, dst = sys.argv[1], sys.argv[2]
    w, h, ch, rows = read_png(src)
    print(f"  source: {w}x{h}, {ch} channels")

    factor = None
    for f in range(min(w, h) // 8, 1, -1):
        if w % f or h % f:
            continue
        if blocks_uniform(rows, w, h, ch, f):
            factor = f
            break

    if factor is None:
        print("  no clean integer factor — this image was smooth-scaled.")
        print("  The original pixels are gone and cannot be recovered.")
        sys.exit(1)

    nw, nh = w // factor, h // factor
    out = []
    for by in range(nh):
        r = rows[by * factor]
        line = bytearray()
        for bx in range(nw):
            o = bx * factor * ch
            line += r[o:o + ch]
        out.append(bytes(line))

    write_png(dst, nw, nh, ch, out)
    colors = {px for r in out for px in (r[i:i + ch] for i in range(0, len(r), ch))}
    print(f"  clean {factor}x upscale detected — recovered losslessly")
    print(f"  wrote:  {dst}  {nw}x{nh}, {len(colors)} colours")


main()
