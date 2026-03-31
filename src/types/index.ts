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

export type CustomerStatus = 'active' | 'inactive' | 'vip';

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  vip: 'VIP',
};

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  dietaryRestrictions: string[];
  preferences: string[];
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
}

export interface AppData {
  ingredients: Ingredient[];
  yieldFactors: YieldFactor[];
  components: FoodComponent[];
  plateSizes: PlateSize[];
  plates: Plate[];
  extraCosts: ExtraCost[];
  customers: Customer[];
}

// ---- Legacy calculation helpers (delegam para src/lib/calculations) ----
// Mantidos para compatibilidade; prefira importar de @/lib/calculations.
import { ingredientCostPerGram } from '@/lib/calculations/ingredient';
import { componentCostForWeight } from '@/lib/calculations/component';
import { plateTotalCost, platePrice as _platePrice } from '@/lib/calculations/plate';

/** @deprecated Use ingredientCostPerGram de @/lib/calculations */
export function getCostPerGram(ingredient: Ingredient): number {
  return ingredientCostPerGram(ingredient);
}

/** @deprecated Use getYieldFactorValue de @/lib/calculations */
export function getYieldFactor(yf: YieldFactor | undefined): number {
  return yf ? yf.factor : 1;
}

/** @deprecated Use componentCostForWeight de @/lib/calculations */
export function getComponentCostForWeight(
  weight: number,
  ingredient: Ingredient,
  yieldFactor: YieldFactor | undefined
): number {
  return componentCostForWeight(weight, ingredient, yieldFactor);
}

/** @deprecated Use plateTotalCost de @/lib/calculations */
export function getPlateCost(
  plate: Plate,
  components: FoodComponent[],
  ingredients: Ingredient[],
  yieldFactors: YieldFactor[],
  extraCosts: ExtraCost[]
): number {
  return plateTotalCost(plate, components, ingredients, yieldFactors, extraCosts).totalCost;
}

/** @deprecated Use platePrice de @/lib/calculations */
export function getPlatePrice(plate: Plate, cost: number): number {
  return _platePrice(plate, cost);
}
