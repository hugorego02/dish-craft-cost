// Camada central de cálculos — funções puras e tipadas
export { ingredientCostPerGram, ingredientCostPerUnit, ingredientCostForDisplayUnit } from './ingredient';
export { getYieldFactorValue, cookedToRawWeight } from './yield';
export { componentCostForWeight } from './component';
export { plateTotalCost, platePrice, plateProfit, plateMargin, plateFinancials } from './plate';
export type { PlateFinancials } from './plate';
export { priceByMarkup, priceByMargin, unitProfit, realMargin } from './pricing';
