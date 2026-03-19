import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import type { PlateSize, PlateGroupConfig, FoodGroup } from "@/types";
import { FOOD_GROUP_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const ALL_GROUPS: FoodGroup[] = ['protein', 'carb', 'grain', 'veggie', 'sauce', 'extra'];

function defaultGroups(): PlateGroupConfig[] {
  return [
    { group: 'protein', defaultWeight: 150, minWeight: 100, maxWeight: 200, increment: 25, required: true },
    { group: 'carb', defaultWeight: 200, minWeight: 100, maxWeight: 250, increment: 50, required: true },
    { group: 'grain', defaultWeight: 130, minWeight: 0, maxWeight: 200, increment: 25, required: false },
    { group: 'veggie', defaultWeight: 100, minWeight: 0, maxWeight: 200, increment: 25, required: false },
    { group: 'sauce', defaultWeight: 20, minWeight: 0, maxWeight: 50, increment: 10, required: false },
    { group: 'extra', defaultWeight: 0, minWeight: 0, maxWeight: 100, increment: 25, required: false },
  ];
}

export default function PlateSizes() {
  const { plateSizes, addPlateSize, updatePlateSize, deletePlateSize } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlateSize | null>(null);
  const [form, setForm] = useState<Partial<PlateSize>>({ name: '', totalWeight: 600, groups: defaultGroups(), active: true });

  const handleOpen = (item?: PlateSize) => {
    if (item) { setEditing(item); setForm(item); }
    else { setEditing(null); setForm({ name: '', description: '', totalWeight: 600, groups: defaultGroups(), active: true }); }
    setOpen(true);
  };

  const updateGroup = (idx: number, patch: Partial<PlateGroupConfig>) => {
    const groups = [...(form.groups || [])];
    groups[idx] = { ...groups[idx], ...patch };
    setForm({ ...form, groups });
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do tamanho"); return; }
    const item: PlateSize = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      description: form.description,
      totalWeight: Number(form.totalWeight) || 0,
      groups: form.groups || defaultGroups(),
      active: form.active ?? true,
      notes: form.notes,
    };
    if (editing) { updatePlateSize(item); toast.success("Atualizado"); }
    else { addPlateSize(item); toast.success("Tamanho criado"); }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Tamanhos de Prato</h1>
          <p className="text-muted-foreground mt-1">Crie modelos personalizados para seus pratos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Tamanho</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Tamanho de Prato</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Marmita Fit 500g" /></div>
                <div><Label>Peso total planejado (g)</Label><Input type="number" value={form.totalWeight || ''} onChange={e => setForm({ ...form, totalWeight: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              
              <div>
                <Label className="text-base font-semibold">Distribuição por grupo</Label>
                <p className="text-xs text-muted-foreground mb-3">Configure quanto de cada grupo alimentar esse tamanho de prato aceita</p>
                <div className="space-y-3">
                  {(form.groups || []).map((g, i) => (
                    <div key={g.group} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{FOOD_GROUP_LABELS[g.group]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Obrigatório</span>
                          <Switch checked={g.required} onCheckedChange={v => updateGroup(i, { required: v })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><Label className="text-xs">Padrão (g)</Label><Input type="number" className="h-8 text-xs" value={g.defaultWeight} onChange={e => updateGroup(i, { defaultWeight: parseFloat(e.target.value) || 0 })} /></div>
                        <div><Label className="text-xs">Mínimo (g)</Label><Input type="number" className="h-8 text-xs" value={g.minWeight} onChange={e => updateGroup(i, { minWeight: parseFloat(e.target.value) || 0 })} /></div>
                        <div><Label className="text-xs">Máximo (g)</Label><Input type="number" className="h-8 text-xs" value={g.maxWeight} onChange={e => updateGroup(i, { maxWeight: parseFloat(e.target.value) || 0 })} /></div>
                        <div><Label className="text-xs">Incremento</Label><Input type="number" className="h-8 text-xs" value={g.increment} onChange={e => updateGroup(i, { increment: parseFloat(e.target.value) || 0 })} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plateSizes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum tamanho criado. Defina como seus pratos são estruturados.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plateSizes.map(ps => (
            <Card key={ps.id} className={!ps.active ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg">{ps.name}</h3>
                    {ps.description && <p className="text-xs text-muted-foreground">{ps.description}</p>}
                    <p className="text-sm font-medium mt-1">{ps.totalWeight}g total</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(ps)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { deletePlateSize(ps.id); toast.success("Removido"); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {ps.groups.filter(g => g.defaultWeight > 0).map(g => (
                    <div key={g.group} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{FOOD_GROUP_LABELS[g.group]}</span>
                      <span className="font-mono">{g.defaultWeight}g <span className="text-muted-foreground text-xs">({g.minWeight}-{g.maxWeight})</span></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
