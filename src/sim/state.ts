import { z } from 'zod';
import { normalizeSeed } from './rng';
import type { WorldState } from './types';
const vec = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const quat = z.tuple([z.number().finite(),z.number().finite(),z.number().finite(),z.number().finite()]);
const entitySchema = z.object({
  id: z.number().int().positive(),
  transform: z.object({ position: vec }).optional(),
  motion: z.object({ velocity: vec }).optional()
}).strict();
const pilotSchema = z.object({
  shipId: z.string().min(1), position: vec, velocity: vec, orientation: quat,
  angularVelocity: vec, assist: z.boolean(), boost: z.boolean(),
  mode: z.enum(['normal','charging','travel','cooldown']),
  phaseTicks: z.number().int().nonnegative(), selectedTarget: z.string().nullable()
}).strict();
export const worldSchema = z.object({
  schemaVersion: z.literal(1),
  seed: z.number().int().min(0).max(0xffffffff),
  rngState: z.number().int().min(0).max(0xffffffff),
  tick: z.number().int().nonnegative(),
  nextEntityId: z.number().int().positive(),
  entities: z.array(entitySchema),
  pilot: pilotSchema.optional() // Additive backward-compatible Stage 1 field.
}).strict().superRefine((world, context) => {
  const ids = world.entities.map(e => e.id);
  if (new Set(ids).size !== ids.length || ids.some(id => id >= world.nextEntityId)) {
    context.addIssue({ code: 'custom', message: 'Invalid entity IDs' });
  }
  if (world.pilot && Math.abs(Math.hypot(...world.pilot.orientation)-1)>0.002) {
    context.addIssue({ code: 'custom', message: 'Pilot quaternion must be normalized' });
  }
});
export function makeWorld(seed = 42): WorldState {
  const value = normalizeSeed(seed);
  return { schemaVersion: 1, seed: seed >>> 0, rngState: value, tick: 0, nextEntityId: 1, entities: [] };
}
export function readWorld(input: unknown): WorldState { return worldSchema.parse(input) as WorldState; }
