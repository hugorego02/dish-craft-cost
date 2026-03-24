import type { AppData, FoodComponent, Ingredient, YieldFactor, ExtraCost } from '@/types';

/**
 * Busca insumo por ID.
 */
export function findIngredient(data: Pick<AppData, 'ingredients'>, id: string): Ingredient | undefined {
  return data.ingredients.find(i => i.id === id);
}

/**
 * Busca fator de rendimento pelo ID do insumo.
 */
export function findYieldFactorByIngredient(data: Pick<AppData, 'yieldFactors'>, ingredientId: string): YieldFactor | undefined {
  return data.yieldFactors.find(y => y.ingredientId === ingredientId);
}

/**
 * Busca componente por ID.
 */
export function findComponent(data: Pick<AppData, 'components'>, id: string): FoodComponent | undefined {
  return data.components.find(c => c.id === id);
}

/**
 * Busca custo extra por ID.
 */
export function findExtraCost(data: Pick<AppData, 'extraCosts'>, id: string): ExtraCost | undefined {
  return data.extraCosts.find(e => e.id === id);
}

/**
 * Retorna insumo + fator de rendimento de um componente.
 */
export function resolveComponentDeps(
  data: Pick<AppData, 'ingredients' | 'yieldFactors'>,
  component: FoodComponent
): { ingredient: Ingredient | undefined; yieldFactor: YieldFactor | undefined } {
  const ingredient = data.ingredients.find(i => i.id === component.ingredientId);
  const yieldFactor = data.yieldFactors.find(y => y.ingredientId === component.ingredientId);
  return { ingredient, yieldFactor };
}
