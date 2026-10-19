# SpaceSim Web — Architecture (Stage 0)

- `src/sim/`: pure TypeScript simulation. No DOM, WebGL, Three.js, clock APIs or Math.random. State is JSON-serializable; simulation updates run at a fixed 1/60s.
- `src/render/`: Three.js WebGL view. Can render independently of simulation. Renderer reads snapshots only; interpolation factor is supplied by fixed-step loop.
- `src/ui/`: UI renders snapshots and translates user intent into commands. It never directly edits the simulation state.
- `src/storage/`: IndexedDB saves, versioned envelope and migration function. Time of saving is metadata, not part of deterministic simulation state.
- `src/data/` + `data/`: JSON definitions parsed and cross-referenced using Zod before use.
- `src/i18n/`: PL and EN catalogues.
- `scripts/`: headless simulation with injected seed and tick count.

## Flow

UI -> CommandBus.enqueue(command) -> Simulation.step() drains queue -> systems update ECS data -> events emitted -> UI reads cloned snapshot. Browser loop uses accumulator; render is invoked per presentation frame and accepts interpolation alpha. Headless runs only simulation.

## Simulation

State consists of `schemaVersion`, `seed`, `rngState`, `tick`, `nextEntityId`, and a serializable list of entities (component bags). The seed initializes the xorshift32 RNG. Entity spawning and future simulation randomness must use this generator only. Fixed step = 1/60s. No simulated entities at initial load; the debug UI can enqueue a test spawn.

Tick frequencies for AI and economy belong to future phases; the Stage 0 clock provides a deterministic 60Hz baseline, but does not pretend to implement AI/economy.

## High/low attention

Future boundary: both high-attention and low-attention systems will modify the same canonical serializable state using commands and events. No low-attention economy, materialization or distant combat exists yet.

## Save policy

IndexedDB database `spacesim-web` version 1 contains `saves` object store keyed by `slotId`. Envelope version 0 migrates to 1 on read; unknown future versions are rejected. State snapshots are schema validated. Save operations happen at the UI action boundary, not mid-step.

## Performance targets (not yet claims)

60 FPS around 150 visible ships and several thousand instanced objects, 300–600 off-sector AI. Benchmark only once matching mechanics exist.
