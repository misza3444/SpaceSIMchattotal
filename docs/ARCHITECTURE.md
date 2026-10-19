# Architecture — Stage 1

## Ownership

- `src/sim/` — **pure TS without DOM, WebGL, Three.js or browser clock**, fixed timestep 60Hz, serializable world. The pilot's quaternion, position, velocity, angular velocity, flight-assist state, target and travel phase live in `WorldState.pilot`.
- `src/input/controls.ts` — browser-facing keyboard, mouse pointer lock, gamepad poll, remapping stored in localStorage. Returns normalized flight controls and debounced action toggles.
- `src/render/scene.ts` — Three.js procedural meshes and scene lights, two camera poses, interpolated position/quaternion, 3D-to-screen target projection.
- `src/ui/dashboard.ts` — cockpit HUD, radar display and key binding panel. Writes to `CommandBus`, not to game objects or world state.
- `src/storage/saves.ts` — IndexedDB save schema envelope; legacy stage 0 worlds without pilot receive a default pilot at runtime. No breaking envelope change.
- `src/data/catalog.ts` — Zod validators for ships, sector objects and economy sample data; no hardcoded ship performance data inside the integrator.
- `data/` — data-driven ship physics, static hand-authored test sector, PL/EN localization and initial economy definitions.

## Fixed update

`requestAnimationFrame -> FixedStepClock.advance -> controls.sample -> queue command -> Simulation.step(1/60) -> immutable snapshot -> SpaceView.draw(previous, current, alpha) -> HUD`.

Keyboard toggles and gamepad buttons enter the same command bus as flight input. Rendering never mutates simulation state. The rasterized HUD radar displays relative local XYZ positions projected onto a tilted 2D radar plane with vertical-height indicators.

## Flight and safety

Local controls use right +X, up +Y, forward −Z. Translation forces are rotated to world coordinates by current quaternion and divided by mass. Flight assist brakes uncommanded lateral/vertical/forward velocity, and applies stronger angular damping at zero angular input. Travel mode steers velocity towards current heading while the forward obstacle corridor forces exit to cooldown. Collision **response** is not yet simulated; object proximity currently only affects travel disengagement.

`src/sim/flight.ts` remains testable headless. Random test stars are rendering-only and are initialized with a deterministic xorshift sequence.

## Versioned saves

Additive `pilot?` field maintains WorldState schemaVersion 1 backward compatibility with Stage 0 save envelopes. Loaders preserve existing data, and the Simulation constructor initializes missing pilot state. Existing save migration tests remain in place.

## Performance

Current renderer has one draw for the star Points collection and a small number of primitive meshes; no physics engine or shader post-processing. It limits DPR to 1.75, and the HUD readouts update every ~120 ms. The goal of 60 FPS must be checked on actual hardware; CI's unit tests do not provide GPU benchmarks.
