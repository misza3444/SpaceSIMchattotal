# SpaceSIM Art Pass 3 — high-detail modular geometry and full CC0 PBR maps

## Implemented

- **Vanguard**: an original distinct spacecraft silhouette with swept hard-surface wings, ringed dual nacelles, armored hull panels, cockpit glazing, dorsal spine, details and navigation lights. Geometry is generated in `src/render/vanguard.ts`. Its surface slots use full *diffuse + tangent normal + AO/roughness/metalness* (ARM), not mere constant metalness/roughness values.
- **Asterion Shipyard**: industrial modular station replacing the former placeholder relay. Twelve functional-looking docking bays with loading rails and cranes, multi-axis service gantries, truss spokes, hab/industrial barrels, radiator arrays, antenna and repeated instanced navigation lights. The `relay` sector ID remains to preserve target selection in existing saves.
- **Poly Haven CC0**: Blue Metal Plate and Metal Plate 02 photographed materials. Source, license and SHA checksums are in `docs/PBR_ASSETS.md` and `public/assets/materials/manifest.json`. The 1K albedo/normal/ARM maps are loaded locally in `src/render/pbr-materials.ts` and the renderer falls back to base materials if unavailable.
- Existing Quaternius Insurgent and Bob remain selectable for a direct comparison. The default for a fresh browser is **Vanguard**, with query option `?ship=vanguard`.
- The player flight physics, scripted flight, ships data and save schema are unchanged.

## Honest quality / performance boundaries

This release is a **geometry-and-material art pass**, not a licensed photorealistic third-party spaceship purchase, and the model is not an X4 clone. Its geometry has far more individual components than Stage 1 and may require future draw-call batching/LOD. GitHub Actions' SwiftShader / virtual-time screenshots are visual-only checks and **cannot validate 60 FPS on an actual desktop GPU**.

Current station is modeled as exterior geometry only, not traversable/enterable. Dock rails are visual props; collision body radius was expanded from 145m to 520m and travel assist will disengage near it. No automatic docking, interiors, economy or weapons are introduced.

## Model provenance

- `Vanguard` and `Asterion Shipyard` geometry: original SpaceSIM programmatic construction.
- Industrial PBR maps: Poly Haven / Rob Tuytel / CC0. See `PBR_ASSETS.md`.
- Insurgent & Bob: Quaternius / CC0. See `ASSET_LICENSES.md`.

## Next graphics refinements

- Control the number of draw calls by merging repeated static hull geometry or instancing common details; add LOD and texture KTX2 compression.
- Introduce per-part wear masks, ship-specific metal/paint/normal textures and an authored sci-fi model if a verifiably redistributable high-quality licensed source is obtained.
- Camera composition, render exposure, engine nozzle alignment and station closer fly-bys require real-play quality review.
