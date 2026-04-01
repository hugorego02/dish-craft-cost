import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { ExtraCost } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Receipt } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const CATEGORIES = ['Embalagem', 'Operacional', 'Entrega', 'Temperos', 'Outros'];

export default function ExtraCosts() {
  const { extraCosts, addExtraCost, updateExtraCost, deleteExtraCost } = useApp();
  const { fmt, symbol } = useCurrency();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExtraCost | null>(null);
  const [form, setForm] = useState<Partial<ExtraCost>>({ name: '', value: 0, applyPer: 'plate', category: 'Embalagem' });

  const handleOpen = (item?: ExtraCost) => {
    if (item) { setEditing(item); setForm(item); }
    else { setEditing(null); setForm({ name: '', value: 0, applyPer: 'plate', category: 'Embalagem' }); }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.value) { toast.error("Preencha nome e valor"); return; }
    const item: ExtraCost = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      value: Number(form.value),
      applyPer: form.applyPer || 'plate',
      category: form.category || 'Outros',
      notes: form.notes,
    };
    if (editing) { updateExtraCost(item); toast.success("Atualizado"); }
    else { addExtraCost(item); toast.success("Custo extra cadastrado"); }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Custos Extras</h1>
          <p className="text-muted-foreground mt-1">Embalagens, gás, entregas e outros custos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Novo Custo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Custo Extra</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Embalagem marmita" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valor ({symbol})</Label><Input type="number" step="0.01" value={form.value || ''} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} /></div>
                <div>
                  <Label>Aplicar por</Label>
                  <Select value={form.applyPer} onValueChange={v => setForm({ ...form, applyPer: v as ExtraCost['applyPer'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plate">Prato</SelectItem>
                      <SelectItem value="batch">Lote</SelectItem>
                      <SelectItem value="order">Pedido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {extraCosts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum custo extra cadastrado.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Categoria</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-center p-3">Aplicar por</th>
                <th className="text-right p-3">Ações</th>
              </tr></thead>
              <tbody>
                {extraCosts.map(ec => (
                  <tr key={ec.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{ec.name}</td>
                    <td className="p-3 text-muted-foreground">{ec.category}</td>
                    <td className="p-3 text-right font-mono">{fmt(ec.value)}</td>
                    <td className="p-3 text-center">{ec.applyPer === 'plate' ? 'Prato' : ec.applyPer === 'batch' ? 'Lote' : 'Pedido'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(ec)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteExtraCost(ec.id); toast.success("Removido"); }}>
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
