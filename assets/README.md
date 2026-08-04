# assets/ — arte-fonte

Drop the pixel-art PNGs here, one file per sprite, in the folders below. A build step inlines
every file into `index.html` as a base64 data URI, so at runtime the game stays a single
offline HTML file — these are **source** assets, like `test/`, never loaded over the network.

## The five rules a file must obey (a file that breaks any of these cannot be used)

1. **True pixel art at native 1×.** Hard edges, NO anti-aliasing, NO gradients, NO blur. Deliver
   the small file (e.g. a 48×64 hero), never an upscaled preview. Zoom in and confirm edges are
   solid single-color steps with no halo pixels.
2. **Transparent background** (real alpha). No baked ground/drop shadows — the game lights the
   scene itself. A contact shadow, if needed, is its own file (`hero/hero_shadow.png`).
3. **One shared palette** across the whole pack, listed in `palette.json`. Every pixel of every
   file uses only those colors.
4. **One light direction:** sun up and to the RIGHT. Lit edge top-right, shade lower-left.
5. **Animations are horizontal strips:** frames left-to-right, all the same frame size, zero
   padding, all sharing one baseline. Characters face RIGHT and are feet-anchored (feet on the
   bottom edge of the canvas).

## Folders and files (target sizes; report the ACTUAL size in manifest.json)

- `hero/` — hero_idle, hero_walk, hero_attack1, hero_attack2, hero_special (horizontal strips,
  ~48×64 per frame); hero_front, hero_side, hero_back (single); hero_shadow.
- `staff/` — staff.png (~16×48).
- `magic/` — bolt_basic (~16×16 strip), cast_ring (strip), sparkle (~8×8 strip). Warm gold + green.
- `monsters/` — smog_idle/smog_block/smog_die, drum_*, moneybag_* (~24×28, 2–3 frames each,
  facing LEFT toward the hero, feet-anchored). Abstractions only — never real people or brands.
- `npcs/` — npc_woman_apron, npc_oldman_hat, npc_kid, npc_grandma, npc_man_cap, npc_wheelchair,
  dog (4-frame walk), bird. Feet-anchored, ~44–56px tall, gentle 2-frame idle.
- `drops/` — drop_flower, drop_water, drop_meal (~16×16 square).
- `items/` — seed, wateringcan, lantern, letter, clay, book, flower, potion, tool, meal, memory,
  crystal (~16×16 each).
- `ui_icons/` — leaf, crystal, community, shop, moneybag, map, gear (~16×16 each).
- `expressions/` — neutral, happy, surprised, sad, love, music, confused (~16×16 face each).
- `tiles/` — cobble_*, dirt_*, tiled_floor_*, wood_*, water_* — SEAMLESS, tileable, 16×16, a few
  variants per surface; water may be a 2–3 frame strip.
- `decor/` — bench, lamppost, potted_plant, planter, chair, washing_line, trash_can, bunting.
  Feet-anchored, transparent.
- `scenarios/` — SEVEN places: rua_do_bairro, praca_comunitaria, orla, mata_atlantica, cerrado,
  vila_da_serra, interior. For EACH place, deliver SEPARATE PARALLAX LAYERS, each a
  horizontally-seamless (looping) strip, NOT one flat painting:
  `<place>_sky.png`, `<place>_far.png`, `<place>_mid.png`, `<place>_near.png`, `<place>_ground.png`.
  (Sky may instead be a 5-color gradient spec in manifest.json.) For `rua_do_bairro`, put the
  recognizable Brazilian silhouettes in far/mid: the morro (stacked colorful houses), the Rio
  massif with the arms-out statue, the Elevador Lacerda, colonial church towers.
- `ui/` — panel_9slice, card_9slice, button_9slice, button_gold_9slice (state corner sizes),
  progress_bar (empty + fill), border ornaments.
- `logo/` — logo.png.

## manifest.json (at assets/ root) — how the code loads everything

A JSON array, one object per PNG. Example entries:

```json
[
  { "file": "hero/hero_walk.png", "category": "hero", "type": "sheet",
    "w": 336, "h": 64, "frameW": 48, "frameH": 64, "frames": 7, "fps": 10,
    "anchorX": 24, "anchorY": 64, "notes": "faces right, feet-anchored" },
  { "file": "scenarios/orla_far.png", "category": "scenarios", "type": "layer",
    "w": 390, "h": 120, "loopX": true, "parallax": 0.25, "place": "orla" },
  { "file": null, "category": "scenarios", "type": "sky", "place": "orla",
    "stops": ["#123", "#234", "#345", "#456", "#567"] },
  { "file": "tiles/cobble_1.png", "category": "tiles", "type": "tile",
    "w": 16, "h": 16, "tileable": true }
]
```

Fields: `file`, `category`, `type` (sprite|sheet|tile|layer|icon|panel|sky), `w`, `h`,
`frameW`/`frameH`/`frames`/`fps` (sheets), `anchorX`/`anchorY` (characters = center-bottom),
`tileable`, `loopX`, `parallax` (0=static sky … 1=ground), `place` (scenarios), `notes`.

## palette.json (at assets/ root)

```json
{ "colors": ["#hex", "#hex", "..."] }
```

## Suggested order

Deliver **`hero/` first** (the five strips + staff + shadow + its manifest entries + palette).
That lets the pipeline be built and the character validated in-game on a small batch before the
full seven scenarios are generated. If the hero's format is right, everything else follows the
same mold.
