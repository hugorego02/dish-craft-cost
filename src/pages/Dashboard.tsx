import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlateAnalytics, type PlateAnalytics, type PricingStatus } from "@/hooks/usePlateAnalytics";
import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  ShoppingCart, ChefHat, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Search, ArrowUpDown, Trophy, Target, AlertCircle,
  BarChart3, Eye, ChevronLeft, ChevronRight, Lightbulb, ArrowDown, ArrowUp,
  Minus, Filter
} from "lucide-react";

// ── Status config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<PricingStatus, { label: string; color: string; icon: typeof AlertTriangle; dot: string }> = {
  'healthy':    { label: 'Saudável',    color: 'bg-success/15 text-success border-success/30',              icon: TrendingUp,    dot: 'bg-success' },
  'attention':  { label: 'Atenção',     color: 'bg-warning/15 text-warning-foreground border-warning/30',   icon: AlertTriangle, dot: 'bg-warning' },
  'low-margin': { label: 'Margem Baixa',color: 'bg-destructive/15 text-destructive border-destructive/30', icon: TrendingDown,  dot: 'bg-destructive' },
  'no-price':   { label: 'Sem Preço',   color: 'bg-muted text-muted-foreground border-border',             icon: AlertCircle,   dot: 'bg-muted-foreground' },
  'high-cost':  { label: 'Custo Alto',  color: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertTriangle, dot: 'bg-destructive' },
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

// ── Sort ────────────────────────────────────────────────────────────────
type SortKey = 'name' | 'totalCost' | 'componentsCost' | 'extrasCost' | 'price' | 'profit' | 'margin' | 'costPerGram';

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

const PAGE_SIZE = 20;

const CHART_COLORS = {
  profit: 'hsl(145, 55%, 40%)',
  margin: 'hsl(145, 45%, 28%)',
  cost: 'hsl(35, 60%, 52%)',
  attention: 'hsl(0, 72%, 51%)',
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// ── Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { plateSizes } = useApp();
  const { fmt, symbol } = useCurrency();
  const { items, aggregate, loading } = usePlateAnalytics();

  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("margin");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter + sort
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Status counts
  const statusCounts = useMemo(() => {
    const c: Record<PricingStatus, number> = { healthy: 0, attention: 0, 'low-margin': 0, 'no-price': 0, 'high-cost': 0 };
    items.forEach(p => c[p.status]++);
    return c;
  }, [items]);

  // Global insights
  const insights = useMemo(() => {
    const r: { text: string; type: 'warning' | 'success' | 'info'; icon: typeof AlertTriangle }[] = [];
    if (items.length === 0) return r;
    const lowMargin = items.filter(p => p.price > 0 && p.margin < 25);
    if (lowMargin.length) r.push({ text: `${lowMargin.length} prato(s) com margem abaixo de 25%`, type: 'warning', icon: TrendingDown });
    const noPrice = items.filter(p => p.price <= 0);
    if (noPrice.length) r.push({ text: `${noPrice.length} prato(s) sem preço definido`, type: 'warning', icon: AlertCircle });
    const highCost = items.filter(p => p.totalCost > aggregate.avgCost * 1.4);
    if (highCost.length) r.push({ text: `${highCost.length} prato(s) com custo 40%+ acima da média`, type: 'warning', icon: AlertTriangle });
    const highOp = items.filter(p => p.extrasCost > p.componentsCost * 0.3 && p.componentsCost > 0);
    if (highOp.length) r.push({ text: `${highOp.length} prato(s) com custo operacional proporcionalmente alto`, type: 'info', icon: BarChart3 });
    const healthy = items.filter(p => p.status === 'healthy');
    if (healthy.length === items.length) r.push({ text: 'Todos os pratos estão com margens saudáveis!', type: 'success', icon: TrendingUp });
    else if (healthy.length) r.push({ text: `${healthy.length} prato(s) com excelente equilíbrio custo/lucro`, type: 'success', icon: TrendingUp });
    return r;
  }, [items, aggregate]);

  // Chart data
  const chartProfit = useMemo(() => [...items].filter(p => p.price > 0).sort((a, b) => b.profit - a.profit).slice(0, 8), [items]);
  const chartMargin = useMemo(() => [...items].filter(p => p.price > 0).sort((a, b) => b.margin - a.margin).slice(0, 8), [items]);
  const chartCost = useMemo(() => [...items].sort((a, b) => b.totalCost - a.totalCost).slice(0, 8), [items]);
  const chartAttention = useMemo(() => items.filter(p => p.status !== 'healthy').slice(0, 8), [items]);

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    );
  }

  // ── Empty ───────────────────────────────────────────────────────────
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
            </p>
            <Button onClick={() => navigate("/ingredients")} className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Cadastrar Insumos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'name'); }
    setPage(1);
  };

  const SortHeader = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th className={`py-3 px-2 cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap ${className}`} onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k ? (sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-25" />}
      </span>
    </th>
  );

  const kpis = [
    { label: "Pratos Ativos", value: String(aggregate.activePlates), sub: `de ${aggregate.totalPlates} total`, icon: ChefHat, accent: "text-primary" },
    { label: "Custo Médio", value: fmt(aggregate.avgCost), sub: "por prato", icon: ShoppingCart, accent: "text-secondary" },
    { label: "Preço Médio", value: fmt(aggregate.avgPrice), sub: "de venda", icon: DollarSign, accent: "text-info" },
    { label: "Margem Média", value: `${aggregate.avgMargin.toFixed(1)}%`, sub: aggregate.avgMargin >= 40 ? "saudável" : aggregate.avgMargin >= 25 ? "atenção" : "baixa", icon: TrendingUp, accent: aggregate.avgMargin >= 40 ? "text-success" : aggregate.avgMargin >= 25 ? "text-warning" : "text-destructive" },
  ];

  const highlights: { label: string; plate: PlateAnalytics | null; metric: string; icon: typeof Trophy; accent: string }[] = [
    { label: "Mais Lucrativo", plate: aggregate.mostProfitable, metric: aggregate.mostProfitable ? fmt(aggregate.mostProfitable.profit) : "—", icon: Trophy, accent: "text-success" },
    { label: "Melhor Margem", plate: aggregate.bestMargin, metric: aggregate.bestMargin ? `${aggregate.bestMargin.margin.toFixed(1)}%` : "—", icon: TrendingUp, accent: "text-primary" },
    { label: "Menor Custo", plate: aggregate.lowestCost, metric: aggregate.lowestCost ? fmt(aggregate.lowestCost.totalCost) : "—", icon: ArrowDown, accent: "text-info" },
    { label: "Pior Margem", plate: aggregate.worstMargin, metric: aggregate.worstMargin ? `${aggregate.worstMargin.margin.toFixed(1)}%` : "—", icon: Target, accent: "text-destructive" },
    { label: "Maior Custo", plate: aggregate.highestCost, metric: aggregate.highestCost ? fmt(aggregate.highestCost.totalCost) : "—", icon: AlertTriangle, accent: "text-secondary" },
    { label: "Menos Lucrativo", plate: aggregate.leastProfitable, metric: aggregate.leastProfitable ? fmt(aggregate.leastProfitable.profit) : "—", icon: TrendingDown, accent: "text-destructive" },
  ];

  const marginColor = (pa: PlateAnalytics) =>
    pa.price <= 0 ? "text-muted-foreground" :
    pa.margin >= 40 ? "text-success" :
    pa.margin >= 25 ? "text-warning-foreground" :
    "text-destructive";

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão executiva e comparativa do cardápio</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => navigate("/reports")}>
          <BarChart3 className="h-4 w-4" /> Relatórios Detalhados
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <p className="text-2xl font-bold font-display">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(statusCounts) as [PricingStatus, number][]).filter(([, c]) => c > 0).map(([st, cnt]) => {
          const cfg = STATUS_CONFIG[st];
          const active = statusFilter === st;
          return (
            <button key={st} onClick={() => { setStatusFilter(active ? "all" : st); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all
                ${active ? cfg.color + ' ring-2 ring-ring' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
            >
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.label} ({cnt})
            </button>
          );
        })}
        {statusFilter !== "all" && (
          <button onClick={() => { setStatusFilter("all"); setPage(1); }} className="text-xs text-muted-foreground underline ml-1">Limpar</button>
        )}
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {highlights.map(h => (
          <Card key={h.label} className="border-dashed">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex items-center gap-1.5 mb-1">
                <h.icon className={`h-3.5 w-3.5 ${h.accent}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h.label}</span>
              </div>
              <p className="font-display font-bold text-sm truncate" title={h.plate?.plate.name}>{h.plate?.plate.name ?? "—"}</p>
              <p className={`text-xs font-semibold ${h.accent}`}>{h.metric}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" /> Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                const bg = ins.type === 'warning' ? 'bg-warning/10 border-warning/20' : ins.type === 'success' ? 'bg-success/10 border-success/20' : 'bg-info/10 border-info/20';
                const ic = ins.type === 'warning' ? 'text-warning-foreground' : ins.type === 'success' ? 'text-success' : 'text-info';
                return (
                  <div key={i} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${ic}`} />
                    <span className="text-xs">{ins.text}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {chartProfit.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm">Comparação Visual</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profit" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="profit" className="text-xs">Top Lucro</TabsTrigger>
                <TabsTrigger value="margin" className="text-xs">Top Margem</TabsTrigger>
                <TabsTrigger value="cost" className="text-xs">Maior Custo</TabsTrigger>
                <TabsTrigger value="attention" className="text-xs">Atenção</TabsTrigger>
              </TabsList>
              <TabsContent value="profit">
                <MiniBarChart data={chartProfit.map(p => ({ name: truncate(p.plate.name, 18), value: p.profit }))} color={CHART_COLORS.profit} prefix={symbol} />
              </TabsContent>
              <TabsContent value="margin">
                <MiniBarChart data={chartMargin.map(p => ({ name: truncate(p.plate.name, 18), value: +p.margin.toFixed(1) }))} color={CHART_COLORS.margin} suffix="%" />
              </TabsContent>
              <TabsContent value="cost">
                <MiniBarChart data={chartCost.map(p => ({ name: truncate(p.plate.name, 18), value: p.totalCost }))} color={CHART_COLORS.cost} prefix={symbol} />
              </TabsContent>
              <TabsContent value="attention">
                {chartAttention.length > 0
                  ? <MiniBarChart data={chartAttention.map(p => ({ name: truncate(p.plate.name, 18), value: p.margin }))} color={CHART_COLORS.attention} suffix="%" />
                  : <p className="text-sm text-muted-foreground text-center py-8">Nenhum prato precisa de atenção 🎉</p>
                }
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* ── Main Comparison Table ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="font-display text-base">Comparação de Pratos</CardTitle>
              <Badge variant="secondary" className="text-xs">{filtered.length} resultado(s)</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar prato..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 w-48 text-sm" />
              </div>
              <Select value={sizeFilter} onValueChange={v => { setSizeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Tamanho" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tamanhos</SelectItem>
                  {plateSizes.filter(ps => ps.active).map(ps => <SelectItem key={ps.id} value={ps.id}>{ps.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Filter className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum prato encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="border-b text-muted-foreground text-[11px] uppercase tracking-wider">
                      <SortHeader label="Prato" k="name" className="text-left pl-6" />
                      <th className="py-3 px-2 text-left">Tamanho</th>
                      <SortHeader label="Custo Alim." k="componentsCost" className="text-right" />
                      <SortHeader label="Custo Op." k="extrasCost" className="text-right" />
                      <SortHeader label="Custo Total" k="totalCost" className="text-right" />
                      <SortHeader label={`${symbol}/g`} k="costPerGram" className="text-right" />
                      <SortHeader label="Preço" k="price" className="text-right" />
                      <SortHeader label="Lucro" k="profit" className="text-right" />
                      <SortHeader label="Margem" k="margin" className="text-right" />
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-left">Insight</th>
                      <th className="py-3 px-2 pr-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(pa => {
                      const isExpanded = expandedId === pa.plate.id;
                      return (
                        <React.Fragment key={pa.plate.id}>
                          <tr
                            className={`border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group ${isExpanded ? 'bg-muted/30' : ''}`}
                            onClick={() => setExpandedId(isExpanded ? null : pa.plate.id)}
                          >
                            <td className="py-3 px-2 pl-6 font-medium">{pa.plate.name}</td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">{pa.size?.name ?? "—"}</td>
                            <td className="py-3 px-2 text-right font-mono text-xs">{fmt(pa.componentsCost)}</td>
                            <td className="py-3 px-2 text-right font-mono text-xs">{fmt(pa.extrasCost)}</td>
                            <td className="py-3 px-2 text-right font-mono font-semibold">{fmt(pa.totalCost)}</td>
                            <td className="py-3 px-2 text-right font-mono text-xs text-muted-foreground">{pa.costPerGram > 0 ? pa.costPerGram.toFixed(4) : "—"}</td>
                            <td className="py-3 px-2 text-right font-mono">{pa.price > 0 ? fmt(pa.price) : "—"}</td>
                            <td className={`py-3 px-2 text-right font-mono font-semibold ${pa.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {pa.price > 0 ? fmt(pa.profit) : "—"}
                            </td>
                            <td className={`py-3 px-2 text-right font-semibold ${marginColor(pa)}`}>
                              {pa.price > 0 ? `${pa.margin.toFixed(1)}%` : "—"}
                            </td>
                            <td className="py-3 px-2 text-center"><StatusBadge status={pa.status} /></td>
                            <td className="py-3 px-2 text-xs text-muted-foreground max-w-[160px] truncate" title={pa.insight ?? ""}>
                              {pa.insight ?? <Minus className="h-3 w-3 text-muted-foreground/30" />}
                            </td>
                            <td className="py-3 px-2 pr-6 text-right">
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={e => { e.stopPropagation(); navigate("/reports"); }}>
                                <Eye className="h-3 w-3" /> Relatório
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/20">
                              <td colSpan={12} className="px-6 py-4">
                                <ExpandedRow pa={pa} fmt={fmt} symbol={symbol} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {paginationRange(safePage, totalPages).map((p, i) =>
                      p === '...' ? <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span> : (
                        <Button key={p} variant={p === safePage ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p as number)}>{p}</Button>
                      )
                    )}
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bottom summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Lucro Bruto Médio</p>
            <p className="text-2xl font-bold font-display">{fmt(aggregate.avgProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">por prato vendido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Distribuição de Status</p>
            <div className="flex gap-0.5 mt-2 h-3 rounded-full overflow-hidden">
              {(Object.entries(statusCounts) as [PricingStatus, number][]).filter(([,c]) => c > 0).map(([st, cnt]) => (
                <div key={st} className={`${STATUS_CONFIG[st].dot} transition-all`} style={{ width: `${(cnt / items.length) * 100}%` }} title={`${STATUS_CONFIG[st].label}: ${cnt}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {(Object.entries(statusCounts) as [PricingStatus, number][]).filter(([,c]) => c > 0).map(([st, cnt]) => (
                <span key={st} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[st].dot}`} />{STATUS_CONFIG[st].label} {cnt}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Expanded Row ────────────────────────────────────────────────────────
function ExpandedRow({ pa, fmt, symbol }: { pa: PlateAnalytics; fmt: (n: number) => string; symbol: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Peso Total</p>
        <p className="font-semibold">{pa.totalWeight > 0 ? `${pa.totalWeight}g` : "—"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Custo por Grama</p>
        <p className="font-semibold font-mono">{pa.costPerGram > 0 ? `${symbol} ${pa.costPerGram.toFixed(4)}` : "—"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Relação Custo/Preço</p>
        <p className="font-semibold">{pa.costRatio > 0 ? `${(pa.costRatio * 100).toFixed(1)}%` : "—"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Eficiência Financeira</p>
        <p className="font-semibold">{pa.price > 0 ? `${(pa.profit / pa.price * 100).toFixed(1)}%` : "—"}</p>
      </div>
      {pa.insight && (
        <div className="col-span-2 md:col-span-4">
          <p className="text-xs text-muted-foreground mb-1">Insight</p>
          <p className="text-sm font-medium">{pa.insight}</p>
        </div>
      )}
    </div>
  );
}

// ── Chart ───────────────────────────────────────────────────────────────
function MiniBarChart({ data, color, prefix = "", suffix = "" }: { data: { name: string; value: number }[]; color: string; prefix?: string; suffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
        <RTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => [`${prefix} ${value.toFixed(2)}${suffix}`, '']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((_, i) => <Cell key={i} fill={color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Pagination range ────────────────────────────────────────────────────
function paginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
