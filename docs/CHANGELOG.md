# Changelog

## 0.1.0 — Stage 1 (19 Oct 2026)

- Data-driven 6DOF translation and angular flight, per-axis damping and configurable thrusters/ship mass.
- Flight assist ON/OFF, boost, charging/cruise/cooldown travel state machine and forward obstacle safety cancellation.
- Keyboard, pointer-lock mouse, Gamepad API and persistent key rebinding.
- Cockpit and third-person cameras, procedural player ship, test station, beacon, asteroids, starfield and a lit sun.
- Flight HUD with reticle, velocity, target cycling, world-space markers and height-aware spatial radar display; PL/EN UI.
- Flight state persisted through existing IndexedDB saves; Stage 0 save envelopes remain loadable.
- Deterministic headless flight regression coverage plus original Stage 0 tests.

## 0.0.1 — Stage 0

- Initial TypeScript strict, Vite, Three.js, ESLint and Vitest.
- Pure fixed-60Hz simulation, component-bag ECS, queued commands and typed event bus.
- IndexedDB save/load, JSON catalogs with Zod validation and two locales.
- Empty 3D renderer, diagnostics, headless CLI and GitHub Actions.
