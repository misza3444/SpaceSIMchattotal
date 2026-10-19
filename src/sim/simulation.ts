import { CommandBus, EventBus } from './bus';
import { nextRandom } from './rng';
import { makeWorld, readWorld } from './state';
import type { WorldState } from './types';
export const FIXED_DT = 1 / 60;
export class Simulation {
  readonly commands = new CommandBus();
  readonly events = new EventBus();
  private state: WorldState;
  constructor(seed = 42, initial?: WorldState) {
    this.state = initial ? readWorld(initial) : makeWorld(seed);
  }
  snapshot(): WorldState { return structuredClone(this.state); }
  step(): void {
    for (const command of this.commands.drain()) {
      if (command.type === 'spawnProbe') {
        const sample = nextRandom(this.state.rngState);
        this.state.rngState = sample.state;
        const id = this.state.nextEntityId++;
        const position = command.position ?? [sample.value * 10 - 5, 0, 0];
        this.state.entities.push({ id, transform: { position: [...position] }, motion: { velocity: [0, 0, 0] } });
        this.events.emit({ type: 'entitySpawned', entityId: id });
      }
    }
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
