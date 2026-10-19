# Art Pass 2.0 — real CC0 spacecraft

Goal: replace the Stage 1 procedural silhouette with switchable, redistributable authored meshes without changing deterministic 6DOF flight.

## Installed

- Quaternius **Insurgent** and **Bob**, fetched at pinned upstream revision and SHA-256 checked, self-contained glTF 2.0.
- In-game hangar switcher with three visuals: Insurgent, Bob, legacy procedural Iskra. Default is Insurgent (can override with `?ship=bob` / `?ship=prototype`).
- Visual preference saved in localStorage, independent of physics and the IndexedDB save format.
- GLTFLoader with normalized size and PBR-tuned standard-material parameters preserving authored diffuse textures.
- Neutral RoomEnvironment PMREM for hull reflections, additional fill/rim lights, softened procedural engine flare and optional UnrealBloomPass (BLOOM ON/OFF).
- Automated real Chrome/WebGL captures in `docs/screenshots/ship-insurgent-artpass2.png` and `ship-bob-artpass2.png` on GitHub, via `.github/workflows/art-pass-previews.yml`.

## Constraints / pending

These original models are **stylized CC0 assets**, not photorealistic high-poly ships. They lack authored industrial-grade metallic/roughness/normal texture maps. The PBR material adjustments and studio-reflection environment are an interim improvement. The selectable mesh does not yet define physical collision, hull hitboxes, weapon hardpoints or cockpit interiors.

A headless Chrome screenshot verifies the rendering path but is **not** a benchmark for user hardware. Inspect the scene at 60 FPS target on a local machine and evaluate real game feel.

Because both models use different authoring conventions, visual alignment is normalized heuristically, not hand-authored per hull. Final asset selection should include a per-hull orientation and hardpoint pass.

## Licensing

See [ASSET_LICENSES](ASSET_LICENSES.md). No attribution is legally required under CC0; attribution is preserved voluntarily.
