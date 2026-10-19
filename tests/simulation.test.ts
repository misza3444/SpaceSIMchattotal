import { describe, expect, it } from 'vitest';
import { Simulation } from '../src/sim/simulation';
import { FixedStepClock } from '../src/sim/clock';
import { loadCatalog } from '../src/data/catalog';
describe('foundation', () => {
  it('same seed and commands produce identical state after N ticks', () => {
    function run(seed: number) {
      const sim = new Simulation(seed);
      sim.commands.enqueue({ type: 'spawnProbe' });
      for (let i = 0; i < 600; i++) {
        if (i === 100) sim.commands.enqueue({ type: 'spawnProbe' });
        sim.step();
      }
      return sim.snapshot();
    }
    expect(run(42)).toEqual(run(42));
    expect(run(43)).not.toEqual(run(42));
  });
  it('returns copies rather than mutable references', () => {
    const sim = new Simulation();
    const snapshot = sim.snapshot();
    snapshot.tick = 999;
    expect(sim.snapshot().tick).toBe(0);
  });
  it('steps at fixed increments and clamps tab stalls', () => {
    const clock = new FixedStepClock(1 / 60);
    let steps = 0;
    clock.advance(0, () => steps++);
    clock.advance(1 / 30, () => steps++);
    expect(steps).toBe(2);
    clock.advance(10, () => steps++);
    expect(steps).toBeLessThanOrEqual(7);
  });
  it('loads valid data catalogs', () => {
    expect(loadCatalog().wares.length).toBeGreaterThan(0);
  });
});
