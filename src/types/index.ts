export type PurchaseUnit = 'lb' | 'kg' | 'g' | 'oz' | 'un' | 'L' | 'ml';

export const UNIT_TO_GRAMS: Record<PurchaseUnit, number> = {
  lb: 453.592,
  kg: 1000,
  g: 1,
  oz: 28.3495,
  un: 1,
  L: 1000,
  ml: 1,
};

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: PurchaseUnit;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface YieldFactor {
  id: string;
  ingredientId: string;
  rawWeight: number;
  cookedWeight: number;
  factor: number; // cooked/raw
  method?: string;
  notes?: string;
}

export interface FoodComponent {
  id: string;
  name: string;
  ingredientId: string;
  yieldFactorId?: string;
  group: FoodGroup;
  notes?: string;
}

export type FoodGroup = 'protein' | 'carb' | 'grain' | 'veggie' | 'sauce' | 'extra';

export const FOOD_GROUP_LABELS: Record<FoodGroup, string> = {
  protein: 'Proteína',
  carb: 'Carboidrato',
  grain: 'Grão',
  veggie: 'Legume/Verdura',
  sauce: 'Molho',
  extra: 'Adicional',
};

export interface PlateGroupConfig {
  group: FoodGroup;
  defaultWeight: number;
  minWeight: number;
  maxWeight: number;
  increment: number;
  required: boolean;
}

export interface PlateSize {
  id: string;
  name: string;
  description?: string;
  totalWeight: number;
  groups: PlateGroupConfig[];
  active: boolean;
  notes?: string;
}

export interface PlateComponent {
  componentId: string;
  weight: number; // actual served weight
}

export interface Plate {
  id: string;
  name: string;
  plateSizeId: string;
  type: 'standard' | 'customizable';
  components: PlateComponent[];
  extraCostIds: string[];
  manualPrice?: number;
  pricingMethod: 'manual' | 'markup' | 'margin';
  markupOrMargin?: number;
  notes?: string;
  active: boolean;
}

export interface ExtraCost {
  id: string;
  name: string;
  value: number;
  applyPer: 'plate' | 'batch' | 'order';
  category: string;
  notes?: string;
}

export interface AppData {
  ingredients: Ingredient[];
  yieldFactors: YieldFactor[];
  components: FoodComponent[];
  plateSizes: PlateSize[];
  plates: Plate[];
  extraCosts: ExtraCost[];
}

// Calculation helpers
export function getCostPerGram(ingredient: Ingredient): number {
  const totalGrams = ingredient.quantity * UNIT_TO_GRAMS[ingredient.unit];
  return ingredient.price / totalGrams;
}

export function getYieldFactor(yf: YieldFactor | undefined): number {
  return yf ? yf.factor : 1;
}

export function getComponentCostForWeight(
  weight: number,
  ingredient: Ingredient,
  yieldFactor: YieldFactor | undefined
): number {
  const factor = getYieldFactor(yieldFactor);
  const rawWeight = weight / factor;
  const costPerGram = getCostPerGram(ingredient);
  return rawWeight * costPerGram;
}

export function getPlateCost(
  plate: Plate,
  components: FoodComponent[],
  ingredients: Ingredient[],
  yieldFactors: YieldFactor[],
  extraCosts: ExtraCost[]
): number {
  let total = 0;
  for (const pc of plate.components) {
    const comp = components.find(c => c.id === pc.componentId);
    if (!comp) continue;
    const ing = ingredients.find(i => i.id === comp.ingredientId);
    if (!ing) continue;
    const yf = yieldFactors.find(y => y.ingredientId === comp.ingredientId);
    total += getComponentCostForWeight(pc.weight, ing, yf);
  }
  for (const ecId of plate.extraCostIds) {
    const ec = extraCosts.find(e => e.id === ecId);
    if (ec) total += ec.value;
  }
  return total;
}

export function getPlatePrice(plate: Plate, cost: number): number {
  if (plate.pricingMethod === 'manual' && plate.manualPrice != null) return plate.manualPrice;
  if (plate.pricingMethod === 'markup' && plate.markupOrMargin != null) return cost * plate.markupOrMargin;
  if (plate.pricingMethod === 'margin' && plate.markupOrMargin != null) return cost / (1 - plate.markupOrMargin / 100);
  return 0;
}
