import type { Ingredient } from '@/types';
import { UNIT_TO_GRAMS } from '@/types';

/**
 * Custo por grama do insumo bruto.
 * Sem arredondamento — precisão total.
 */
export function ingredientCostPerGram(ingredient: Ingredient): number {
  const totalGrams = ingredient.quantity * UNIT_TO_GRAMS[ingredient.unit];
  if (totalGrams === 0) return 0;
  return ingredient.price / totalGrams;
}

/**
 * Custo por unidade de compra (preço / quantidade).
 */
export function ingredientCostPerUnit(ingredient: Ingredient): number {
  if (ingredient.quantity === 0) return 0;
  return ingredient.price / ingredient.quantity;
}

/**
 * Custo do insumo em uma unidade de exibição arbitrária.
 * multiplier = gramas equivalentes (1 para g, 1000 para kg, 453.592 para lb).
 */
export function ingredientCostForDisplayUnit(ingredient: Ingredient, gramsMultiplier: number): number {
  return ingredientCostPerGram(ingredient) * gramsMultiplier;
}
