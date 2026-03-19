import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import type { Plate, PlateComponent } from "@/types";
import { FOOD_GROUP_LABELS, getPlateCost, getPlatePrice, getComponentCostForWeight } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Pencil, Info } from "lucide-react";
import { toast } from "sonner";

export default function Plates() {
  const { ingredients, yieldFactors, components, plateSizes, plates, extraCosts, addPlate, updatePlate, deletePlate } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plate | null>(null);
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
    // Auto-populate components based on size groups
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

  const cost = useMemo(() => {
    if (!form.components?.length) return 0;
    let total = 0;
    for (const pc of form.components) {
      const comp = components.find(c => c.id === pc.componentId);
      if (!comp) continue;
      const ing = ingredients.find(i => i.id === comp.ingredientId);
      if (!ing) continue;
      const yf = yieldFactors.find(y => y.ingredientId === comp.ingredientId);
      total += getComponentCostForWeight(pc.weight, ing, yf);
    }
    for (const ecId of (form.extraCostIds || [])) {
      const ec = extraCosts.find(e => e.id === ecId);
      if (ec && ec.applyPer === 'plate') total += ec.value;
    }
    return total;
  }, [form.components, form.extraCostIds, components, ingredients, yieldFactors, extraCosts]);

  const price = useMemo(() => {
    if (form.pricingMethod === 'manual') return form.manualPrice || 0;
    if (form.pricingMethod === 'markup') return cost * (form.markupOrMargin || 0);
    if (form.pricingMethod === 'margin') return cost / (1 - (form.markupOrMargin || 0) / 100);
    return 0;
  }, [form.pricingMethod, form.manualPrice, form.markupOrMargin, cost]);

  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

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
                  const ing = comp ? ingredients.find(ig => ig.id === comp.ingredientId) : undefined;
                  const yf = comp ? yieldFactors.find(y => y.ingredientId === comp.ingredientId) : undefined;
                  const pcCost = (ing && comp) ? getComponentCostForWeight(pc.weight, ing, yf) : 0;

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
                      {pcCost > 0 && <p className="text-xs text-right mt-1 font-mono">Custo: ${pcCost.toFixed(2)}</p>}
                    </div>
                  );
                })}
              </div>

              <div>
                <Label>Custos extras</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {extraCosts.filter(ec => ec.applyPer === 'plate').map(ec => (
                    <Button
                      key={ec.id}
                      variant={(form.extraCostIds || []).includes(ec.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const ids = form.extraCostIds || [];
                        setForm({ ...form, extraCostIds: ids.includes(ec.id) ? ids.filter(x => x !== ec.id) : [...ids, ec.id] });
                      }}
                    >
                      {ec.name} (${ec.value.toFixed(2)})
                    </Button>
                  ))}
                  {extraCosts.filter(ec => ec.applyPer === 'plate').length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum custo extra cadastrado</p>
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
                <div><Label>Preço de venda ($)</Label><Input type="number" step="0.01" value={form.manualPrice || ''} onChange={e => setForm({ ...form, manualPrice: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {form.pricingMethod === 'markup' && (
                <div><Label>Markup (ex: 2.5 = custo × 2.5)</Label><Input type="number" step="0.1" value={form.markupOrMargin || ''} onChange={e => setForm({ ...form, markupOrMargin: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {form.pricingMethod === 'margin' && (
                <div><Label>Margem desejada (%)</Label><Input type="number" step="1" value={form.markupOrMargin || ''} onChange={e => setForm({ ...form, markupOrMargin: parseFloat(e.target.value) || 0 })} /></div>
              )}

              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-accent-foreground mb-2">
                  <Info className="h-4 w-4" />Resumo financeiro
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Custo total:</span><span className="text-right font-bold">${cost.toFixed(2)}</span>
                  <span className="text-muted-foreground">Preço de venda:</span><span className="text-right font-bold">${price.toFixed(2)}</span>
                  <span className="text-muted-foreground">Lucro bruto:</span><span className="text-right font-bold text-success">${profit.toFixed(2)}</span>
                  <span className="text-muted-foreground">Margem bruta:</span><span className="text-right font-bold">{margin.toFixed(1)}%</span>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">Salvar Prato</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum prato montado. Crie tamanhos e componentes primeiro, depois monte seus pratos aqui.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plates.map(p => {
            const c = getPlateCost(p, components, ingredients, yieldFactors, extraCosts);
            const pr = getPlatePrice(p, c);
            const pf = pr - c;
            const mg = pr > 0 ? ((pf / pr) * 100) : 0;
            const size = plateSizes.find(ps => ps.id === p.plateSizeId);
            return (
              <Card key={p.id} className={!p.active ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-display font-bold text-lg">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{size?.name} • {p.type === 'customizable' ? 'Personalizável' : 'Padrão'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deletePlate(p.id); toast.success("Removido"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
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
                    <span className="text-muted-foreground">Custo:</span><span className="text-right">${c.toFixed(2)}</span>
                    <span className="text-muted-foreground">Preço:</span><span className="text-right font-bold">${pr.toFixed(2)}</span>
                    <span className="text-muted-foreground">Lucro:</span><span className="text-right text-success">${pf.toFixed(2)}</span>
                    <span className="text-muted-foreground">Margem:</span><span className="text-right">{mg.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
