# Order of the Gem — main menu redesign

Open `index.html` to try the menu. Select Play, Spells, Cards or the leaderboard to view the destination captures. Tap the profile to edit the displayed name, or open Settings to try independent music and sound toggles. Escape returns to the menu.

## Design

The knight is the focal point of the menu. The existing silver title is smaller and sits above the hero scene. Play is the single primary action. Spells and Cards use side-by-side illustrated tiles; the leaderboard is a separate Crypt of Knights panel. A compact profile bar groups the avatar, name, rank and existing counter. Small audio controls replace the two large floating icons.

The painted illustrations, logo, metal frames, red button, gems, spell art, card art and crests come from your asset folders. The full-resolution knight is `GothicUI2/GothicUI2/Characters/Character_Knight.png`. New utility assets are a grounding shadow, vignette, subdued sigil and smoke layers, and sliced panels. No AI-generated illustration was used.

## Deliverables

- `exports/main-menu-1080x2340.png`: full-resolution menu design, matching the tall portrait proportions of the supplied screenshot.
- `exports/main-menu-preview.png`: smaller 540 × 1170 preview.
- `review/before-after.png`: comparison with the supplied current menu.
- `index.html`: responsive clickable prototype with keyboard focus, modal dismissal, profile editing, and independent persisted audio toggle states.
- `assets/`: the original source art used in the menu, exported panels, ambient layers, button states and destination captures.
- `editable/main-menu-1080x2340.svg`: editable layout with embedded image sources.
- `editable/main-menu-1080x2340.layers.json`: each layer's placement and source.
- `menu-layout.json`: canvas dimensions, action rectangles and source inventory.
- `build_menu.py`: reproducible layout script, using Pillow and numpy and the source-only layout engine in the existing workspace.

## Implementation notes

Use a 1080 × 2340 reference canvas with proportional width scaling. Add device safe-area offsets around the profile and footer; the main content should scroll on shorter screens rather than shrink the tap targets. Keep Play, Spells, Cards and Crypt as separate buttons. The existing counter is retained without assigning it a new currency meaning.

For Unity, use the exported art as separate Image components and real text components for labels. Use Sliced Images for the panels; `navigation-tile.png`, `profile-panel.png` and `crypt-panel.png` are prepared at reference size. The JSON provides placement, while the SVG is the visual layout source. Use the original Georgia typeface from the project with an appropriate licensed font asset.

The prototype is a review artifact, not an integrated game build. Destination screens are previews from the supplied captures, and audio toggles demonstrate state without playing sound. No Unity project or APK was present in this workspace, so the running game has not been modified.
