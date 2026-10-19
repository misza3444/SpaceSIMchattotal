# SpaceSIM browser — design assumptions

## Stage 1 scope

This stage turns the Stage 0 foundation into a steerable, free-flight test sector. No economy, docking, weapons, player station, sector transitions, autopilot, AI trader fleet or quests are implied.

## Physics contract

- Coordinates in meters, speed m/s, time seconds; +X right, +Y up, −Z ship forward.
- Ship definitions hold mass (kg), main/reverse/strafe/lift thrust (N), axis drag coefficient (1/s), pitch/yaw/roll angular acceleration (rad/s²), angular damping (1/s), boost multiplier and speed caps.
- Rotation uses normalized quaternions, and local linear velocity is transformed using the inverse quaternion for assist braking.
- Flight assist ON commands zero local velocity when axis unpressed, and stronger zero-input rotational damping. OFF permits persistent coasting/rotation except small configured drag.
- Model uses semi-implicit Euler at deterministic fixed 60Hz; speed cap is a control/game-feel design decision, not real vacuum physics.
- Boost is held via Shift/A; it accelerates quicker in normal mode, not in travel.
- Travel charges for 120 ticks then approaches its high-speed target. Pressing T cancels charging or cruising, causing cooldown for 78 ticks. Heading-projected safety corridor cancels when a nearby body enters the approach path. In near obstacles mode cannot begin. During charging/travel, weapons are disabled at game-rule level; shooting does not exist yet.
- Collision damage/contact response is intentionally not implemented. Targets are selectable static beacons/station/asteroids.
- The test sector positions are in local world coordinates; large multi-sector position precision is a later stage.

## UX and input

- 3D ship exterior and simplified instrument-frame cockpit, with separate camera modes.
- Visual HUD with reticle, selected target, object markers and height-encoded 3D radar projection.
- Remappable keyboard actions with localStorage persistence. Pointer lock requires a user click; mouse delta controls yaw/pitch. Standard Gamepad API polled every fixed simulation tick. No mobile touch joystick for this release.
- The UI retains PL and EN translations. The ship and props are original procedural geometry.
- FPS counter is diagnostic. No verified 60-FPS hardware benchmark yet.

## API references

Three.js version: 0.185.1, types: @types/three 0.185.4. APIs cross-checked against Three.js docs (PerspectiveCamera, Vector3.project/lerp, Quaternion.slerp, WebGLRenderer, BufferGeometry). Browser pointer lock and Gamepad API behavior checked against MDN. The authoritative runtime/API compatibility gate is the pinned dependency CI build.
