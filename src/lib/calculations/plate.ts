import type { Plate, FoodComponent, Ingredient, YieldFactor, ExtraCost } from '@/types';
import { componentCostForWeight } from './component';

export interface PlateFinancials {
  componentsCost: number;
  extrasCost: number;
  totalCost: number;
  price: number;
  profit: number;
  margin: number; // 0-100
}

/**
 * Custo total do prato (componentes + custos extras selecionados).
 */
export function plateTotalCost(
  plate: Plate,
  components: FoodComponent[],
  ingredients: Ingredient[],
  yieldFactors: YieldFactor[],
  extraCosts: ExtraCost[]
): { componentsCost: number; extrasCost: number; totalCost: number } {
  let componentsCost = 0;
  for (const pc of plate.components) {
    const comp = components.find(c => c.id === pc.componentId);
    if (!comp) continue;
    const ing = ingredients.find(i => i.id === comp.ingredientId);
    if (!ing) continue;
    const yf = yieldFactors.find(y => y.ingredientId === comp.ingredientId);
    componentsCost += componentCostForWeight(pc.weight, ing, yf);
  }

  let extrasCost = 0;
  for (const ecId of plate.extraCostIds) {
    const ec = extraCosts.find(e => e.id === ecId);
    if (ec) extrasCost += ec.value;
  }

  return { componentsCost, extrasCost, totalCost: componentsCost + extrasCost };
}

/**
 * Preço de venda do prato, baseado no método de precificação.
 */
export function platePrice(plate: Plate, totalCost: number): number {
  if (plate.pricingMethod === 'manual' && plate.manualPrice != null) return plate.manualPrice;
  if (plate.pricingMethod === 'markup' && plate.markupOrMargin != null) return totalCost * plate.markupOrMargin;
  if (plate.pricingMethod === 'margin' && plate.markupOrMargin != null) {
    const divisor = 1 - plate.markupOrMargin / 100;
    if (divisor <= 0) return 0;
    return totalCost / divisor;
  }
  return 0;
}

/**
 * Lucro unitário do prato.
 */
export function plateProfit(price: number, totalCost: number): number {
  return price - totalCost;
}

/**
 * Margem real do prato em percentual (0-100).
 */
export function plateMargin(price: number, totalCost: number): number {
  if (price <= 0) return 0;
  return ((price - totalCost) / price) * 100;
}

/**
 * Todas as métricas financeiras do prato em uma chamada.
 */
export function plateFinancials(
  plate: Plate,
  components: FoodComponent[],
  ingredients: Ingredient[],
  yieldFactors: YieldFactor[],
  extraCosts: ExtraCost[]
): PlateFinancials {
  const costs = plateTotalCost(plate, components, ingredients, yieldFactors, extraCosts);
  const price = platePrice(plate, costs.totalCost);
  const profit = plateProfit(price, costs.totalCost);
  const margin = plateMargin(price, costs.totalCost);
  return { ...costs, price, profit, margin };
}
