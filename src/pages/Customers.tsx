import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Customer, CustomerStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Plus, Search, Pencil, Trash2, Users, UserCheck, UserX, Crown,
  Phone, Mail, MapPin, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { CUSTOMER_STATUS_LABELS } from '@/types';

const COMMON_RESTRICTIONS = [
  'Sem lactose', 'Sem glúten', 'Vegetariano', 'Vegano',
  'Sem frutos do mar', 'Sem amendoim', 'Low carb', 'Sem açúcar',
];

const COMMON_PREFERENCES = [
  'Frango', 'Carne bovina', 'Peixe', 'Arroz integral',
  'Sem pimenta', 'Pouco sal', 'Porções maiores', 'Porções menores',
];

function generateId() {
  return crypto.randomUUID();
}

const emptyCustomer: Omit<Customer, 'id' | 'createdAt'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
  dietaryRestrictions: [],
  preferences: [],
  notes: '',
  status: 'active',
};

function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
  suggestions,
}: {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions: string[];
}) {
  const [input, setInput] = useState('');
  const available = suggestions.filter(s => !tags.includes(s));

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digitar..."
          className="flex-1"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {available.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    vip: customers.filter(c => c.status === 'vip').length,
  }), [customers]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyCustomer);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      dietaryRestrictions: [...c.dietaryRestrictions],
      preferences: [...c.preferences],
      notes: c.notes || '',
      status: c.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editing) {
      await updateCustomer({
        ...editing,
        ...form,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Cliente atualizado');
    } else {
      await addCustomer({
        id: generateId(),
        ...form,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success('Cliente cadastrado');
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCustomer(id);
    toast.success('Cliente removido');
  };

  const statusBadge = (status: CustomerStatus) => {
    const variants: Record<CustomerStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      vip: 'secondary',
      inactive: 'outline',
    };
    return <Badge variant={variants[status]}>{CUSTOMER_STATUS_LABELS[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Base de clientes e preferências</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('active')}>
          <CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('vip')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.vip}</p>
              <p className="text-xs text-muted-foreground">VIP</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('inactive')}>
          <CardContent className="p-4 flex items-center gap-3">
            <UserX className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou email..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {customers.length === 0 ? 'Nenhum cliente cadastrado ainda.' : 'Nenhum cliente encontrado com esses filtros.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <React.Fragment key={c.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {expandedId === c.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          <span>{c.name}</span>
                          {c.dietaryRestrictions.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-1">
                              {c.dietaryRestrictions.slice(0, 3).map(r => (
                                <Badge key={r} variant="destructive" className="text-[10px] px-1.5 py-0">{r}</Badge>
                              ))}
                              {c.dietaryRestrictions.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{c.dietaryRestrictions.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.email || '—'}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === c.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-2">
                              <p className="font-medium text-foreground">Contato</p>
                              {c.phone && (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" /> {c.phone}
                                </p>
                              )}
                              {c.email && (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5" /> {c.email}
                                </p>
                              )}
                              {c.address && (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" /> {c.address}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium text-foreground">Perfil Alimentar</p>
                              {c.dietaryRestrictions.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Restrições:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {c.dietaryRestrictions.map(r => (
                                      <Badge key={r} variant="destructive" className="text-xs">{r}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {c.preferences.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Preferências:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {c.preferences.map(p => (
                                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {c.notes && (
                              <div className="space-y-2">
                                <p className="font-medium text-foreground">Observações</p>
                                <p className="text-muted-foreground">{c.notes}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Dados Principais */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Dados Principais</p>
              <Input
                placeholder="Nome *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Telefone"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Endereço"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v as CustomerStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Perfil Alimentar */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Perfil Alimentar</p>
              <TagInput
                label="Restrições Alimentares"
                tags={form.dietaryRestrictions}
                onAdd={tag => setForm(f => ({ ...f, dietaryRestrictions: [...f.dietaryRestrictions, tag] }))}
                onRemove={tag => setForm(f => ({ ...f, dietaryRestrictions: f.dietaryRestrictions.filter(t => t !== tag) }))}
                suggestions={COMMON_RESTRICTIONS}
              />
              <TagInput
                label="Preferências"
                tags={form.preferences}
                onAdd={tag => setForm(f => ({ ...f, preferences: [...f.preferences, tag] }))}
                onRemove={tag => setForm(f => ({ ...f, preferences: f.preferences.filter(t => t !== tag) }))}
                suggestions={COMMON_PREFERENCES}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Observações</p>
              <Textarea
                placeholder="Notas internas sobre o cliente..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
