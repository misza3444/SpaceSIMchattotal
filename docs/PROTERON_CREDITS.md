# Proteron Ships — required CC BY 4.0 attribution

**Artist:** Viktor Hahn (aka Unnamed on OpenGameArt).

**Original work:** [Proteron Ships](https://opengameart.org/content/proteron-ships), five spacecraft made for the Naev project (14 June 2023). The artist states that the GLB exports include packed diffuse, emission, metallic, roughness and normal texture channels.

**License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Attribution, license link, and modification indication are mandatory when sharing the derived work. Redistribution within SpaceSIM is allowed subject to these terms.

**Changes in SpaceSIM:** We select and rename two GLB exports to `proteron-a.glb` and `proteron-b.glb`, scale/reorient them at runtime, and display them under SpaceSIM lighting/postprocessing. Their source mesh and embedded textures are otherwise preserved. Model size and coordinates are adjusted in Three.js; original downloadable files are unmodified.

**Reproducibility:** [Import script](../scripts/import-proteron.py) fetches `gltf.zip` from OpenGameArt, checks GLB v2 headers, material content, stores SHA-256 digests and original filenames in `public/assets/ships/proteron-manifest.json`.

Attribution must stay visible in the game UI (Hangar model source) and in this file. Attribution text above is part of the product documentation. The standalone meshes are still copyright-protected under CC BY 4.0, not CC0.
