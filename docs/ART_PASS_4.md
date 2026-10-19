# Art Pass 4 — authored spacecraft with true PBR texture sets

## In-game choices

| Visual | Source | Texturing |
|---|---|---|
| Watson (Proteron A) | Viktor Hahn, CC BY 4.0 | Embedded diffuse, emission, metallic/roughness and normal maps |
| Pythagoras (Proteron B) | Viktor Hahn, CC BY 4.0 | Embedded diffuse, emission, metallic/roughness and normal maps |
| Vanguard | SpaceSIM original geometry + Rob Tuytel CC0 materials | Albedo, tangent normal, packed ARM |
| Insurgent / Bob | Quaternius CC0 | Stylized diffuse textures and tuned standard PBR scalar materials |
| Iskra 0.1 | SpaceSIM procedural prototype | Simple standard materials |

## Credits

Redistributed models Watson and Pythagoras require attribution to **Viktor Hahn**,
their original [Proteron Ships asset](https://opengameart.org/content/proteron-ships)
and [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/).
See [PROTERON_CREDITS.md](PROTERON_CREDITS.md) for exact original GLB filenames
and modifications; original file hashes are recorded in
`public/assets/ships/proteron-manifest.json`.

Poly Haven 1K material maps are CC0 and tracked in [PBR_ASSETS.md](PBR_ASSETS.md).
Neither source is fetched at runtime. GLB and PNG textures ship in the repo.

## Scene

The Asterion Shipyard replaces the small abstract relay. Its modules are rendered
with static geometry batching and instance lights, without modifying combat or
saves. The numerical obstacle radius is now 520m, preventing travel drive
activation/continuation close to its exterior structure.

## Validation and future work

Lint/typecheck/tests are checked in GitHub CI. The headless screenshot checks
that graphics initialize and the ships appear but is **not a reliable FPS benchmark**
since Linux CI uses SwiftShader software rendering. Final acceptance requires
local measurements at 60 FPS and manual inspection of cockpit, controls,
travel mode and close approaches to the shipyard.

Future: authored docking assets, real ship interior, optimized KTX2/GLB compression,
manual per-model axes and collision bounds, GPU timings and in-game station interaction.
