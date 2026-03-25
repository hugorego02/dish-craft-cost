import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlateAnalytics, type PlateAnalytics, type PricingStatus } from "@/hooks/usePlateAnalytics";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart, UtensilsCrossed, ChefHat, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Search, ArrowUpDown, ArrowRight, Trophy, Target, AlertCircle,
  BarChart3, Eye
} from "lucide-react";

// ── Status helpers ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<PricingStatus, { label: string; color: string; icon: typeof AlertTriangle }> = {
  'healthy': { label: 'Saudável', color: 'bg-success/15 text-success border-success/30', icon: TrendingUp },
  'attention': { label: 'Atenção', color: 'bg-warning/15 text-warning-foreground border-warning/30', icon: AlertTriangle },
  'low-margin': { label: 'Margem Baixa', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: TrendingDown },
  'no-price': { label: 'Sem Preço', color: 'bg-muted text-muted-foreground border-border', icon: AlertCircle },
  'high-cost': { label: 'Custo Alto', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: PricingStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} gap-1 text-xs font-medium`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function fmt(v: number) {
  return `R$ ${v.toFixed(2)}`;
}

// ── Sorting ─────────────────────────────────────────────────────────────
type SortKey = 'name' | 'totalCost' | 'price' | 'profit' | 'margin';

function sortItems(items: PlateAnalytics[], key: SortKey, asc: boolean): PlateAnalytics[] {
  return [...items].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (key === 'name') { va = a.plate.name.toLowerCase(); vb = b.plate.name.toLowerCase(); }
    else { va = a[key]; vb = b[key]; }
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { plateSizes } = useApp();
  const { items, aggregate, loading } = usePlateAnalytics();

  // Filters
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.plate.name.toLowerCase().includes(q));
    }
    if (sizeFilter !== "all") list = list.filter(p => p.plate.plateSizeId === sizeFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    return sortItems(list, sortKey, sortAsc);
  }, [items, search, sizeFilter, statusFilter, sortKey, sortAsc]);

  // Insights
  const insights = useMemo(() => {
    const result: { text: string; type: 'warning' | 'success' | 'info'; icon: typeof AlertTriangle }[] = [];
    if (items.length === 0) return result;

    const lowMargin = items.filter(p => p.price > 0 && p.margin < 25);
    if (lowMargin.length > 0) {
      result.push({ text: `${lowMargin.length} prato(s) com margem abaixo de 25%`, type: 'warning', icon: TrendingDown });
    }

    const noPrice = items.filter(p => p.price <= 0);
    if (noPrice.length > 0) {
      result.push({ text: `${noPrice.length} prato(s) sem preço definido`, type: 'warning', icon: AlertCircle });
    }

    const avgCost = aggregate.avgCost;
    const highCost = items.filter(p => p.totalCost > avgCost * 1.4);
    if (highCost.length > 0) {
      result.push({ text: `${highCost.length} prato(s) com custo 40%+ acima da média`, type: 'warning', icon: AlertTriangle });
    }

    const highExtras = items.filter(p => p.extrasCost > p.componentsCost * 0.3 && p.componentsCost > 0);
    if (highExtras.length > 0) {
      result.push({ text: `${highExtras.length} prato(s) com custo operacional proporcionalmente alto`, type: 'info', icon: BarChart3 });
    }

    const healthy = items.filter(p => p.status === 'healthy');
    if (healthy.length > 0 && healthy.length === items.length) {
      result.push({ text: 'Todos os pratos estão com margens saudáveis!', type: 'success', icon: TrendingUp });
    } else if (healthy.length > 0) {
      result.push({ text: `${healthy.length} prato(s) com excelente equilíbrio custo/lucro`, type: 'success', icon: TrendingUp });
    }

    return result;
  }, [items, aggregate]);

  // Rankings
  const topByProfit = useMemo(() => [...items].filter(p => p.price > 0).sort((a, b) => b.profit - a.profit).slice(0, 5), [items]);
  const topByMargin = useMemo(() => [...items].filter(p => p.price > 0).sort((a, b) => b.margin - a.margin).slice(0, 5), [items]);
  const topByCost = useMemo(() => [...items].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5), [items]);
  const needsAttention = useMemo(() => items.filter(p => p.status !== 'healthy').slice(0, 5), [items]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72 mt-2" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu negócio de alimentação</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <ChefHat className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Comece cadastrando seus pratos</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Siga o menu lateral na ordem: Insumos → Rendimento → Componentes → Tamanhos → Pratos.
              Cada etapa constrói o custo real do seu prato.
            </p>
            <Button onClick={() => navigate("/ingredients")} className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Cadastrar Insumos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = [
    { label: "Pratos Ativos", value: String(aggregate.activePlates), icon: ChefHat, accent: "text-primary" },
    { label: "Custo Médio", value: fmt(aggregate.avgCost), icon: ShoppingCart, accent: "text-secondary" },
    { label: "Preço Médio", value: fmt(aggregate.avgPrice), icon: DollarSign, accent: "text-info" },
    { label: "Margem Média", value: `${aggregate.avgMargin.toFixed(1)}%`, icon: TrendingUp, accent: "text-success" },
  ];

  const highlightCards = [
    { label: "Mais Lucrativo", plate: aggregate.mostProfitable, metric: aggregate.mostProfitable ? fmt(aggregate.mostProfitable.profit) : "—", icon: Trophy, accent: "text-success" },
    { label: "Maior Custo", plate: aggregate.highestCost, metric: aggregate.highestCost ? fmt(aggregate.highestCost.totalCost) : "—", icon: AlertTriangle, accent: "text-secondary" },
    { label: "Pior Margem", plate: aggregate.worstMargin, metric: aggregate.worstMargin ? `${aggregate.worstMargin.margin.toFixed(1)}%` : "—", icon: Target, accent: "text-destructive" },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const SortHeader = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={`py-3 px-3 cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && <ArrowUpDown className="h-3 w-3" />}
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão executiva do seu negócio</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => navigate("/reports")}>
          <BarChart3 className="h-4 w-4" /> Ver Relatórios Completos
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <p className="text-2xl font-bold font-display">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlightCards.map(h => (
          <Card key={h.label} className="border-dashed">
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className={`rounded-lg p-2.5 bg-muted`}>
                <h.icon className={`h-5 w-5 ${h.accent}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{h.label}</p>
                <p className="font-display font-bold truncate">{h.plate?.plate.name ?? "—"}</p>
                <p className={`text-sm font-semibold ${h.accent}`}>{h.metric}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((ins, i) => {
              const Icon = ins.icon;
              const bg = ins.type === 'warning' ? 'bg-warning/10 border-warning/20' : ins.type === 'success' ? 'bg-success/10 border-success/20' : 'bg-info/10 border-info/20';
              const ic = ins.type === 'warning' ? 'text-warning-foreground' : ins.type === 'success' ? 'text-success' : 'text-info';
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${bg}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${ic}`} />
                  <span className="text-sm">{ins.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankingCard title="Top Lucro" items={topByProfit} metric={p => fmt(p.profit)} accent="text-success" icon={Trophy} />
        <RankingCard title="Top Margem" items={topByMargin} metric={p => `${p.margin.toFixed(1)}%`} accent="text-primary" icon={TrendingUp} />
        <RankingCard title="Maior Custo" items={topByCost} metric={p => fmt(p.totalCost)} accent="text-secondary" icon={ShoppingCart} />
        <RankingCard title="Precisam de Atenção" items={needsAttention} metric={p => <StatusBadge status={p.status} />} accent="text-destructive" icon={AlertTriangle} />
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="font-display text-base">Comparação de Pratos</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 w-44 text-sm"
                />
              </div>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="Tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tamanhos</SelectItem>
                  {plateSizes.filter(ps => ps.active).map(ps => (
                    <SelectItem key={ps.id} value={ps.id}>{ps.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum prato encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <SortHeader label="Prato" k="name" className="text-left pl-6" />
                    <th className="py-3 px-3 text-left">Tamanho</th>
                    <SortHeader label="Custo Alim." k="totalCost" className="text-right" />
                    <th className="py-3 px-3 text-right">Custo Op.</th>
                    <SortHeader label="Custo Final" k="totalCost" className="text-right" />
                    <SortHeader label="Preço" k="price" className="text-right" />
                    <SortHeader label="Lucro" k="profit" className="text-right" />
                    <SortHeader label="Margem" k="margin" className="text-right" />
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 pr-6 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pa => {
                    const marginColor = pa.price <= 0 ? "text-muted-foreground" :
                      pa.margin >= 40 ? "text-success" :
                      pa.margin >= 25 ? "text-warning-foreground" :
                      "text-destructive";
                    return (
                      <tr key={pa.plate.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-3 pl-6 font-medium">{pa.plate.name}</td>
                        <td className="py-3 px-3 text-muted-foreground">{pa.size?.name ?? "—"}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs">{fmt(pa.componentsCost)}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs">{fmt(pa.extrasCost)}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">{fmt(pa.totalCost)}</td>
                        <td className="py-3 px-3 text-right font-mono">{pa.price > 0 ? fmt(pa.price) : "—"}</td>
                        <td className={`py-3 px-3 text-right font-mono font-semibold ${pa.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {pa.price > 0 ? fmt(pa.profit) : "—"}
                        </td>
                        <td className={`py-3 px-3 text-right font-semibold ${marginColor}`}>
                          {pa.price > 0 ? `${pa.margin.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-center"><StatusBadge status={pa.status} /></td>
                        <td className="py-3 px-3 pr-6 text-right">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/reports")}>
                            <Eye className="h-3 w-3" /> Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Ranking Card ────────────────────────────────────────────────────────
function RankingCard({ title, items, metric, accent, icon: Icon }: {
  title: string;
  items: PlateAnalytics[];
  metric: (p: PlateAnalytics) => React.ReactNode;
  accent: string;
  icon: typeof Trophy;
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-sm flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((pa, i) => (
          <div key={pa.plate.id} className="flex items-center justify-between py-1.5 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}.</span>
              <span className="text-sm truncate">{pa.plate.name}</span>
            </div>
            <span className={`text-sm font-semibold shrink-0 ml-2 ${typeof metric(pa) === 'string' ? accent : ''}`}>
              {metric(pa)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
