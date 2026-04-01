import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Ingredient, PurchaseUnit } from "@/types";
import { getCostPerGram } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, ShoppingBasket } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const UNITS: { value: PurchaseUnit; label: string }[] = [
  { value: 'lb', label: 'Libra (lb)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'oz', label: 'Onça (oz)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
];
const CATEGORIES = ['Carnes', 'Grãos', 'Legumes', 'Verduras', 'Temperos', 'Laticínios', 'Outros'];

function emptyIngredient(): Partial<Ingredient> {
  return { name: '', category: 'Carnes', price: 0, quantity: 1, unit: 'lb' as PurchaseUnit, supplier: '', notes: '' };
}

export default function Ingredients() {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useApp();
  const { fmt } = useCurrency();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<Partial<Ingredient>>(emptyIngredient());

  const handleOpen = (item?: Ingredient) => {
    if (item) {
      setEditing(item);
      setForm(item);
    } else {
      setEditing(null);
      setForm(emptyIngredient());
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price || !form.quantity) {
      toast.error("Preencha nome, preço e quantidade");
      return;
    }
    const item: Ingredient = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name!,
      category: form.category || 'Outros',
      price: Number(form.price),
      quantity: Number(form.quantity),
      unit: form.unit as PurchaseUnit,
      supplier: form.supplier,
      notes: form.notes,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    if (editing) {
      updateIngredient(item);
      toast.success("Insumo atualizado");
    } else {
      addIngredient(item);
      toast.success("Insumo cadastrado");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Insumos e Compras</h1>
          <p className="text-muted-foreground mt-1">Cadastre tudo que você compra para produzir</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}>
              <Plus className="h-4 w-4 mr-2" />Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? 'Editar' : 'Novo'} Insumo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Peito de frango" />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Unidade de compra</Label>
                  <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v as PurchaseUnit })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade ({form.unit || 'un'})</Label>
                  <Input type="number" step="0.01" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Preço por {form.quantity || 1} {form.unit || 'un'}</Label>
                  <Input type="number" step="0.01" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Fornecedor (opcional)</Label>
                <Input value={form.supplier || ''} onChange={e => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {ingredients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum insumo cadastrado. Clique em "Novo Insumo" para começar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Categoria</th>
                    <th className="text-right p-3">Preço</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(i => (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{i.name}</td>
                      <td className="p-3 text-muted-foreground">{i.category}</td>
                      <td className="p-3 text-right">{fmt(i.price / i.quantity)}/{i.unit}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(i)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { deleteIngredient(i.id); toast.success("Removido"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
