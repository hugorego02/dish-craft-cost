import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePlateAnalytics } from "@/hooks/usePlateAnalytics";
import { FOOD_GROUP_LABELS } from "@/types";
import { componentCostForWeight, cookedToRawWeight, getYieldFactorValue } from "@/lib/calculations";
import { resolveComponentDeps } from "@/lib/calculations/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const ctx = useApp();
  const { fmt } = useCurrency();
  const { components, plateSizes, extraCosts } = ctx;
  const { items, loading } = usePlateAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72 mt-2" /></div>
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada de custos e margens</p>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum prato ativo para análise. Monte seus pratos primeiro.
        </CardContent></Card>
      ) : (
        items.map(pd => {
          const compDetails = pd.plate.components.map(pc => {
            const comp = components.find(c => c.id === pc.componentId);
            if (!comp) return null;
            const { ingredient, yieldFactor } = resolveComponentDeps(ctx, comp);
            if (!ingredient) return null;
            const factor = getYieldFactorValue(yieldFactor);
            const rawWeight = cookedToRawWeight(pc.weight, yieldFactor);
            const compCost = componentCostForWeight(pc.weight, ingredient, yieldFactor);
            return { comp, ing: ingredient, factor, rawWeight, weight: pc.weight, cost: compCost };
          }).filter(Boolean);

          const ecDetails = pd.plate.extraCostIds.map(id => extraCosts.find(e => e.id === id)).filter(Boolean);

          return (
            <Card key={pd.plate.id}>
              <CardHeader>
                <CardTitle className="font-display flex items-center justify-between">
                  <span>{pd.plate.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">{pd.size?.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Componente</th>
                      <th className="text-left py-2">Grupo</th>
                      <th className="text-right py-2">Porção</th>
                      <th className="text-right py-2">Fator</th>
                      <th className="text-right py-2">Peso cru</th>
                      <th className="text-right py-2">Custo</th>
                    </tr></thead>
                    <tbody>
                      {compDetails.map((cd: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{cd.comp.name}</td>
                          <td className="py-2 text-muted-foreground">{FOOD_GROUP_LABELS[cd.comp.group as keyof typeof FOOD_GROUP_LABELS]}</td>
                          <td className="py-2 text-right">{cd.weight}g</td>
                          <td className="py-2 text-right font-mono">{cd.factor.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono">{cd.rawWeight.toFixed(1)}g</td>
                          <td className="py-2 text-right font-bold">{fmt(cd.cost)}</td>
                        </tr>
                      ))}
                      {ecDetails.map((ec: any) => (
                        <tr key={ec.id} className="border-b last:border-0 text-muted-foreground">
                          <td className="py-2" colSpan={5}>{ec.name} ({ec.category})</td>
                          <td className="py-2 text-right font-bold">R$ {ec.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-accent/50 rounded-lg p-4 grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Custo</p><p className="text-lg font-bold">R$ {pd.totalCost.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Preço</p><p className="text-lg font-bold">R$ {pd.price.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold text-success">R$ {pd.profit.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{pd.margin.toFixed(1)}%</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
