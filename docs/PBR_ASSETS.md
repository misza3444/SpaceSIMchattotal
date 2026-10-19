# SpaceSIM — PBR assets / licenses

## Verified source and file list

Material sets: **Blue Metal Plate** and **Metal Plate 02** by **Rob Tuytel**, published on
[Poly Haven Blue Metal Plate](https://polyhaven.com/a/blue_metal_plate) and
[Poly Haven Metal Plate 02](https://polyhaven.com/a/metal_plate_02). Licensed **CC0 1.0**
for commercial redistribution. The game vendors 1K PNG sets: `diff` (sRGB albedo),
`nor_gl` (OpenGL tangent-space normal), and `arm` (AO/roughness/metalness in RGB).
The six locally committed file paths, source URLs, dimensions and SHA-256 digests
are enumerated in `public/assets/materials/manifest.json`.

The source is not fetched during normal gameplay. Import/update uses
`scripts/fetch-pbr-materials.py` in the `Vendor Poly Haven PBR Maps` workflow.
Fail on unexpected PNG signatures or sizes. The SHA-256 manifest makes later changes auditable.

These are **real photographic PBR material maps**, but the station hull and
custom player ship are *original procedural meshes*, not independently purchased
photorealistic meshes. Don't describe the geometry as a third-party photorealistic model.
The original Quaternius ships remain available under CC0 and unchanged.
