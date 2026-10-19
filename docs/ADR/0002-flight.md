# ADR 0002 — Fixed-step custom 6DOF flight integrator

**Status:** Accepted, Stage 1.

**Context:** SpaceSIM needs a deterministic, headless-simulatable flight model with persistent snapshots and eventual high/low-attention simulation. A physics engine would add DOM/browser/build requirements or coupling before gameplay requires dynamic rigid-body collisions.

**Decision:** Implement 6DOF flight in pure TypeScript using XYZ local thrust, mass, semi-implicit Euler velocity integration, per-axis drag, quaternion orientation, angular acceleration and assist damping. Control events travel through the command bus. Parameter values are validated from JSON at runtime. Static obstacles live in a validated sector file. Travel is an explicit serializable state machine rather than renderer-side animation.

**Consequences:** Repeatable integration and save/resume, easy future Worker migration, no third-party engine, clear input/UI separation. No contact forces, collision damage or broad-phase yet; implement those only when interaction and combat warrant them. Frame-rate independence derives from fixed dt, not uncapped render refresh rate.
