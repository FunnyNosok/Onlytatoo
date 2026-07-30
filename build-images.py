# -*- coding: utf-8 -*-
"""Готовит изображения для сайта: сжимает в WebP в двух размерах и даёт осмысленные имена."""
import os
from PIL import Image, ImageOps

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site", "img")

# исходник -> итоговое имя
RENAME = {
    # работы
    "photo_002.jpg": "work-koi",
    "photo_003.jpg": "work-chicano",
    "photo_004.jpg": "work-angel",
    "photo_005.jpg": "work-viking",
    "photo_009.jpg": "work-snake",
    "photo_010.jpg": "work-statue",
    "photo_016.jpg": "work-botanical",
    "photo_017.jpg": "work-cyber",
    "photo_018.jpg": "work-amor",
    "photo_019.jpg": "work-iris",
    "photo_020.jpg": "work-venom",
    "photo_021.jpg": "work-jaw",
    # студия
    "photo_006.jpg": "studio-process",
    "photo_007.jpg": "studio-sign",
    "photo_012.jpg": "studio-interior",
    "photo_022.jpg": "studio-door",
    "photo_023.jpg": "studio-entrance",
    # команда и события
    "photo_013.jpg": "team-event",
    "photo_014.jpg": "team-masters",
    "photo_015.jpg": "team-fest",
}

WIDE = 1400   # для лайтбокса
GRID = 700    # для плиток галереи

# обрезка в долях от высоты/ширины: (сверху, справа, снизу, слева)
# photo_010 — скриншот телефона: убираем строку состояния и панель снизу
CROP = {
    "photo_010.jpg": (0.038, 0.0, 0.105, 0.0),
}


def save_webp(img, path, quality):
    img.save(path, "WEBP", quality=quality, method=6)


def fit_width(img, width):
    if img.width <= width:
        return img.copy()
    height = round(img.height * width / img.width)
    return img.resize((width, height), Image.LANCZOS)


def main():
    os.makedirs(DST, exist_ok=True)
    total_src = total_dst = 0

    for src_name, out_name in sorted(RENAME.items()):
        src_path = os.path.join(SRC, src_name)
        if not os.path.exists(src_path):
            print("ПРОПУЩЕН (нет файла):", src_name)
            continue
        total_src += os.path.getsize(src_path)

        with Image.open(src_path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            if src_name in CROP:
                top, right, bottom, left = CROP[src_name]
                im = im.crop((round(im.width * left), round(im.height * top),
                              im.width - round(im.width * right),
                              im.height - round(im.height * bottom)))
            wide_path = os.path.join(DST, out_name + ".webp")
            grid_path = os.path.join(DST, out_name + "-sm.webp")
            save_webp(fit_width(im, WIDE), wide_path, 82)
            save_webp(fit_width(im, GRID), grid_path, 78)
            total_dst += os.path.getsize(wide_path) + os.path.getsize(grid_path)
            print("%-16s %sx%s -> %s + %s" % (out_name, im.width, im.height,
                                              os.path.basename(wide_path),
                                              os.path.basename(grid_path)))

    # логотип: иконки и og-изображение на чёрном фоне
    logo_src = os.path.join(SRC, "photo_011.jpg")
    if os.path.exists(logo_src):
        with Image.open(logo_src) as logo:
            logo = ImageOps.exif_transpose(logo).convert("RGB")
            logo.resize((512, 512), Image.LANCZOS).save(
                os.path.join(DST, "logo.png"), "PNG", optimize=True)
            logo.resize((180, 180), Image.LANCZOS).save(
                os.path.join(DST, "apple-touch-icon.png"), "PNG", optimize=True)
            logo.resize((64, 64), Image.LANCZOS).save(
                os.path.join(DST, "favicon.png"), "PNG", optimize=True)

            og = Image.new("RGB", (1200, 630), (8, 8, 9))
            mark = fit_width(logo, 620)
            og.paste(mark, ((1200 - mark.width) // 2, (630 - mark.height) // 2))
            og.save(os.path.join(DST, "og.jpg"), "JPEG", quality=88, optimize=True)
            print("logo.png, apple-touch-icon.png, favicon.png, og.jpg — готовы")

    print("\nБыло: %.1f МБ  ->  стало: %.1f МБ" % (total_src / 1048576, total_dst / 1048576))


if __name__ == "__main__":
    main()
