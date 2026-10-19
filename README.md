# SpaceSim Web — Stage 0

Standalone browser implementation of the new TypeScript/Three.js architecture. The existing C# desktop game lives separately in `misza3444/spacesim` and is unchanged.

## Requirements

Node.js >= 22.12, npm, a browser with WebGL.

## Run

```sh
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run sim:run -- --seed 42 --ticks 600
```

Open the localhost address printed by Vite. Debug controls: create deterministic test entity, save to IndexedDB, reload, start a new world, switch PL/EN. Use the browser console for any WebGL or storage errors.

Stage 0 deliberately draws a blank 3D scene. Ships, combat, economy, 6DOF and navigation are **not** implemented.

## Architecture

See [ARCHITECTURE](docs/ARCHITECTURE.md), [DESIGN](docs/DESIGN.md), [ADR 0001](docs/ADR/0001-ecs.md), and [TODO](docs/TODO.md).

All dependencies are pinned to exact versions. A lockfile must be generated and committed from a connected npm environment before adopting `npm ci` (tracked in TODO).
