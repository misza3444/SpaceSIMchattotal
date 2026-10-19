export function normalizeSeed(seed: number): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Seed must be a uint32');
  return (seed >>> 0) || 0x6d2b79f5;
}
export function nextRandom(state: number): { state: number; value: number } {
  let x = state >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const next = x >>> 0;
  return { state: next, value: next / 0x100000000 };
}
