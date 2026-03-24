import { useApp } from "@/contexts/AppContext";
import { plateFinancials } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, UtensilsCrossed, ChefHat, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { ingredients, yieldFactors, components, plateSizes, plates, extraCosts } = useApp();

  const plateCosts = plates.filter(p => p.active).map(p => {
    const fin = plateFinancials(p, components, ingredients, yieldFactors, extraCosts);
    return { plate: p, ...fin };
  });

  const avgMargin = plateCosts.length > 0
    ? plateCosts.reduce((s, p) => s + p.margin, 0) / plateCosts.length
    : 0;

  const stats = [
    { label: "Insumos", value: ingredients.length, icon: ShoppingCart, color: "text-secondary" },
    { label: "Componentes", value: components.length, icon: UtensilsCrossed, color: "text-primary" },
    { label: "Pratos Ativos", value: plates.filter(p => p.active).length, icon: ChefHat, color: "text-accent-foreground" },
    { label: "Margem Média", value: `${avgMargin.toFixed(1)}%`, icon: DollarSign, color: "text-success" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio de alimentação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plateCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Resumo dos Pratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Prato</th>
                    <th className="text-right py-2 px-4">Custo</th>
                    <th className="text-right py-2 px-4">Preço</th>
                    <th className="text-right py-2 px-4">Lucro</th>
                    <th className="text-right py-2 pl-4">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {plateCosts.map(pc => (
                    <tr key={pc.plate.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{pc.plate.name}</td>
                      <td className="text-right py-2 px-4">${pc.totalCost.toFixed(2)}</td>
                      <td className="text-right py-2 px-4">${pc.price.toFixed(2)}</td>
                      <td className="text-right py-2 px-4 text-success">${pc.profit.toFixed(2)}</td>
                      <td className="text-right py-2 pl-4">{pc.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {plates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">Comece cadastrando seus insumos</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Siga o menu lateral na ordem: Insumos → Rendimento → Componentes → Tamanhos → Pratos.
              Cada etapa constrói o custo real do seu prato.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}