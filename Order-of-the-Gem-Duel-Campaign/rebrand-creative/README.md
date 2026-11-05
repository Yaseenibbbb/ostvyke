# Order of the Gem — The Duel campaign

A more ambitious creative direction made entirely from the supplied art library. No AI-generated artwork, new character painting, recoloring or replacement wordmark is used.

## Creative direction

The campaign treats matching as a duel: the original silver knight faces the Gatekeeper, with the original silver logo between them and the actual game gems in the foreground. The card panels use a fan of the original card backs and the captured Purifying Flame card; the spell panel enlarges the exact spell images seen in the supplied menu. Each screenshot has its own composition and story rather than a shared header template.

## Files

- `store/feature-graphic-1024x500.png`: the main duel composition, RGB PNG.
- `store/app-icon-512.png`: knight and large foreground gems, 512 × 512 RGBA PNG.
- `brand/`: alternate duel and emerald icon compositions.
- `store/screenshots/`: six 1080 × 1920 RGB promotional screenshots. Their UI excerpts come from supplied captured gameplay and menus.
- `social/`: square, story and landscape campaign graphics.
- `game/`: portrait splash artwork.
- `editable/`: self-contained SVG exports with embedded image layers, plus layer JSON files.
- `derived/`: crops and cutouts made from the supplied gameplay, including gemstones, spell images and a displayed card. Only the promotional card fan is rotated; the gameplay excerpts remain upright.
- `source-provenance.json`: the actual original source files used.
- `asset-manifest.json`: screenshot descriptions and capture sources.

The Gatekeeper cutout is the supplied `AvatarIcons_vol3/No_bg/Elf_01_nobg.png`, matched against the named Gatekeeper portrait. Characters and game art retain their original paintwork. Small original avatar images are enlarged for promotional compositions, so their source resolution limits sharpness.

`build_creative.py` rebuilds the compositions using Pillow and numpy, the original asset folders, the previously extracted original gems, and the layout class in `rebrand-assets-only/build_assets_only.py`. No source artwork is overwritten. SVGs are self-contained; rebuilding from code requires the original workspace. Text uses the original Georgia font.

This package contains promotional artwork. It does not change the game build or publish anything to Google Play. The game UI is taken from the provided captures; confirm it matches the release being advertised.
