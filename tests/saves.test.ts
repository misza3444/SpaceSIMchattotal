import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Simulation } from '../src/sim/simulation';
import { loadWorld, migrateSave, saveWorld } from '../src/storage/saves';
describe('save/load', () => {
  it('round trips IndexedDB world state', async () => {
    const sim = new Simulation(123);
    sim.commands.enqueue({ type: 'spawnProbe' });
    sim.step();
    const expected = sim.snapshot();
    await saveWorld(expected);
    expect(await loadWorld()).toEqual(expected);
  });
  it('migrates legacy envelope and rejects unknown future versions', () => {
    const state = new Simulation(55).snapshot();
    expect(migrateSave({ version: 0, state }).state).toEqual(state);
    expect(() => migrateSave({ version: 999, state })).toThrow('Unsupported');
  });
  it('returns null for a missing slot', async () => {
    expect(await loadWorld('not-existing')).toBeNull();
  });
});
