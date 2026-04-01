import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Plate, PlateComponent } from "@/types";
import { FOOD_GROUP_LABELS } from "@/types";
import { componentCostForWeight, plateFinancials, platePrice as calcPlatePrice, priceByMarkup, priceByMargin, realMargin, unitProfit } from "@/lib/calculations";
import { resolveComponentDeps } from "@/lib/calculations/selectors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Pencil, Info, ChevronDown, ChevronUp, BarChart3, UtensilsCrossed } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import PlateFinancialDetail from "@/components/PlateFinancialDetail";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

export default function Plates() {
  const ctx = useApp();
  const { fmt, symbol } = useCurrency();
  const { components, plateSizes, plates, extraCosts, addPlate, updatePlate, deletePlate } = ctx;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Plate>>({
    name: '', plateSizeId: '', type: 'standard', components: [], extraCostIds: [],
    pricingMethod: 'manual', manualPrice: 0, markupOrMargin: 0, active: true,
  });

  const selectedSize = plateSizes.find(ps => ps.id === form.plateSizeId);

  const handleOpen = (item?: Plate) => {
    if (item) { setEditing(item); setForm(item); }
    else {
      setEditing(null);
      setForm({ name: '', plateSizeId: '', type: 'standard', components: [], extraCostIds: [], pricingMethod: 'manual', manualPrice: 0, active: true });
    }
    setOpen(true);
  };

  const handleSizeChange = (sizeId: string) => {
    const size = plateSizes.find(ps => ps.id === sizeId);
    if (!size) return;
    const comps: PlateComponent[] = [];
    for (const g of size.groups) {
      const matching = components.filter(c => c.group === g.group);
      if (matching.length > 0) {
        comps.push({ componentId: matching[0].id, weight: g.defaultWeight });
      }
    }
    setForm({ ...form, plateSizeId: sizeId, components: comps });
  };

  const updatePc = (idx: number, patch: Partial<PlateComponent>) => {
    const pcs = [...(form.components || [])];
    pcs[idx] = { ...pcs[idx], ...patch };
    setForm({ ...form, components: pcs });
  };

  const addPc = () => {
    setForm({ ...form, components: [...(form.components || []), { componentId: '', weight: 100 }] });
  };

  const removePc = (idx: number) => {
    const pcs = [...(form.components || [])];
    pcs.splice(idx, 1);
    setForm({ ...form, components: pcs });
  };

  // Custo calculado dinamicamente a partir dos dados-base
  const cost = useMemo(() => {
    if (!form.components?.length) return 0;
    let total = 0;
    for (const pc of form.components) {
      const comp = components.find(c => c.id === pc.componentId);
      if (!comp) continue;
      const { ingredient, yieldFactor } = resolveComponentDeps(ctx, comp);
      if (!ingredient) continue;
      total += componentCostForWeight(pc.weight, ingredient, yieldFactor);
    }
    for (const ecId of (form.extraCostIds || [])) {
      const ec = extraCosts.find(e => e.id === ecId);
      if (ec) total += ec.value;
    }
    return total;
  }, [form.components, form.extraCostIds, components, ctx, extraCosts]);

  const price = useMemo(() => {
    if (form.pricingMethod === 'manual') return form.manualPrice || 0;
    if (form.pricingMethod === 'markup') return priceByMarkup(cost, form.markupOrMargin || 0);
    if (form.pricingMethod === 'margin') return priceByMargin(cost, form.markupOrMargin || 0);
    return 0;
  }, [form.pricingMethod, form.manualPrice, form.markupOrMargin, cost]);

  const profit = unitProfit(price, cost);
  const margin = realMargin(price, cost);

  const handleSave = () => {
    if (!form.name || !form.plateSizeId) { toast.error("Preencha nome e tamanho"); return; }
    const item: Plate = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      plateSizeId: form.plateSizeId!,
      type: form.type || 'standard',
      components: form.components || [],
      extraCostIds: form.extraCostIds || [],
      pricingMethod: form.pricingMethod || 'manual',
      manualPrice: form.manualPrice,
      markupOrMargin: form.markupOrMargin,
      notes: form.notes,
      active: form.active ?? true,
    };
    if (editing) { updatePlate(item); toast.success("Prato atualizado"); }
    else { addPlate(item); toast.success("Prato criado"); }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Pratos</h1>
          <p className="text-muted-foreground mt-1">Monte pratos com componentes e calcule preços</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Prato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Prato</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Marmita Fit Frango" /></div>
                <div>
                  <Label>Tamanho do prato</Label>
                  <Select value={form.plateSizeId} onValueChange={handleSizeChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {plateSizes.filter(ps => ps.active).map(ps => <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.totalWeight}g)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as 'standard' | 'customizable' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão (quantidades fixas)</SelectItem>
                    <SelectItem value="customizable">Personalizável (cliente ajusta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Componentes do prato</Label>
                  <Button variant="outline" size="sm" onClick={addPc}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                </div>
                {(form.components || []).map((pc, i) => {
                  const comp = components.find(c => c.id === pc.componentId);
                  const groupConfig = selectedSize?.groups.find(g => comp && g.group === comp.group);
                  const deps = comp ? resolveComponentDeps(ctx, comp) : { ingredient: undefined, yieldFactor: undefined };
                  const pcCost = (deps.ingredient && comp) ? componentCostForWeight(pc.weight, deps.ingredient, deps.yieldFactor) : 0;

                  return (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                        <div>
                          <Label className="text-xs">Componente</Label>
                          <Select value={pc.componentId} onValueChange={v => updatePc(i, { componentId: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {components.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({FOOD_GROUP_LABELS[c.group]})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Peso (g)</Label>
                          <Input type="number" className="h-8 text-xs" value={pc.weight} onChange={e => updatePc(i, { weight: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePc(i)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {form.type === 'customizable' && groupConfig && (
                        <div className="mt-2">
                          <Slider
                            min={groupConfig.minWeight}
                            max={groupConfig.maxWeight}
                            step={groupConfig.increment}
                            value={[pc.weight]}
                            onValueChange={([v]) => updatePc(i, { weight: v })}
                            className="mt-1"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{groupConfig.minWeight}g</span>
                            <span className="font-medium">{pc.weight}g</span>
                            <span>{groupConfig.maxWeight}g</span>
                          </div>
                        </div>
                      )}
                      {pcCost > 0 && <p className="text-xs text-right mt-1 font-mono">Custo: {fmt(pcCost)}</p>}
                    </div>
                  );
                })}
              </div>

              <div>
                <Label>Custos extras (selecione os que se aplicam a este prato)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {extraCosts.map(ec => (
                    <Button
                      key={ec.id}
                      variant={(form.extraCostIds || []).includes(ec.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const ids = form.extraCostIds || [];
                        setForm({ ...form, extraCostIds: ids.includes(ec.id) ? ids.filter(x => x !== ec.id) : [...ids, ec.id] });
                      }}
                    >
                      {ec.name} — {fmt(ec.value)}
                      <span className="ml-1 text-xs opacity-70">({ec.category})</span>
                    </Button>
                  ))}
                  {extraCosts.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum custo extra cadastrado. Cadastre em "Custos Extras" primeiro.</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Método de precificação</Label>
                <Select value={form.pricingMethod} onValueChange={v => setForm({ ...form, pricingMethod: v as Plate['pricingMethod'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Preço manual</SelectItem>
                    <SelectItem value="markup">Markup (multiplicador)</SelectItem>
                    <SelectItem value="margin">Margem desejada (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.pricingMethod === 'manual' && (
                <div><Label>Preço de venda ({symbol})</Label><Input type="number" step="0.01" value={form.manualPrice || ''} onChange={e => setForm({ ...form, manualPrice: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {form.pricingMethod === 'markup' && (
                <div><Label>Markup (ex: 2.5 = custo × 2.5)</Label><Input type="number" step="0.1" value={form.markupOrMargin || ''} onChange={e => setForm({ ...form, markupOrMargin: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {form.pricingMethod === 'margin' && (
                <div className="space-y-3">
                  <div>
                    <Label>Margem desejada (%)</Label>
                    <Input type="number" step="1" min="0" max="99" value={form.markupOrMargin || ''} onChange={e => setForm({ ...form, markupOrMargin: parseFloat(e.target.value) || 0 })} />
                  </div>
                  {cost > 0 && (form.markupOrMargin || 0) > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-primary">Preço sugerido para {form.markupOrMargin}% de margem:</p>
                      <p className="text-2xl font-bold text-primary">{fmt(price)}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Label className="text-xs whitespace-nowrap text-muted-foreground">Ajustar manualmente:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm"
                          placeholder={price.toFixed(2)}
                          value={form.manualPrice || ''}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            setForm({ ...form, manualPrice: v || undefined });
                          }}
                        />
                      </div>
                      {form.manualPrice && form.manualPrice !== price && (
                        <p className="text-xs text-muted-foreground">
                          Margem real com preço ajustado: <span className={`font-bold ${realMargin(form.manualPrice, cost) >= (form.markupOrMargin || 0) ? 'text-primary' : 'text-destructive'}`}>{realMargin(form.manualPrice, cost).toFixed(1)}%</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-accent-foreground mb-2">
                  <Info className="h-4 w-4" />Resumo financeiro
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Custo total:</span><span className="text-right font-bold">{fmt(cost)}</span>
                  <span className="text-muted-foreground">Preço de venda:</span><span className="text-right font-bold">{fmt(price)}</span>
                  <span className="text-muted-foreground">Lucro bruto:</span><span className="text-right font-bold text-success">{fmt(profit)}</span>
                  <span className="text-muted-foreground">Margem bruta:</span><span className="text-right font-bold">{margin.toFixed(1)}%</span>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">Salvar Prato</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plates.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-7 w-7" />}
          title="Nenhum prato montado"
          description="Monte seus pratos combinando componentes com tamanhos de marmita. Cadastre insumos, componentes e tamanhos primeiro."
          actionLabel={components.length > 0 && plateSizes.length > 0 ? "Novo Prato" : undefined}
          onAction={components.length > 0 && plateSizes.length > 0 ? () => handleOpen() : undefined}
          steps={[
            { label: 'Insumos', done: ctx.ingredients.length > 0 },
            { label: 'Componentes', done: components.length > 0 },
            { label: 'Tamanhos', done: plateSizes.length > 0 },
            { label: 'Pratos' },
          ]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plates.map(p => {
            const fin = plateFinancials(p, ctx.components, ctx.ingredients, ctx.yieldFactors, ctx.extraCosts);
            const size = plateSizes.find(ps => ps.id === p.plateSizeId);
            const isExpanded = expandedId === p.id;
            return (
              <Card key={p.id} className={`${!p.active ? 'opacity-50' : ''} ${isExpanded ? 'col-span-full' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-display font-bold text-lg">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{size?.name} • {p.type === 'customizable' ? 'Personalizável' : 'Padrão'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        title="Indicadores financeiros"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deletePlate(p.id); toast.success("Removido"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {!isExpanded && (
                    <>
                      <div className="space-y-1 text-sm mb-3">
                        {p.components.map((pc, i) => {
                          const comp = components.find(x => x.id === pc.componentId);
                          return comp ? (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground">{comp.name}</span>
                              <span className="font-mono">{pc.weight}g</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                      <div className="border-t pt-2 grid grid-cols-2 gap-1 text-sm">
                        <span className="text-muted-foreground">Custo:</span><span className="text-right">{fmt(fin.totalCost)}</span>
                        <span className="text-muted-foreground">Preço:</span><span className="text-right font-bold">{fmt(fin.price)}</span>
                        <span className="text-muted-foreground">Lucro:</span><span className="text-right text-success">{fmt(fin.profit)}</span>
                        <span className="text-muted-foreground">Margem:</span><span className="text-right">{fin.margin.toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                  {isExpanded && <PlateFinancialDetail plate={p} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}