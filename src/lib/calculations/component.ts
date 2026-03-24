import type { Ingredient, YieldFactor } from '@/types';
import { ingredientCostPerGram } from './ingredient';
import { cookedToRawWeight } from './yield';

/**
 * Custo de um componente para um peso pronto (g).
 * Converte para peso cru via fator de rendimento antes de calcular.
 */
export function componentCostForWeight(
  cookedWeight: number,
  ingredient: Ingredient,
  yieldFactor: YieldFactor | undefined
): number {
  const rawWeight = cookedToRawWeight(cookedWeight, yieldFactor);
  return rawWeight * ingredientCostPerGram(ingredient);
}
