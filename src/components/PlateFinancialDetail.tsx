import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { componentCostForWeight, plateFinancials } from '@/lib/calculations';
import { resolveComponentDeps } from '@/lib/calculations/selectors';
import type { Plate } from '@/types';
import { FOOD_GROUP_LABELS } from '@/types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, DollarSign, Scale, Flame, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  plate: Plate;
}

interface InsightEntry {
  text: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

const MARGIN_EXCELLENT = 50;
const MARGIN_HEALTHY = 40;
const MARGIN_ATTENTION = 25;
const MARGIN_CRITICAL = 15;

function getMarginColor(margin: number): string {
  if (margin >= MARGIN_EXCELLENT) return 'text-success';
  if (margin >= MARGIN_HEALTHY) return 'text-success';
  if (margin >= MARGIN_ATTENTION) return 'text-warning';
  return 'text-destructive';
}

function getMarginBadge(margin: number, price: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (price <= 0) return { label: 'Sem preço', variant: 'destructive' };
  if (margin >= MARGIN_EXCELLENT) return { label: 'Excelente', variant: 'default' };
  if (margin >= MARGIN_HEALTHY) return { label: 'Saudável', variant: 'default' };
  if (margin >= MARGIN_ATTENTION) return { label: 'Atenção', variant: 'secondary' };
  if (margin >= MARGIN_CRITICAL) return { label: 'Margem baixa', variant: 'destructive' };
  return { label: 'Crítico', variant: 'destructive' };
}

export default function PlateFinancialDetail({ plate }: Props) {
  const ctx = useApp();
  const { fmt } = useCurrency();
  const { components, ingredients, yieldFactors, extraCosts, plateSizes } = ctx;

  const data = useMemo(() => {
    const fin = plateFinancials(plate, components, ingredients, yieldFactors, extraCosts);
    const size = plateSizes.find(ps => ps.id === plate.plateSizeId);
    const totalWeight = size?.totalWeight ?? 0;
    const costPerGram = totalWeight > 0 ? fin.totalCost / totalWeight : 0;
    const costRatio = fin.price > 0 ? fin.totalCost / fin.price : 0;
    const operationalRatio = fin.componentsCost > 0 ? fin.extrasCost / fin.componentsCost : 0;

    // Per-component breakdown
    const compBreakdown = plate.components.map(pc => {
      const comp = components.find(c => c.id === pc.componentId);
      if (!comp) return null;
      const { ingredient, yieldFactor } = resolveComponentDeps(ctx, comp);
      if (!ingredient) return null;
      const cost = componentCostForWeight(pc.weight, ingredient, yieldFactor);
      return { name: comp.name, group: comp.group, weight: pc.weight, cost };
    }).filter(Boolean) as { name: string; group: string; weight: number; cost: number }[];

    const ecBreakdown = plate.extraCostIds.map(id => extraCosts.find(e => e.id === id)).filter(Boolean);

    // Auto insights
    const insights: InsightEntry[] = [];
    if (fin.price <= 0) {
      insights.push({ text: 'Preço de venda não definido — defina para ver métricas de lucro', type: 'danger' });
    } else {
      if (fin.margin >= MARGIN_EXCELLENT) insights.push({ text: 'Excelente equilíbrio entre custo e preço de venda', type: 'success' });
      else if (fin.margin >= MARGIN_HEALTHY) insights.push({ text: 'Lucro saudável — margem dentro do esperado', type: 'success' });
      else if (fin.margin >= MARGIN_ATTENTION) insights.push({ text: 'Margem apertada — considere ajustar o preço de venda', type: 'warning' });
      else if (fin.margin >= MARGIN_CRITICAL) insights.push({ text: 'Margem baixa — revisar custo ou preço urgentemente', type: 'danger' });
      else insights.push({ text: 'Margem crítica — prato provavelmente dá prejuízo', type: 'danger' });

      if (costRatio > 0.75) insights.push({ text: 'Custo representa mais de 75% do preço — muito elevado', type: 'danger' });
      else if (costRatio > 0.6) insights.push({ text: 'Custo representa mais de 60% do preço', type: 'warning' });
    }

    if (operationalRatio > 0.4 && fin.componentsCost > 0) {
      insights.push({ text: 'Custo operacional proporcionalmente alto em relação aos alimentos', type: 'warning' });
    }

    if (fin.profit < 0) insights.push({ text: 'Este prato está dando prejuízo!', type: 'danger' });

    return { fin, size, totalWeight, costPerGram, costRatio, operationalRatio, compBreakdown, ecBreakdown, insights };
  }, [plate, components, ingredients, yieldFactors, extraCosts, plateSizes, ctx]);

  const { fin, size, totalWeight, costPerGram, costRatio, compBreakdown, ecBreakdown, insights } = data;
  const marginBadge = getMarginBadge(fin.margin, fin.price);

  const insightIcon = (type: InsightEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
      case 'danger': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
      case 'info': return <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    }
  };

  // Visual bar proportions
  const maxVal = Math.max(fin.totalCost, fin.price, 1);
  const costPct = (fin.totalCost / maxVal) * 100;
  const pricePct = (fin.price / maxVal) * 100;

  return (
    <div className="space-y-4 pt-2">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <Package className="h-3 w-3" /> Custo Final
          </div>
          <p className="text-lg font-bold font-mono">{fmt(fin.totalCost)}</p>
        </div>
        <div className="bg-muted/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" /> Preço de Venda
          </div>
          <p className="text-lg font-bold font-mono">{fmt(fin.price)}</p>
        </div>
        <div className="bg-muted/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" /> Lucro Bruto
          </div>
          <p className={`text-lg font-bold font-mono ${fin.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {fmt(fin.profit)}
          </p>
        </div>
        <div className="bg-muted/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <Flame className="h-3 w-3" /> Margem
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className={`text-lg font-bold font-mono ${getMarginColor(fin.margin)}`}>{fin.margin.toFixed(1)}%</p>
            <Badge variant={marginBadge.variant} className="text-[10px] px-1.5 py-0">{marginBadge.label}</Badge>
          </div>
        </div>
      </div>

      {/* Visual comparison bar */}
      <div className="bg-muted/40 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Comparação Custo × Preço</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">Custo</span>
            <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-destructive/70 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${Math.max(costPct, 5)}%` }}
              >
                <span className="text-[10px] font-mono text-destructive-foreground">{fmt(fin.totalCost)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">Preço</span>
            <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${Math.max(pricePct, 5)}%` }}
              >
                <span className="text-[10px] font-mono text-primary-foreground">{fmt(fin.price)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">Lucro</span>
            <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-success/70 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${Math.max((fin.profit / maxVal) * 100, 5)}%` }}
              >
                <span className="text-[10px] font-mono text-success-foreground">{fmt(fin.profit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="bg-muted/40 rounded-lg p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Resumo Financeiro Detalhado</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Custo dos alimentos</span>
          <span className="text-right font-mono">{fmt(fin.componentsCost)}</span>

          <span className="text-muted-foreground">Custo operacional</span>
          <span className="text-right font-mono">{fmt(fin.extrasCost)}</span>

          <span className="text-muted-foreground font-semibold">Custo final</span>
          <span className="text-right font-mono font-semibold">{fmt(fin.totalCost)}</span>

          <span className="text-muted-foreground">Preço de venda</span>
          <span className="text-right font-mono font-semibold">{fmt(fin.price)}</span>

          <span className="text-muted-foreground">Lucro bruto</span>
          <span className={`text-right font-mono font-semibold ${fin.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(fin.profit)}</span>

          <span className="text-muted-foreground">Margem</span>
          <span className={`text-right font-mono font-semibold ${getMarginColor(fin.margin)}`}>{fin.margin.toFixed(1)}%</span>

          {totalWeight > 0 && (
            <>
              <span className="text-muted-foreground">Custo por grama</span>
              <span className="text-right font-mono">{fmt(costPerGram)}/g</span>

              <span className="text-muted-foreground">Peso total</span>
              <span className="text-right font-mono">{totalWeight}g</span>
            </>
          )}

          {fin.price > 0 && (
            <>
              <span className="text-muted-foreground">Relação custo/preço</span>
              <span className="text-right font-mono">{(costRatio * 100).toFixed(1)}%</span>
            </>
          )}
        </div>
      </div>

      {/* Component cost breakdown */}
      {compBreakdown.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Custo por Componente</p>
          <div className="space-y-1">
            {compBreakdown.map((cb, i) => {
              const pct = fin.componentsCost > 0 ? (cb.cost / fin.componentsCost) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{cb.name}</span>
                  <span className="text-xs text-muted-foreground">{cb.weight}g</span>
                  <span className="font-mono w-20 text-right">{fmt(cb.cost)}</span>
                  <div className="w-16">
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
            {ecBreakdown.map((ec: any) => (
              <div key={ec.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex-1 truncate">{ec.name}</span>
                <span className="text-xs">{ec.category}</span>
                <span className="font-mono w-20 text-right">{fmt(ec.value)}</span>
                <div className="w-16" />
                <span className="w-10" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto insights */}
      {insights.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Diagnóstico Automático</p>
          <div className="space-y-1.5">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {insightIcon(ins.type)}
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
