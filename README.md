# SpaceSIM Chat Total — Stage 1: Flight

Playable browser-based space flight prototype built on a deterministic TypeScript simulation core.

## 🚀 Art Pass 4.0 — prawdziwe statki PBR i modułowa stocznia

SpaceSIM ma teraz **6 modeli do porównania**: Watson i Pythagoras (pełnoteksturowane
modele GLB od Viktora Hahna, **CC BY 4.0**), Vanguard (autorski statek z mapami
PBR Poly Haven), Insurgent i Bob (Quaternius, CC0) oraz klasyczną Iskrę.

Domyślnym modelem na nowym profilu przeglądarki jest **Watson**. Przełączanie
modeli odbywa się w **Hangarze porównawczym** bez zmiany parametrów fizyki.
Można użyć `?ship=proteron-a`, `?ship=proteron-b`, `?ship=vanguard`,
`?ship=insurgent` lub `?ship=bob`.

**Stocznia Asterion** zastępuje dawny prosty przekaźnik: 12 stanowisk
dokowania, system dźwigów, moduły produkcyjne, trawersy i anteny. Statyczne
części są łączone w mniejszą liczbę draw calli. Tekstury PBR pochodzą z
Poly Haven CC0 (lokalnie zapisane mapy diffuse, normal i ARM).

### Rzeczywiste zrzuty z gry

- [Watson — statek PBR](docs/screenshots/ship-proteron-a-artpass4.png)
- [Pythagoras — statek PBR](docs/screenshots/ship-proteron-b-artpass4.png)
- [Vanguard — autorski kadłub i stocznia](docs/screenshots/ship-vanguard-artpass4.png)

**Obowiązkowe informacje o autorstwie modeli Proteron:**
[PROTERON_CREDITS.md](docs/PROTERON_CREDITS.md).
Pozostałe zasoby:
[ASSET_LICENSES.md](docs/ASSET_LICENSES.md),
[PBR_ASSETS.md](docs/PBR_ASSETS.md),
[ART_PASS_4.md](docs/ART_PASS_4.md).

Jakość obrazu w przeglądarce jest potwierdzona zrzutami z GitHub Actions,
ale **60 FPS na komputerze gracza nie jest jeszcze zmierzone**.
Stocznia nadal nie ma przechodnich wnętrz ani działającego dokowania.

## Quick start

Requirements: Node.js 22.12+, npm and a WebGL-capable browser.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Click empty space to capture the mouse; press Escape to release it. If pointer lock is unavailable, use arrow keys to rotate. The project also supports a standard gamepad.

### Keyboard / mouse

| Key | Action |
|---|---|
| W / S | Forward / reverse |
| A / D | Strafe left / right |
| Space / Left Ctrl | Move up / down |
| Mouse (pointer lock) or arrow keys | Yaw / pitch |
| Q / E | Roll |
| Left Shift | Boost |
| F | Toggle flight assist |
| T | Enter/cancel travel mode |
| V | Cockpit / external chase camera |
| Tab | Next target |
| Escape | Release mouse |

All keyboard bindings can be changed from the in-game **Remap controls** panel. Key bindings persist in browser localStorage. Control inputs never mutate simulation state directly; they enqueue commands processed during fixed updates.

### Gamepad

Standard mapping: left stick strafe/forward, right stick yaw/pitch, triggers lift/down, shoulder buttons roll, A boost, X travel, Y toggle assist, B cycle target, Start change camera. Browser mapping can vary by controller.

### Flight assist and travel

The ship has independent translation and angular acceleration with configurable mass, thrust, axis drag, rotational inertia and velocity caps (`data/ships.json`). Flight assist brakes unchecked drift and rotation; OFF retains inertia. Boost increases thruster acceleration and speed cap.

Travel state machine: `normal → charging (2 s) → travel (up to 2400 m/s) → cooldown (1.3 s) → normal`. Press T while charging or cruising to cancel; proximity corridor safety automatically aborts travel as the ship approaches a collision body. Travel imposes a *weapons-enabled flag* of false; Stage 1 has no weapon system to fire yet.

### Stage 1 testing

```sh
npm run check
npm run sim:run -- --seed 42 --ticks 600
```

Run `npm run dev` and verify feel, remapping, both cameras, target markers, radar, save/load and travel. Debug build measures FPS in the upper right of the HUD. 60 FPS is a **target**, not a measured guarantee; real browser/device profiling remains outstanding.

### Scene contents

One hand-authored test sector in `data/sector-test.json`: directional sun light, deterministic stars, station, beacon and two asteroids. Ships and scene props are custom procedural models built from Three.js primitives. Not yet a persistent multi-sector universe.

### Docs

- `docs/ARCHITECTURE.md` — systems and command flow
- `docs/DESIGN.md` — controls, physical units and intentional simplifications
- `docs/ADR/0002-flight.md` — why fixed 6DOF integration and no physics dependency
- `docs/CHANGELOG.md` and `docs/TODO.md` — done vs remaining
