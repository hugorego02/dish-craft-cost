import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { plateFinancials, type PlateFinancials } from '@/lib/calculations';
import type { Plate, PlateSize } from '@/types';

export type PricingStatus = 'healthy' | 'attention' | 'low-margin' | 'no-price' | 'high-cost';

export interface PlateAnalytics extends PlateFinancials {
  plate: Plate;
  size: PlateSize | undefined;
  status: PricingStatus;
  costPerGram: number;
  totalWeight: number;
  costRatio: number; // totalCost / price (0-1)
  insight: string | null;
}

export interface AggregateMetrics {
  totalPlates: number;
  activePlates: number;
  avgCost: number;
  avgPrice: number;
  avgProfit: number;
  avgMargin: number;
  mostProfitable: PlateAnalytics | null;
  leastProfitable: PlateAnalytics | null;
  highestCost: PlateAnalytics | null;
  lowestCost: PlateAnalytics | null;
  bestMargin: PlateAnalytics | null;
  worstMargin: PlateAnalytics | null;
}

const MARGIN_HEALTHY = 40;
const MARGIN_ATTENTION = 25;

function derivePricingStatus(pa: PlateFinancials, avgCost: number): PricingStatus {
  if (pa.price <= 0) return 'no-price';
  if (pa.totalCost > avgCost * 1.4) return 'high-cost';
  if (pa.margin < MARGIN_ATTENTION) return 'low-margin';
  if (pa.margin < MARGIN_HEALTHY) return 'attention';
  return 'healthy';
}

function deriveInsight(
  pa: { status: PricingStatus } & PlateFinancials & { costPerGram: number; extrasCost: number; componentsCost: number },
  avgCost: number,
  avgMargin: number,
): string | null {
  if (pa.price <= 0) return 'Preço de venda não definido';
  if (pa.margin < 15) return 'Margem crítica — revisar preço ou custo';
  if (pa.margin < MARGIN_ATTENTION) return 'Margem baixa — considere ajustar o preço';
  if (pa.totalCost > avgCost * 1.5) return 'Custo muito acima da média';
  if (pa.totalCost > avgCost * 1.3) return 'Custo acima da média';
  if (pa.extrasCost > pa.componentsCost * 0.4 && pa.componentsCost > 0) return 'Custo operacional proporcionalmente alto';
  if (pa.margin > 50 && pa.profit > 0) return 'Excelente equilíbrio custo/lucro';
  if (pa.margin > avgMargin * 1.2 && avgMargin > 0) return 'Performance acima da média';
  return null;
}

export function usePlateAnalytics() {
  const ctx = useApp();
  const { ingredients, yieldFactors, components, plateSizes, plates, extraCosts, loading } = ctx;

  const analytics = useMemo(() => {
    const activePlates = plates.filter(p => p.active);

    // First pass: financials + weight
    const raw = activePlates.map(plate => {
      const fin = plateFinancials(plate, components, ingredients, yieldFactors, extraCosts);
      const size = plateSizes.find(ps => ps.id === plate.plateSizeId);
      const totalWeight = size?.totalWeight ?? 0;
      const costPerGram = totalWeight > 0 ? fin.totalCost / totalWeight : 0;
      const costRatio = fin.price > 0 ? fin.totalCost / fin.price : 0;
      return { plate, size, ...fin, costPerGram, totalWeight, costRatio, status: 'healthy' as PricingStatus, insight: null as string | null };
    });

    const avgCost = raw.length > 0 ? raw.reduce((s, p) => s + p.totalCost, 0) / raw.length : 0;
    const withPrice = raw.filter(p => p.price > 0);
    const avgMargin = withPrice.length > 0 ? withPrice.reduce((s, p) => s + p.margin, 0) / withPrice.length : 0;

    // Second pass: status + insight
    const items: PlateAnalytics[] = raw.map(pa => {
      const status = derivePricingStatus(pa, avgCost);
      const insight = deriveInsight({ ...pa, status }, avgCost, avgMargin);
      return { ...pa, status, insight };
    });

    const avgPrice = withPrice.length > 0 ? withPrice.reduce((s, p) => s + p.price, 0) / withPrice.length : 0;
    const avgProfit = withPrice.length > 0 ? withPrice.reduce((s, p) => s + p.profit, 0) / withPrice.length : 0;

    const find = (arr: typeof raw, cmp: (a: typeof raw[0], b: typeof raw[0]) => boolean) =>
      arr.length > 0 ? arr.reduce((best, p) => cmp(p, best) ? p : best) : null;

    const mostProfitableRaw = find(withPrice, (a, b) => a.profit > b.profit);
    const leastProfitableRaw = find(withPrice, (a, b) => a.profit < b.profit);
    const highestCostRaw = find(raw, (a, b) => a.totalCost > b.totalCost);
    const lowestCostRaw = find(raw, (a, b) => a.totalCost < b.totalCost);
    const bestMarginRaw = find(withPrice, (a, b) => a.margin > b.margin);
    const worstMarginRaw = find(withPrice, (a, b) => a.margin < b.margin);

    const toItem = (r: typeof raw[0] | null) => r ? items.find(i => i.plate.id === r.plate.id) ?? null : null;

    const aggregate: AggregateMetrics = {
      totalPlates: plates.length,
      activePlates: items.length,
      avgCost, avgPrice, avgProfit, avgMargin,
      mostProfitable: toItem(mostProfitableRaw),
      leastProfitable: toItem(leastProfitableRaw),
      highestCost: toItem(highestCostRaw),
      lowestCost: toItem(lowestCostRaw),
      bestMargin: toItem(bestMarginRaw),
      worstMargin: toItem(worstMarginRaw),
    };

    return { items, aggregate };
  }, [ingredients, yieldFactors, components, plateSizes, plates, extraCosts]);

  return { ...analytics, loading };
}
