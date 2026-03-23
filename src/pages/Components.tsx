import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import type { FoodComponent, FoodGroup } from "@/types";
import { FOOD_GROUP_LABELS, getCostPerGram, getComponentCostForWeight } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Info } from "lucide-react";
import { toast } from "sonner";

const GROUPS: FoodGroup[] = ['protein', 'carb', 'grain', 'veggie', 'sauce', 'extra'];

type CostUnit = 'g' | 'kg' | 'lb';
const COST_UNIT_LABELS: Record<CostUnit, string> = { g: 'g', kg: 'kg', lb: 'lb' };
const COST_UNIT_MULTIPLIER: Record<CostUnit, number> = { g: 1, kg: 1000, lb: 453.592 };

export default function Components() {
  const { ingredients, yieldFactors, components, addComponent, updateComponent, deleteComponent } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FoodComponent | null>(null);
  const [form, setForm] = useState<Partial<FoodComponent>>({ name: '', ingredientId: '', group: 'protein' });
  const [costUnit, setCostUnit] = useState<CostUnit>('kg');
  const [simWeight, setSimWeight] = useState<string>('');

  const handleOpen = (item?: FoodComponent) => {
    if (item) { setEditing(item); setForm(item); }
    else { setEditing(null); setForm({ name: '', ingredientId: '', group: 'protein' }); }
    setSimWeight('');
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.ingredientId) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    const item: FoodComponent = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      ingredientId: form.ingredientId!,
      group: form.group as FoodGroup,
      notes: form.notes,
    };
    if (editing) { updateComponent(item); toast.success("Atualizado"); }
    else { addComponent(item); toast.success("Componente criado"); }
    setOpen(false);
  };

  const getIngInfo = (comp: FoodComponent) => {
    const ing = ingredients.find(i => i.id === comp.ingredientId);
    if (!ing) return null;
    const yf = yieldFactors.find(y => y.ingredientId === comp.ingredientId);
    const factor = yf?.factor ?? 1;
    const costPerGram = getCostPerGram(ing);
    return { ing, yf, factor, costPerGram };
  };

  const formatCost = (costPerGram: number) => {
    const cost = costPerGram * COST_UNIT_MULTIPLIER[costUnit];
    return `R$${cost.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Componentes</h1>
          <p className="text-muted-foreground mt-1">Cadastre os componentes que serão usados nos pratos. O peso é definido no tamanho do prato.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Componente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Componente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Frango grelhado" />
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Select value={form.group} onValueChange={v => setForm({ ...form, group: v as FoodGroup })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GROUPS.map(g => <SelectItem key={g} value={g}>{FOOD_GROUP_LABELS[g]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Insumo base</Label>
                <Select value={form.ingredientId} onValueChange={v => setForm({ ...form, ingredientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.ingredientId && (() => {
                const ing = ingredients.find(i => i.id === form.ingredientId);
                if (!ing) return null;
                const yf = yieldFactors.find(y => y.ingredientId === form.ingredientId);
                const factor = yf?.factor ?? 1;
                const cpg = getCostPerGram(ing);
                const simGrams = parseFloat(simWeight);
                const simCost = simGrams > 0 ? getComponentCostForWeight(simGrams, ing, yf) : null;
                return (
                  <div className="bg-accent/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-accent-foreground">
                      <Info className="h-4 w-4" />Informações do insumo
                    </div>
                    <p>Custo por kg: <b>R${(cpg * 1000).toFixed(2)}</b></p>
                    <p>Fator de rendimento: <b>{factor.toFixed(2)}</b> {!yf && <span className="text-warning">(sem fator cadastrado, usando 1.0)</span>}</p>
                    
                    <div className="border-t border-border pt-3">
                      <Label className="text-xs text-muted-foreground">Simular custo para peso (g pronto)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Ex: 200"
                          value={simWeight}
                          onChange={e => setSimWeight(e.target.value)}
                          className="w-32"
                        />
                        {simCost !== null && (
                          <div className="flex items-center px-3 rounded-md bg-primary/10 text-primary font-semibold text-sm">
                            R${simCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                      {simCost !== null && simGrams > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Peso cru necessário: {(simGrams / factor).toFixed(1)}g → custo R${simCost.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">O peso real será definido no tamanho do prato.</p>
                  </div>
                );
              })()}
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {components.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum componente criado. Cadastre componentes com base nos seus insumos.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Grupo</th>
                <th className="text-left p-3">Insumo</th>
                <th className="text-right p-3">
                  <div className="flex items-center justify-end gap-1">
                    <span>Custo/</span>
                    <Select value={costUnit} onValueChange={v => setCostUnit(v as CostUnit)}>
                      <SelectTrigger className="h-7 w-16 text-xs border-dashed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(COST_UNIT_LABELS) as CostUnit[]).map(u => (
                          <SelectItem key={u} value={u}>{COST_UNIT_LABELS[u]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </th>
                <th className="text-right p-3">Rendimento</th>
                <th className="text-right p-3">Ações</th>
              </tr></thead>
              <tbody>
                {components.map(c => {
                  const info = getIngInfo(c);
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3"><span className="inline-block px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{FOOD_GROUP_LABELS[c.group]}</span></td>
                      <td className="p-3 text-muted-foreground">{info?.ing.name || '—'}</td>
                      <td className="p-3 text-right font-mono text-xs">{info ? formatCost(info.costPerGram) : '—'}</td>
                      <td className="p-3 text-right font-mono text-xs">{info ? `${info.factor.toFixed(2)}` : '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { deleteComponent(c.id); toast.success("Removido"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
