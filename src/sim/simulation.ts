import { CommandBus, EventBus } from './bus';
import { nextRandom } from './rng';
import { makeWorld, readWorld } from './state';
import { changeTravelMode, makePilot, stepFlight, ZERO_INPUT } from './flight';
import { loadCatalog, type Catalog } from '../data/catalog';
import type { FlightInput, WorldState } from './types';
export const FIXED_DT = 1 / 60;
export class Simulation {
  readonly commands = new CommandBus();
  readonly events = new EventBus();
  readonly catalog: Catalog;
  private state: WorldState;
  private input: FlightInput = { ...ZERO_INPUT };
  constructor(seed = 42, initial?: WorldState, catalog = loadCatalog()) {
    this.catalog = catalog;
    this.state = initial ? readWorld(initial) : makeWorld(seed);
    // Older Stage 0 saves contained no pilot.
    this.state.pilot ??= makePilot(this.catalog.ships[0]!.id);
    if (!this.catalog.ships.some(s => s.id === this.state.pilot!.shipId)) {
      throw new Error('Save refers to an unknown ship');
    }
  }
  snapshot(): WorldState { return structuredClone(this.state); }
  step(): void {
    const pilot = this.state.pilot!;
    const ship = this.catalog.ships.find(s => s.id === pilot.shipId)!;
    const bodies = this.catalog.sector.bodies;
    for (const command of this.commands.drain()) {
      switch (command.type) {
        case 'spawnProbe': {
          const sample = nextRandom(this.state.rngState);
          this.state.rngState = sample.state;
          const id = this.state.nextEntityId++;
          const position = command.position ?? [sample.value * 10 - 5, 0, 0];
          this.state.entities.push({ id, transform: { position: [...position] }, motion: { velocity: [0, 0, 0] } });
          this.events.emit({ type: 'entitySpawned', entityId: id });
          break;
        }
        case 'flightInput':
          this.input = structuredClone(command.input); break;
        case 'toggleAssist':
          pilot.assist = !pilot.assist; break;
        case 'toggleTravel':
          changeTravelMode(pilot,ship,bodies); break;
        case 'nextTarget': {
          const index = bodies.findIndex(b => b.id === pilot.selectedTarget);
          pilot.selectedTarget = bodies[(index+1)%bodies.length]?.id ?? null;
          break;
        }
      }
    }
    const phaseBefore = pilot.mode;
    stepFlight(pilot,this.input,ship,bodies,FIXED_DT);
    if (pilot.mode !== phaseBefore) this.events.emit({ type: 'travelPhase', phase: pilot.mode });
    for (const entity of this.state.entities) {
      if (entity.transform && entity.motion) {
        for (let axis = 0; axis < 3; axis++) {
          entity.transform.position[axis] = (entity.transform.position[axis] ?? 0) + (entity.motion.velocity[axis] ?? 0) * FIXED_DT;
        }
      }
    }
    this.state.tick++;
    this.events.emit({ type: 'tick', tick: this.state.tick });
  }
}
