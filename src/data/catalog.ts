import { z } from 'zod';
import waresJson from '../../data/wares.json';
import shipsJson from '../../data/ships.json';
import recipesJson from '../../data/recipes.json';
import factionsJson from '../../data/factions.json';
import modulesJson from '../../data/modules.json';
import sectorJson from '../../data/sector-test.json';
const vec = z.tuple([z.number().finite(),z.number().finite(),z.number().finite()]);
const local = z.object({ pl: z.string().min(1), en: z.string().min(1) }).strict();
const reference = z.object({ wareId: z.string().min(1), quantity: z.number().positive() }).strict();
const wares = z.array(z.object({ id: z.string(), name: local, cargoType: z.enum(['solid', 'liquid', 'container']), basePrice: z.number().positive() }).strict());
const ship = z.object({
  id: z.string().min(1), name: local, role: z.string().min(1),
  mass: z.number().positive(), thrust: z.number().positive(),
  thrusters: z.object({ strafe: z.number().positive(), lift: z.number().positive(), reverse: z.number().positive() }).strict(),
  drag: vec, angularAcceleration: vec, angularDrag: z.number().nonnegative(),
  maxAngularSpeed: z.number().positive(), assistBraking: z.number().positive(),
  boostMultiplier: z.number().min(1), maxSpeed: z.number().positive(),
  travelSpeed: z.number().positive(), travelAcceleration: z.number().positive(),
  travelChargeSeconds: z.number().positive(), travelCooldownSeconds: z.number().positive()
}).strict();
const ships = z.array(ship);
const recipes = z.array(z.object({ id: z.string(), inputs: z.array(reference), outputs: z.array(reference), cycleSeconds: z.number().positive() }).strict());
const factions = z.array(z.object({ id: z.string(), name: local, color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict());
const modules = z.array(z.object({ id: z.string(), name: local, kind: z.enum(['production', 'storage', 'dock', 'defense', 'habitat', 'construction']), recipeId: z.string().optional() }).strict());
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const sector = z.object({
  id: z.string().min(1), name: local,
  sun: z.object({ position: vec, radius: z.number().positive(), color }).strict(),
  bodies: z.array(z.object({ id: z.string().min(1), name: local, kind: z.enum(['station','asteroid','beacon']), position: vec, radius: z.number().positive(), color }).strict())
}).strict();
export function loadCatalog() {
  const result = {
    wares: wares.parse(waresJson), ships: ships.parse(shipsJson),
    recipes: recipes.parse(recipesJson), factions: factions.parse(factionsJson),
    modules: modules.parse(modulesJson), sector: sector.parse(sectorJson)
  };
  for (const group of [result.wares,result.ships,result.recipes,result.factions,result.modules,result.sector.bodies]) {
    const ids = group.map(entry => entry.id);
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate data ID');
  }
  const knownWares = new Set(result.wares.map(ware => ware.id));
  const knownRecipes = new Set(result.recipes.map(recipe => recipe.id));
  for (const recipe of result.recipes) {
    for (const item of [...recipe.inputs, ...recipe.outputs]) {
      if (!knownWares.has(item.wareId)) throw new Error('Unknown ware: ' + item.wareId);
    }
  }
  for (const module of result.modules) {
    if (module.recipeId && !knownRecipes.has(module.recipeId)) throw new Error('Unknown recipe: ' + module.recipeId);
  }
  return result;
}
export type Catalog = ReturnType<typeof loadCatalog>;
