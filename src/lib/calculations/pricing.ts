/**
 * Preço sugerido por markup (custo × multiplicador).
 */
export function priceByMarkup(cost: number, markup: number): number {
  return cost * markup;
}

/**
 * Preço sugerido por margem alvo (%).
 */
export function priceByMargin(cost: number, marginPercent: number): number {
  const divisor = 1 - marginPercent / 100;
  if (divisor <= 0) return 0;
  return cost / divisor;
}

/**
 * Lucro unitário.
 */
export function unitProfit(price: number, cost: number): number {
  return price - cost;
}

/**
 * Margem real em percentual (0-100).
 */
export function realMargin(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}
