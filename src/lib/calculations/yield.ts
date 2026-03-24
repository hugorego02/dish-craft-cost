import type { YieldFactor } from '@/types';

/**
 * Retorna o fator de rendimento, ou 1 se não existir.
 */
export function getYieldFactorValue(yf: YieldFactor | undefined): number {
  return yf ? yf.factor : 1;
}

/**
 * Converte peso pronto em peso cru necessário.
 */
export function cookedToRawWeight(cookedWeight: number, yf: YieldFactor | undefined): number {
  const factor = getYieldFactorValue(yf);
  if (factor === 0) return 0;
  return cookedWeight / factor;
}
