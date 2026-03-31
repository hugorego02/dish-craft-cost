import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePlateAnalytics } from "@/hooks/usePlateAnalytics";
import { FOOD_GROUP_LABELS } from "@/types";
import { componentCostForWeight, cookedToRawWeight, getYieldFactorValue } from "@/lib/calculations";
import { resolveComponentDeps } from "@/lib/calculations/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Users } from "lucide-react";

/* ── Plates report (existing) ── */
function PlatesReport() {
  const ctx = useApp();
  const { fmt } = useCurrency();
  const { components, extraCosts } = ctx;
  const { items, loading } = usePlateAnalytics();

  if (loading) {
    return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  }

  if (items.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        Nenhum prato ativo para análise. Monte seus pratos primeiro.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map(pd => {
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
                        <td className="py-2 text-right font-bold">{fmt(ec.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-accent/50 rounded-lg p-4 grid grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-muted-foreground">Custo</p><p className="text-lg font-bold">{fmt(pd.totalCost)}</p></div>
                <div><p className="text-xs text-muted-foreground">Preço</p><p className="text-lg font-bold">{fmt(pd.price)}</p></div>
                <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold text-success">{fmt(pd.profit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{pd.margin.toFixed(1)}%</p></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Clients / Orders report ── */
function ClientsReport() {
  const { orders, customers, plates, components, ingredients, yieldFactors, extraCosts } = useApp();
  const { fmt } = useCurrency();
  const { items: plateAnalytics } = usePlateAnalytics();

  // Build a cost map from plateAnalytics
  const plateCostMap = useMemo(() => {
    const map: Record<string, { cost: number; price: number }> = {};
    plateAnalytics.forEach(pa => {
      map[pa.plate.id] = { cost: pa.totalCost, price: pa.price };
    });
    return map;
  }, [plateAnalytics]);

  // Group orders by customer
  const customerReport = useMemo(() => {
    const grouped: Record<string, {
      customer: typeof customers[0] | null;
      orders: typeof orders;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      totalItems: number;
    }> = {};

    orders.forEach(order => {
      const cId = order.customerId || '_no_customer';
      if (!grouped[cId]) {
        const cust = customers.find(c => c.id === order.customerId) || null;
        grouped[cId] = { customer: cust, orders: [], totalRevenue: 0, totalCost: 0, totalProfit: 0, totalItems: 0 };
      }
      const g = grouped[cId];
      g.orders.push(order);

      order.items.forEach(item => {
        const itemRevenue = item.unitPrice * item.quantity;
        const plateCost = item.plateId && plateCostMap[item.plateId] ? plateCostMap[item.plateId].cost : 0;
        const itemCost = plateCost * item.quantity;
        g.totalRevenue += itemRevenue;
        g.totalCost += itemCost;
        g.totalItems += item.quantity;
      });

      // Apply discount
      g.totalRevenue -= order.discount;
    });

    // Recalc profit
    Object.values(grouped).forEach(g => {
      g.totalProfit = g.totalRevenue - g.totalCost;
    });

    return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders, customers, plateCostMap]);

  if (orders.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        Nenhum pedido registrado. Crie pedidos para ver o relatório de clientes.
      </CardContent></Card>
    );
  }

  const grandRevenue = customerReport.reduce((s, c) => s + c.totalRevenue, 0);
  const grandCost = customerReport.reduce((s, c) => s + c.totalCost, 0);
  const grandProfit = grandRevenue - grandCost;
  const grandMargin = grandRevenue > 0 ? (grandProfit / grandRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Grand totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Receita Total</p>
          <p className="text-xl font-bold">{fmt(grandRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Custo Total</p>
          <p className="text-xl font-bold">{fmt(grandCost)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Lucro Bruto</p>
          <p className="text-xl font-bold text-success">{fmt(grandProfit)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">Margem Bruta</p>
          <p className="text-xl font-bold">{grandMargin.toFixed(1)}%</p>
        </CardContent></Card>
      </div>

      {/* Per-customer breakdown */}
      {customerReport.map((cr, idx) => {
        const margin = cr.totalRevenue > 0 ? (cr.totalProfit / cr.totalRevenue) * 100 : 0;
        return (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="font-display flex items-center justify-between">
                <span>{cr.customer?.name || 'Sem cliente'}</span>
                <Badge variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"}>
                  Margem {margin.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Orders table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Pedido</th>
                    <th className="text-left py-2">Itens</th>
                    <th className="text-right py-2">Receita</th>
                    <th className="text-right py-2">Custo</th>
                    <th className="text-right py-2">Lucro</th>
                    <th className="text-right py-2">Margem</th>
                  </tr></thead>
                  <tbody>
                    {cr.orders.map(order => {
                      let orderRevenue = 0;
                      let orderCost = 0;
                      order.items.forEach(item => {
                        orderRevenue += item.unitPrice * item.quantity;
                        const pc = item.plateId && plateCostMap[item.plateId] ? plateCostMap[item.plateId].cost : 0;
                        orderCost += pc * item.quantity;
                      });
                      orderRevenue -= order.discount;
                      const orderProfit = orderRevenue - orderCost;
                      const orderMargin = orderRevenue > 0 ? (orderProfit / orderRevenue) * 100 : 0;

                      return (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-2">
                            {order.items.map((it, i) => (
                              <div key={i} className="text-xs">
                                {it.quantity}× {it.plateName}
                              </div>
                            ))}
                          </td>
                          <td className="py-2 text-right">{fmt(orderRevenue)}</td>
                          <td className="py-2 text-right">{fmt(orderCost)}</td>
                          <td className="py-2 text-right font-bold text-success">{fmt(orderProfit)}</td>
                          <td className="py-2 text-right">
                            <span className={orderMargin >= 30 ? 'text-success' : orderMargin >= 15 ? 'text-warning' : 'text-destructive'}>
                              {orderMargin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Customer totals */}
              <div className="bg-accent/50 rounded-lg p-4 grid grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-muted-foreground">Receita</p><p className="text-lg font-bold">{fmt(cr.totalRevenue)}</p></div>
                <div><p className="text-xs text-muted-foreground">Custo</p><p className="text-lg font-bold">{fmt(cr.totalCost)}</p></div>
                <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold text-success">{fmt(cr.totalProfit)}</p></div>
                <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{margin.toFixed(1)}%</p></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Main page ── */
export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada de custos, margens e rentabilidade</p>
      </div>

      <Tabs defaultValue="plates">
        <TabsList>
          <TabsTrigger value="plates" className="gap-2">
            <UtensilsCrossed className="h-4 w-4" /> Pratos
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plates" className="mt-4">
          <PlatesReport />
        </TabsContent>
        <TabsContent value="clients" className="mt-4">
          <ClientsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
