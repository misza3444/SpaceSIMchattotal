import { Simulation } from '../src/sim/simulation';
import { loadCatalog } from '../src/data/catalog';
function arg(name: string, fallback: number): number {
  const index = process.argv.indexOf('--' + name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid --' + name);
  return value;
}
const seed = arg('seed', 42);
const ticks = arg('ticks', 600);
loadCatalog();
const sim = new Simulation(seed);
for (let i = 0; i < ticks; i++) sim.step();
console.log(JSON.stringify(sim.snapshot(), null, 2));
