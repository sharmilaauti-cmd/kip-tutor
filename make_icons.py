from PIL import Image, ImageDraw, ImageFont
import os

TEAL = (13, 122, 100)
TEAL_DARK = (9, 84, 69)
CREAM = (250, 249, 246)

def rounded_square_icon(size, corner_ratio=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * corner_ratio)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=TEAL)

    # subtle darker bottom-right shadow shape for depth (flat, no blur)
    draw.rounded_rectangle(
        [size * 0.10, size * 0.14, size * 0.90, size * 0.90],
        radius=int(size * 0.14), fill=None, outline=None
    )

    # Draw a simple friendly "K" mark, slightly rounded strokes
    stroke = max(2, int(size * 0.09))
    pad = size * 0.30
    x0, y0 = pad, size * 0.20
    x1, y1 = pad, size * 0.80
    # vertical stroke of K
    draw.line([x0, y0, x1, y1], fill=CREAM, width=stroke, joint="curve")
    mid_y = (y0 + y1) / 2
    # upper diagonal
    draw.line([x0, mid_y, size * 0.72, size * 0.20], fill=CREAM, width=stroke, joint="curve")
    # lower diagonal
    draw.line([x0, mid_y, size * 0.72, size * 0.80], fill=CREAM, width=stroke, joint="curve")

    # rounded end caps (draw circles at line ends to fake rounded stroke caps)
    for (px, py) in [(x0, y0), (x0, y1), (size*0.72, size*0.20), (size*0.72, size*0.80), (x0, mid_y)]:
        r = stroke / 2
        draw.ellipse([px - r, py - r, px + r, py + r], fill=CREAM)

    return img

os.makedirs("/home/claude/kip-app/icons", exist_ok=True)
for size in [192, 512, 180, 32, 16]:
    icon = rounded_square_icon(size)
    icon.save(f"/home/claude/kip-app/icons/icon-{size}.png")

print("Icons generated")
