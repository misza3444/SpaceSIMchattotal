import { z } from 'zod';
import waresJson from '../../data/wares.json';
import shipsJson from '../../data/ships.json';
import recipesJson from '../../data/recipes.json';
import factionsJson from '../../data/factions.json';
import modulesJson from '../../data/modules.json';
const local = z.object({ pl: z.string().min(1), en: z.string().min(1) }).strict();
const reference = z.object({ wareId: z.string().min(1), quantity: z.number().positive() }).strict();
const wares = z.array(z.object({ id: z.string(), name: local, cargoType: z.enum(['solid', 'liquid', 'container']), basePrice: z.number().positive() }).strict());
const ships = z.array(z.object({ id: z.string(), name: local, role: z.string(), mass: z.number().positive(), thrust: z.number().positive() }).strict());
const recipes = z.array(z.object({ id: z.string(), inputs: z.array(reference), outputs: z.array(reference), cycleSeconds: z.number().positive() }).strict());
const factions = z.array(z.object({ id: z.string(), name: local, color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict());
const modules = z.array(z.object({ id: z.string(), name: local, kind: z.enum(['production', 'storage', 'dock', 'defense', 'habitat', 'construction']), recipeId: z.string().optional() }).strict());
export function loadCatalog() {
  const result = {
    wares: wares.parse(waresJson), ships: ships.parse(shipsJson),
    recipes: recipes.parse(recipesJson), factions: factions.parse(factionsJson), modules: modules.parse(modulesJson)
  };
  for (const group of Object.values(result)) {
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
