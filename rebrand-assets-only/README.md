# Order of the Gem — existing-art store refresh

This is the revised deliverable. Every illustration, character, logo, gemstone, background and ornamental frame comes from the supplied folders. No generated artwork, new illustration style, new wordmark, recoloring or invented game UI is used.

Open `index.html` for the visual gallery. `review/overview.png` shows the kit together.

## Deliverables

- `store/app-icon-512.png`: original framed knight with gems extracted from the supplied board. 512 × 512 RGBA PNG. The unchanged knight icon is also included as an alternative.
- `store/feature-graphic-1024x500.png`: existing title art, original knight icon, game gems, stone background and GothicUI frame. 1024 × 500 RGB PNG.
- `store/screenshots/`: six 1080 × 1920 RGB PNGs, numbered in upload order. First three show gameplay; the remainder show cards, spells and the leaderboard.
- `brand/existing-logo-trimmed.png`: your existing logo with unused transparent margins removed. The artwork itself is unchanged.
- `game/splash-1080x1920.png`: existing title, knight and Ostvyke logo arranged on the original background.
- `game/launcher/`: raster icon sizes from 48 to 1024 pixels. These are legacy raster exports, not Android adaptive foreground/background resources.
- `social/`: 1920 × 1080 landscape, 1080 × 1080 square, and 1080 × 1920 story artwork, using the same supplied art.
- `editable/`: self-contained SVG compositions and layer JSON files with source paths, crop coordinates, positions, sizes and text.
- `derived/`: original gameplay gemstones isolated from the screenshot; no replacement gemstones were drawn.
- `source-provenance.json`: the exact assets used and gemstone extraction coordinates.
- `source-library-inventory.csv`: inventory of the original art library, excluding Unity .meta files.
- `asset-manifest.json`: screenshot dimensions, source captures and suggested alt text.

## What was changed

The refresh changes composition, crop, caption length and export sizes. It preserves the game's silver embossed logo, existing knight painting, charcoal/brown backgrounds, original gold Georgia lettering, gem colors, ornate metal UI and portrait illustrations. The screenshots use cropped excerpts of the supplied captures, with the previous promotional caption panels excluded.

The source library was reviewed and inventoried. Relevant artwork was selected for each composition; thousands of unrelated inventory icons are not packed into the store graphics.

## Editing and rebuilding

Run `python rebrand-assets-only/build_assets_only.py` from the original workspace. Requires Pillow and numpy. The script reads the original source folders and does not overwrite them. SVG images are embedded, so a designer can open each SVG without locating linked image files. Editable text uses Georgia; the bundled original Georgia font is referenced by the build script. No font files are redistributed.

This is an artwork kit, not a modified game build. No Unity project, APK, or Play Console listing has been changed. Before upload, compare the supplied captured UI to the version being released.

## Export reference

Google Play specifications checked against [Google Play preview asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en): icon 512 × 512 PNG under 1 MB; feature graphic 1024 × 500 without transparency; screenshots exported at 1080 × 1920 without transparency.

The earlier `rebrand` folder is the rejected visual direction. This `rebrand-assets-only` folder supersedes it and does not use its generated art.
