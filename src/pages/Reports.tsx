import { useApp } from "@/contexts/AppContext";
import { getPlateCost, getPlatePrice, FOOD_GROUP_LABELS, getComponentCostForWeight } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  const { ingredients, yieldFactors, components, plateSizes, plates, extraCosts } = useApp();

  const plateDetails = plates.filter(p => p.active).map(p => {
    const cost = getPlateCost(p, components, ingredients, yieldFactors, extraCosts);
    const price = getPlatePrice(p, cost);
    const size = plateSizes.find(ps => ps.id === p.plateSizeId);

    const compDetails = p.components.map(pc => {
      const comp = components.find(c => c.id === pc.componentId);
      if (!comp) return null;
      const ing = ingredients.find(i => i.id === comp.ingredientId);
      if (!ing) return null;
      const yf = yieldFactors.find(y => y.ingredientId === comp.ingredientId);
      const factor = yf?.factor ?? 1;
      const rawWeight = pc.weight / factor;
      const compCost = getComponentCostForWeight(pc.weight, ing, yf);
      return { comp, ing, factor, rawWeight, weight: pc.weight, cost: compCost };
    }).filter(Boolean);

    const ecDetails = p.extraCostIds.map(id => extraCosts.find(e => e.id === id)).filter(Boolean);

    return { plate: p, size, cost, price, profit: price - cost, margin: price > 0 ? ((price - cost) / price) * 100 : 0, compDetails, ecDetails };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada de custos e margens</p>
      </div>

      {plateDetails.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum prato ativo para análise. Monte seus pratos primeiro.
        </CardContent></Card>
      ) : (
        plateDetails.map(pd => (
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
                    {pd.compDetails.map((cd: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{cd.comp.name}</td>
                        <td className="py-2 text-muted-foreground">{FOOD_GROUP_LABELS[cd.comp.group as keyof typeof FOOD_GROUP_LABELS]}</td>
                        <td className="py-2 text-right">{cd.weight}g</td>
                        <td className="py-2 text-right font-mono">{cd.factor.toFixed(2)}</td>
                        <td className="py-2 text-right font-mono">{cd.rawWeight.toFixed(1)}g</td>
                        <td className="py-2 text-right font-bold">${cd.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                    {pd.ecDetails.map((ec: any) => (
                      <tr key={ec.id} className="border-b last:border-0 text-muted-foreground">
                        <td className="py-2" colSpan={5}>{ec.name} ({ec.category})</td>
                        <td className="py-2 text-right font-bold">${ec.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-accent/50 rounded-lg p-4 grid grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-muted-foreground">Custo</p><p className="text-lg font-bold">${pd.cost.toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground">Preço</p><p className="text-lg font-bold">${pd.price.toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold text-success">${pd.profit.toFixed(2)}</p></div>
                <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{pd.margin.toFixed(1)}%</p></div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
