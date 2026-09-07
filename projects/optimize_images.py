#!/usr/bin/env python3
"""
Portfolio image optimizer.

What it does:
  - Walks through a folder of images (default: ./Images)
  - Resizes anything wider than MAX_WIDTH down to MAX_WIDTH (keeps aspect ratio)
  - Re-saves as compressed JPEG (quality=QUALITY) into an "optimized/" subfolder,
    preserving the original filenames — so you can literally swap the folder in
    and every <img src="Images/Foo.jpg"> keeps working with no HTML changes.
  - Optionally also writes a .webp copy next to it (same name, .webp extension)
    for browsers that support it, if you want to go further later with <picture>.
  - Prints a before/after size report so you can see the savings.

Usage:
    pip install Pillow --break-system-packages
    python3 optimize_images.py                # uses ./Images -> ./Images/optimized
    python3 optimize_images.py /path/to/Images
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install it with:\n  pip install Pillow --break-system-packages")
    sys.exit(1)

MAX_WIDTH = 1800      # px — plenty for full-bleed sections on any screen
THUMB_MAX_WIDTH = 900 # px — use this manually for small gallery thumbs if you want to go further
QUALITY = 78           # JPEG/WebP quality, 0-100. 75-82 is a good invisible-loss range
ALSO_WRITE_WEBP = True
VALID_EXT = {".jpg", ".jpeg", ".png"}


def human(n):
    for unit in ["B", "KB", "MB"]:
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}GB"


def optimize_folder(src_dir: Path):
    out_dir = src_dir / "optimized"
    out_dir.mkdir(exist_ok=True)

    total_before = 0
    total_after = 0
    count = 0

    for f in sorted(src_dir.iterdir()):
        if f.suffix.lower() not in VALID_EXT or not f.is_file():
            continue

        before_size = f.stat().st_size
        total_before += before_size

        img = Image.open(f)
        # Flatten transparency onto white if PNG w/ alpha, since we're saving as JPEG
        if img.mode in ("RGBA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[-1])
            img = bg
        else:
            img = img.convert("RGB")

        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)

        out_path = out_dir / (f.stem + ".jpg")
        img.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        after_size = out_path.stat().st_size
        total_after += after_size
        count += 1

        if ALSO_WRITE_WEBP:
            webp_path = out_dir / (f.stem + ".webp")
            img.save(webp_path, "WEBP", quality=QUALITY, method=6)

        saved_pct = 100 * (1 - after_size / before_size) if before_size else 0
        print(f"{f.name:35s} {human(before_size):>9s} -> {human(after_size):>9s}  ({saved_pct:5.1f}% smaller)")

    print("-" * 70)
    print(f"{count} images processed")
    print(f"Total: {human(total_before)} -> {human(total_after)}  "
          f"({100 * (1 - total_after / total_before):.1f}% smaller)" if total_before else "No images found")
    print(f"\nOptimized files are in: {out_dir}")
    print("Once you're happy with them, replace the contents of your Images/ folder")
    print("with these (same filenames = no HTML changes needed).")


if __name__ == "__main__":
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("Images")
    if not folder.exists():
        print(f"Folder not found: {folder}\nRun this script from your project root, "
              f"or pass the path: python3 optimize_images.py /path/to/Images")
        sys.exit(1)
    optimize_folder(folder)
