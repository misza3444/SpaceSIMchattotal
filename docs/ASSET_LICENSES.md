# SpaceSIM — third-party asset provenance

All ship assets listed below are from **Quaternius, Ultimate Spaceships Pack (May 2021)**, released under **CC0 1.0 Universal** (commercial modification and redistribution permitted; attribution not required). Credit is voluntarily included.

- Author and canonical license: [Quaternius — Ultimate Spaceships](https://quaternius.com/packs/ultimatespaceships.html), [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- Mirror for deterministic retrieval: `euuuuuuan/voidclad-public`, GitHub commit `440916aabc30abe014cb33ad90bd150bfbf22dd0`. These are the same self-contained Quaternius glTF exports as documented in that repository's `THIRD_PARTY_ASSETS.md`.
- Asset import automation: `.github/workflows/import-quaternius-assets.yml`. Fails closed on failed HTTP download, SHA-256 mismatch, non-glTF, or missing inline buffers.

| Project file | Original name | SHA-256 | License |
| --- | --- | --- | --- |
| `public/assets/ships/insurgent.gltf` | Insurgent.gltf | `a6e75f658d4133bf8e96172a410b1daa8c3a8179f9c77b033f9d9cdaa04cb419` | CC0 1.0 |
| `public/assets/ships/bob.gltf` | Bob.gltf | `73f187cd1a11e487a1b20405bfa59d3d9f98ef4960ee64e3f062a7373aa095ad` | CC0 1.0 |

The original SpaceSIM prototype mesh in `src/render/scene.ts` is first-party procedural geometry. Enhancements to loaded materials, lights and exhaust effects are first-party code. **Do not copy models from Sketchfab or CGTrader into the public repository without individually verifying licenses.**
