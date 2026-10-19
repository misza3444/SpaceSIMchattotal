# Changelog

## 0.1.0 — Art Pass 4 / real PBR models (19 Oct 2026)

- Proteron Watson and Pythagoras: **two real pre-authored GLB spacecraft** with textures, license CC BY 4.0, artist Viktor Hahn; original asset metadata and SHA-256 preserved in `public/assets/ships/proteron-manifest.json`.
- Built `Vanguard` alternative ship geometry with original details, using Poly Haven 1K photometric PBR texture sets (albedo, OpenGL normal, AO/roughness/metalness).
- Replaced placeholder space station with Asterion modular shipyard: docking bays, gantries, radiator arrays, communications antenna and navigation lights; static mesh batching for fewer draws.
- Updated showroom with six selectable ships (2 Proteron, Vanguard, 2 Quaternius, and original Iskra). Proteron is default for new browsers; keeps previous selection if saved.
- Preserve artist PBR metallic-roughness scalar values when maps are embedded; show CC BY credits in HUD.
- Added screenshot CI and deterministic CC0/CC BY asset provenance.

## 0.1.0 — Stage 1

- Data-driven 6DOF translation and angular flight, per-axis damping and configurable thrusters/ship mass.
- Flight assist ON/OFF, boost and travel mode with auto-disengagement near obstacles.
- Mouse + keyboard, gamepad, rebinding, cockpit/chase camera, HUD and radar.
- Flight state persisted through IndexedDB; Stage 0 saves loadable.

## 0.0.1 — Stage 0

- TypeScript strict, Vite, Three.js, ESLint, Vitest.
- Deterministic fixed-step simulation, ECS component bags, command and event buses, storage and two UI locales.
