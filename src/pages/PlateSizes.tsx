import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import type { PlateSize, PlateGroupConfig, FoodGroup } from "@/types";
import { FOOD_GROUP_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Scale } from "lucide-react";
import { toast } from "sonner";

const ALL_GROUPS: FoodGroup[] = ['protein', 'carb', 'grain', 'veggie', 'sauce', 'extra'];

function emptyGroups(): PlateGroupConfig[] {
  return ALL_GROUPS.map(group => ({
    group,
    defaultWeight: 0,
    minWeight: 0,
    maxWeight: 0,
    increment: 25,
    required: false,
  }));
}

export default function PlateSizes() {
  const { plateSizes, addPlateSize, updatePlateSize, deletePlateSize } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlateSize | null>(null);
  const [form, setForm] = useState<Partial<PlateSize>>({ name: '', groups: emptyGroups(), active: true });

  const calculatedTotal = useMemo(() => {
    return (form.groups || []).reduce((sum, g) => sum + (g.defaultWeight || 0), 0);
  }, [form.groups]);

  const handleOpen = (item?: PlateSize) => {
    if (item) { setEditing(item); setForm(item); }
    else { setEditing(null); setForm({ name: '', description: '', groups: emptyGroups(), active: true }); }
    setOpen(true);
  };

  const updateGroup = (idx: number, patch: Partial<PlateGroupConfig>) => {
    const groups = [...(form.groups || [])];
    groups[idx] = { ...groups[idx], ...patch };
    setForm({ ...form, groups });
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome da marmita"); return; }
    if (calculatedTotal <= 0) { toast.error("Adicione pelo menos um grupo com peso"); return; }
    const item: PlateSize = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      description: form.description,
      totalWeight: calculatedTotal,
      groups: form.groups || emptyGroups(),
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
          <p className="text-muted-foreground mt-1">Crie modelos personalizados — o peso total é calculado automaticamente</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Tamanho</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Tamanho de Prato</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da marmita</Label>
                  <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Marmita Ana, Low Carb, Executivo..." />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Dieta do cliente, observações..." />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Pesos por grupo alimentar</Label>
                <p className="text-xs text-muted-foreground mb-3">Informe quanto de cada grupo vai na marmita. O peso total é calculado automaticamente.</p>
                <div className="space-y-2">
                  {(form.groups || []).map((g, i) => (
                    <div key={g.group} className="bg-muted/50 rounded-lg p-3 flex items-center gap-4">
                      <span className="font-medium text-sm w-32">{FOOD_GROUP_LABELS[g.group]}</span>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="h-8 w-20 text-sm"
                            value={g.defaultWeight || ''}
                            onChange={e => updateGroup(i, { defaultWeight: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ativo</span>
                        <Switch checked={g.required} onCheckedChange={v => updateGroup(i, { required: v, defaultWeight: v ? (g.defaultWeight || 0) : 0 })} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Peso total da marmita:</span>
                </div>
                <span className="text-2xl font-bold font-display text-primary">{calculatedTotal}g</span>
              </div>

              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plateSizes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum tamanho criado. Crie marmitas personalizadas para seus clientes.
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
                      <span className="font-mono">{g.defaultWeight}g</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peso total</span>
                  <span className="font-bold font-display text-primary">{ps.totalWeight}g</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
