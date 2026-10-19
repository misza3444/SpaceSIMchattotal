# Known limitations and deferred work

## Art Pass 4

- [x] Import authored GLB spacecraft with full PBR materials and verified CC BY 4.0 credits.
- [x] Replace abstract station with a visibly modular industrial shipyard.
- [x] Import real CC0 diffuse / normal / AO-roughness-metallic texture sets.
- [x] Batch static station geometry and capture true browser screenshots.
- [ ] Profile 60 FPS locally; software-rasterized GitHub screenshots are not valid FPS evidence.
- [ ] Optimize ~19 MB ship GLBs and ~26 MB uncompressed 1K PBR source PNG maps (KTX2 / meshopt where supported).
- [ ] Hand-adjust ship model orientation and camera offsets based on interactive playtesting.
- [ ] Add collision detail / docking bays / walkable interiors in future stages.


- [ ] **Hardware acceptance:** verify sustained 60 FPS on target PC/browser hardware and record GPU/CPU timing. CI validates lint, unit tests and bundle build, not FPS.
- [ ] **Manual playability acceptance:** test mouse pointer lock, rebinding UX, gamepad axes across common controllers, and cockpit visibility in Chrome/Firefox.
- [ ] Record a browser screen capture and obtain UX feedback on 6DOF handling and travel steering.
- [ ] Collision response and collision damage; Stage 1 only disengages travel near objects.
- [ ] Full weapon system; travel mode currently blocks future weapons via boolean game-rule gate.
- [ ] Mobile touch controls: not in Stage 1 acceptance but useful before smartphone release.
- [ ] Lockfile generation and commit from npm-enabled system; currently CI runs npm install with pinned direct dependency versions.
- [ ] Worker-based low-attention simulation and sector floating origin (Stage 2/5).
- [ ] Full object interaction, docking, economy, trade, combat, missions and assets beyond test sector (Stages 2+).
