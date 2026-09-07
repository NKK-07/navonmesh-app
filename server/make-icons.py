# Draws the NAVONMESH app and notification icons.
#
# The manifest used to carry an inline SVG with an emoji in it, in the old
# green. Emoji render from the device font, which is exactly the problem we
# removed from the rest of the app, and a notification icon has to be a real
# raster on Android. So these are drawn: the brand mark, in the warm ink and
# the brand green, as PNG.
#
# Run from the repo root:  python server/make-icons.py

from PIL import Image, ImageDraw
import os

INK = (36, 31, 27, 255)        # --text-dark, the warm brown black
GREEN = (4, 120, 92, 255)      # --agri-green
PAPER = (247, 244, 239, 255)   # --bg-main

OUT = os.path.join(os.path.dirname(__file__), '..', 'app')


def mark(size, bg, fg, accent, pad_ratio=0.22):
    """The NAVONMESH mark: a circle beside a six point asterisk."""
    s = size * 4  # draw big, downsample, so the strokes stay clean
    img = Image.new('RGBA', (s, s), bg)
    d = ImageDraw.Draw(img)

    pad = int(s * pad_ratio)
    box = s - pad * 2
    w = max(2, int(s * 0.035))

    # circle, left
    cr = box * 0.20
    cx = pad + box * 0.26
    cy = s / 2
    d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], outline=accent, width=w)

    # asterisk, right
    ax = pad + box * 0.72
    ar = box * 0.30
    d.line([ax, cy - ar, ax, cy + ar], fill=fg, width=w)
    for dx, dy in ((0.866, 0.5), (0.866, -0.5)):
        d.line([ax - ar * dx, cy - ar * dy, ax + ar * dx, cy + ar * dy],
               fill=fg, width=w)

    return img.resize((size, size), Image.LANCZOS)


def rounded(img, radius_ratio=0.22):
    size = img.size[0]
    m = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, size * 4 - 1, size * 4 - 1],
        radius=int(size * 4 * radius_ratio), fill=255)
    img.putalpha(m.resize((size, size), Image.LANCZOS))
    return img


def save(img, name):
    path = os.path.abspath(os.path.join(OUT, name))
    img.save(path, 'PNG', optimize=True)
    print('wrote', os.path.relpath(path, os.path.join(OUT, '..')),
          str(os.path.getsize(path)) + ' bytes')


# App icons: the mark on the warm ink, rounded like an installed app.
for size in (192, 512):
    save(rounded(mark(size, INK, PAPER, GREEN)), 'icon-%d.png' % size)

# Maskable: same mark with far more padding, so Android can crop it to any
# shape without clipping the artwork.
save(mark(512, INK, PAPER, GREEN, pad_ratio=0.30), 'icon-maskable-512.png')

# Notification badge: Android renders this as a silhouette in the status bar,
# so it must be one flat shape on transparency. Colour is ignored, alpha is not.
save(mark(96, (0, 0, 0, 0), (255, 255, 255, 255), (255, 255, 255, 255)),
     'icon-badge.png')
