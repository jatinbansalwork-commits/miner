# Diamond Claw Miner — The Proposal Hint

A relaxed, endless 2D mining experience. Move the miner along the surface, swing the claw, and explore the cave until the hidden special diamond reveals the ring hint.

## Stack

- HTML5 Canvas (16:9)
- Vanilla JavaScript (ES6 modules)
- Light-themed HTML/CSS gift modal
- Vite (dev server & build)

## Run

```bash
npm install
npm run dev
```

## Controls

- **Tap** the game screen, **Space**, or **↓** — launch claw
- Miner walks to center automatically on load, then the claw swings

On phones in portrait, rotate to landscape to play.

## Proposal hint

Three hidden diamonds in the cave match **CaratLane** products in [`src/config.js`](src/config.js) (`GIFT_CONFIG` + `special_diamond_*` item IDs). They look identical to other diamonds until mined. Replace `/public/assets/*.svg` with product PNGs when ready.

## Audio

Procedural Web Audio by default, or add MP3s to `public/assets/sounds/` (see earlier README section).
