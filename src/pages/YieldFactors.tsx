import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import type { YieldFactor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function YieldFactors() {
  const { ingredients, yieldFactors, addYieldFactor, updateYieldFactor, deleteYieldFactor } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<YieldFactor | null>(null);
  const [form, setForm] = useState<Partial<YieldFactor>>({ ingredientId: '', rawWeight: 1000, cookedWeight: 750 });

  const factor = (form.rawWeight && form.cookedWeight) ? form.cookedWeight / form.rawWeight : 1;

  const handleOpen = (item?: YieldFactor) => {
    if (item) { setEditing(item); setForm(item); }
    else { setEditing(null); setForm({ ingredientId: '', rawWeight: 1000, cookedWeight: 750 }); }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.ingredientId || !form.rawWeight || !form.cookedWeight) {
      toast.error("Preencha todos os campos"); return;
    }
    const item: YieldFactor = {
      id: editing?.id || crypto.randomUUID(),
      ingredientId: form.ingredientId!,
      rawWeight: Number(form.rawWeight),
      cookedWeight: Number(form.cookedWeight),
      factor,
      method: form.method,
      notes: form.notes,
    };
    if (editing) { updateYieldFactor(item); toast.success("Atualizado"); }
    else { addYieldFactor(item); toast.success("Fator cadastrado"); }
    setOpen(false);
  };

  const getIngName = (id: string) => ingredients.find(i => i.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Rendimento / Produção</h1>
          <p className="text-muted-foreground mt-1">Defina quanto cada alimento rende após o preparo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Fator</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Fator de Rendimento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Insumo</Label>
                <Select value={form.ingredientId} onValueChange={v => setForm({ ...form, ingredientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o insumo" /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso cru (g)</Label>
                  <Input type="number" value={form.rawWeight || ''} onChange={e => setForm({ ...form, rawWeight: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Peso pronto (g)</Label>
                  <Input type="number" value={form.cookedWeight || ''} onChange={e => setForm({ ...form, cookedWeight: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 flex items-center justify-center gap-4 text-sm">
                <span>{form.rawWeight}g cru</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{form.cookedWeight}g pronto</span>
                <span className="font-bold text-primary">Fator: {factor.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  ({factor < 1 ? 'perde peso' : factor > 1 ? 'ganha peso' : 'mantém'})
                </span>
              </div>
              <div>
                <Label>Método de preparo</Label>
                <Input value={form.method || ''} onChange={e => setForm({ ...form, method: e.target.value })} placeholder="Grelhado, cozido..." />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {yieldFactors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum fator cadastrado. Informe quanto cada alimento rende depois de preparado.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3">Insumo</th>
                <th className="text-right p-3">Cru (g)</th>
                <th className="text-right p-3">Pronto (g)</th>
                <th className="text-right p-3">Fator</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-right p-3">Ações</th>
              </tr></thead>
              <tbody>
                {yieldFactors.map(y => (
                  <tr key={y.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{getIngName(y.ingredientId)}</td>
                    <td className="p-3 text-right">{y.rawWeight}g</td>
                    <td className="p-3 text-right">{y.cookedWeight}g</td>
                    <td className="p-3 text-right font-mono font-bold">{y.factor.toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">{y.factor < 1 ? 'Perde peso' : y.factor > 1 ? 'Ganha peso' : 'Mantém'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(y)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteYieldFactor(y.id); toast.success("Removido"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
