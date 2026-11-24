# Ironhaven material icons

The owner approved the material design on 2026-11-24. The same painted silhouettes identify materials in the stock bar, building prices, placement flow, and the production report. At build time the sprite is embedded in the offline Windows bundle. Mods use the built-in icon specified in their item prototype when one is available, or a cargo crate.

## Source

Created for Ironhaven using OpenAI ImageGen. The reference was the owner-approved material icon mockup over an in-game capture. No external artwork was imported for this set.

- [Source PNG](material-icons-source.png), SHA-256 `dd3b5236da33b6409812f88e05ebf473de44ce97445e099afbd142b7ba433b18`.
- Runtime atlas: `public/art/material-icons.webp`, 432 × 288, transparent, 24 cells of 72 pixels each.
- Atlas SHA-256: `0d05b60826bf0d39e2f40c8a7de9ace727ab50339e5148d643071a38420ef0ae`

Cut the source into a 6 × 4 grid. Trim transparent margins, fit each item into 62 × 62 pixels within a centered 72 × 72 tile, and pack the tiles in source order to a lossless WebP atlas. The runtime mapping is in `public/icons.js`.

## Generation prompt

> Produce the Ironhaven in-game MATERIAL icon sprite source sheet. Match the reference's inventory artwork: real tiny industrial objects, tabletop isometric 3/4 view, restrained palette, coastal factory grit, crisp contours, light from upper left. The item objects only. Output a TRANSPARENT 3:2 LANDSCAPE sprite sheet, EXACTLY 6 equal-width columns by 4 equal-height rows (24 isolated icons). Center each separate object inside its own precise grid cell. Every icon occupies about 60% of its cell width with generous, consistently empty gutters. The underlying grid is invisible. Do not paint any floor, shadow plane, boxes, borders, labels, numbers, letters, sheet title, highlights outside each object, UI panels, assembled scene, or extraneous shapes. Draw every icon to read very well at 18 pixels. Maintain the exact order, reading left to right:
> ROW 1: (1) two tan wooden planks with end grain, (2) cold-gray stack of flat rectangular iron sheets with light edges, (3) bronze machine cog with bored center, (4) three reddish-copper ingots, (5) one blue-steel I-beam with obvious I cross section, (6) moss-green PCB with chip and pale circuit tracks.
> ROW 2: (1) one cream-gray chunky finned electromechanical component with dark fins and brass socket, (2) two rough angular black coal fragments with rim light, (3) a blue-gray natural iron ore stone, (4) gray rock with prominent orange copper veins, (5) two pressed iron concentrate pellets, (6) one annular steel machine bearing with individual silver balls.
> ROW 3: (1) pale gray mixed gravel pile, (2) two terracotta firebricks, (3) single pitted charcoal coke briquette, (4) one thick blue-gray cast marine alloy billet with trapezoidal cross section, (5) a squat amber resin jar with metal lid, (6) an insulated rust-orange cable coil with a short black end.
> ROW 4: (1) overlapping dark bluish riveted curved hull panels, (2) silver hydraulic ram with one brass band, (3) small green-gray switchgear assembly with 3 cream switches, (4) skeletal industrial rectangular freight frame with a completely open center, (5) compact strapped stack of marine equipment on a wooden shipping pallet, (6) a small neutral gray closed cargo box with diagonal strap. Ensure distinct physical silhouettes, no item letters or numbers. No UI screenshot; this is the transparently isolated texture atlas to integrate into it.
