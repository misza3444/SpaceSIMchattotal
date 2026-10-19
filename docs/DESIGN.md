# SpaceSim Web — Game design decisions

- Independent original setting, ships, factions and economy; inspiration limited to generic mechanics of space sandboxes.
- Desktop browser first; responsive debug controls are included, but mobile 6DOF controls are a future decision.
- Stage 0 loads original example ware, faction, ship and module JSON entries to prove data validation. These do **not** imply trade, AI or manufacturing exists.
- The scene deliberately renders only empty space with a dark background and diagnostic panel. No misleading decorative proxy for unimplemented gameplay.
- State may be created with user-defined positive 32-bit seed; default sample is 42. Seed zero is normalized by the RNG.
- Pause/new world reset accumulator; load creates a new simulation object from a validated snapshot.
- Entity positions and velocities are plain float triplets (sector-local coordinates); floating-origin/materialization are future work.
- A created debug entity is an invisible ECS probe, not a player ship.
