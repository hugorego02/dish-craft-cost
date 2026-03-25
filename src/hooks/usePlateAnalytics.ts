import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { plateFinancials, type PlateFinancials } from '@/lib/calculations';
import type { Plate, PlateSize } from '@/types';

export type PricingStatus = 'healthy' | 'attention' | 'low-margin' | 'no-price' | 'high-cost';

export interface PlateAnalytics extends PlateFinancials {
  plate: Plate;
  size: PlateSize | undefined;
  status: PricingStatus;
}

export interface AggregateMetrics {
  totalPlates: number;
  activePlates: number;
  avgCost: number;
  avgPrice: number;
  avgProfit: number;
  avgMargin: number;
  mostProfitable: PlateAnalytics | null;
  highestCost: PlateAnalytics | null;
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

export function usePlateAnalytics() {
  const ctx = useApp();
  const { ingredients, yieldFactors, components, plateSizes, plates, extraCosts, loading } = ctx;

  const analytics = useMemo(() => {
    const activePlates = plates.filter(p => p.active);

    // First pass: compute financials
    const raw: (PlateAnalytics & { _tmpStatus?: true })[] = activePlates.map(plate => {
      const fin = plateFinancials(plate, components, ingredients, yieldFactors, extraCosts);
      const size = plateSizes.find(ps => ps.id === plate.plateSizeId);
      return { plate, size, ...fin, status: 'healthy' as PricingStatus };
    });

    // Compute avg cost for status derivation
    const avgCost = raw.length > 0
      ? raw.reduce((s, p) => s + p.totalCost, 0) / raw.length
      : 0;

    // Second pass: derive status
    const items: PlateAnalytics[] = raw.map(pa => ({
      ...pa,
      status: derivePricingStatus(pa, avgCost),
    }));

    const withPrice = items.filter(p => p.price > 0);

    const avgPrice = withPrice.length > 0
      ? withPrice.reduce((s, p) => s + p.price, 0) / withPrice.length
      : 0;

    const avgProfit = withPrice.length > 0
      ? withPrice.reduce((s, p) => s + p.profit, 0) / withPrice.length
      : 0;

    const avgMargin = withPrice.length > 0
      ? withPrice.reduce((s, p) => s + p.margin, 0) / withPrice.length
      : 0;

    const mostProfitable = withPrice.length > 0
      ? withPrice.reduce((best, p) => p.profit > best.profit ? p : best)
      : null;

    const highestCost = items.length > 0
      ? items.reduce((best, p) => p.totalCost > best.totalCost ? p : best)
      : null;

    const worstMargin = withPrice.length > 0
      ? withPrice.reduce((best, p) => p.margin < best.margin ? p : best)
      : null;

    const aggregate: AggregateMetrics = {
      totalPlates: plates.length,
      activePlates: items.length,
      avgCost,
      avgPrice,
      avgProfit,
      avgMargin,
      mostProfitable,
      highestCost,
      worstMargin,
    };

    return { items, aggregate };
  }, [ingredients, yieldFactors, components, plateSizes, plates, extraCosts]);

  return { ...analytics, loading };
}
