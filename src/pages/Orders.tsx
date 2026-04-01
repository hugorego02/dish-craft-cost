import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Order, OrderItem, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, Search, Pencil, Trash2, Package, CalendarIcon,
  ChevronDown, ChevronUp, ClipboardList, CheckCircle2, Truck, XCircle, Clock
} from 'lucide-react';
import { platePrice as calcPlatePrice, plateTotalCost } from '@/lib/calculations';

const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Cartão Crédito', 'Cartão Débito', 'Transferência'];

function generateId() { return crypto.randomUUID(); }

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  confirmed: <CheckCircle2 className="h-3.5 w-3.5" />,
  production: <ClipboardList className="h-3.5 w-3.5" />,
  delivered: <Truck className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
};

export default function Orders() {
  const { orders, addOrder, updateOrder, deleteOrder, customers, plates, components, ingredients, yieldFactors, extraCosts } = useApp();
  const { fmt: formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Plate price lookup
  const platePriceMap = useMemo(() => {
    const map: Record<string, { price: number; name: string }> = {};
    plates.forEach(p => {
      const cost = plateTotalCost(p, components, ingredients, yieldFactors, extraCosts);
      const price = calcPlatePrice(p, cost.totalCost);
      map[p.id] = { price, name: p.name };
    });
    return map;
  }, [plates, components, ingredients, yieldFactors, extraCosts]);

  const orderTotal = (orderItems: OrderItem[], disc: number) => {
    const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return Math.max(0, subtotal - disc);
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const customer = customers.find(c => c.id === o.customerId);
      const matchSearch = !search ||
        (customer && customer.name.toLowerCase().includes(search.toLowerCase())) ||
        o.items.some(i => i.plateName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, customers, search, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    production: orders.filter(o => o.status === 'production').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  const resetForm = () => {
    setCustomerId('');
    setOrderDate(new Date());
    setDeliveryDate(undefined);
    setStatus('pending');
    setPaymentMethod('');
    setDiscount(0);
    setNotes('');
    setItems([]);
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (o: Order) => {
    setEditing(o);
    setCustomerId(o.customerId || '');
    setOrderDate(new Date(o.orderDate));
    setDeliveryDate(o.deliveryDate ? new Date(o.deliveryDate) : undefined);
    setStatus(o.status);
    setPaymentMethod(o.paymentMethod || '');
    setDiscount(o.discount);
    setNotes(o.notes || '');
    setItems([...o.items]);
    setDialogOpen(true);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: generateId(),
      plateId: null,
      plateName: '',
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const updateItem = (idx: number, updates: Partial<OrderItem>) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const selectPlateForItem = (idx: number, plateId: string) => {
    const info = platePriceMap[plateId];
    if (info) {
      updateItem(idx, { plateId, plateName: info.name, unitPrice: info.price });
    }
  };

  const handleSave = async () => {
    if (!customerId) { toast.error('Selecione um cliente'); return; }
    if (items.length === 0) { toast.error('Adicione pelo menos um item'); return; }
    if (items.some(i => !i.plateName)) { toast.error('Todos os itens precisam de um prato'); return; }

    const order: Order = {
      id: editing?.id || generateId(),
      customerId,
      orderDate: orderDate.toISOString(),
      deliveryDate: deliveryDate?.toISOString(),
      status,
      paymentMethod: paymentMethod || undefined,
      discount,
      notes: notes || undefined,
      items,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };

    if (editing) {
      await updateOrder(order);
      toast.success('Pedido atualizado');
    } else {
      await addOrder(order);
      toast.success('Pedido registrado');
    }
    setDialogOpen(false);
  };

  const handleStatusChange = async (o: Order, newStatus: OrderStatus) => {
    await updateOrder({ ...o, status: newStatus });
    toast.success(`Status: ${ORDER_STATUS_LABELS[newStatus]}`);
  };

  const getCustomerName = (id: string | null) => {
    if (!id) return '—';
    return customers.find(c => c.id === id)?.name || 'Cliente removido';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gestão e acompanhamento de pedidos</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, filter: 'all', icon: Package },
          { label: 'Pendentes', value: stats.pending, filter: 'pending', icon: Clock },
          { label: 'Confirmados', value: stats.confirmed, filter: 'confirmed', icon: CheckCircle2 },
          { label: 'Produção', value: stats.production, filter: 'production', icon: ClipboardList },
          { label: 'Entregues', value: stats.delivered, filter: 'delivered', icon: Truck },
        ].map(s => (
          <Card key={s.filter} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter(s.filter)}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou prato..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title={orders.length === 0 ? 'Nenhum pedido registrado' : 'Nenhum resultado'}
          description={orders.length === 0
            ? 'Registre pedidos para acompanhar vendas, status de produção e entregas dos seus clientes.'
            : 'Nenhum pedido encontrado com esses filtros.'}
          actionLabel={orders.length === 0 ? 'Novo Pedido' : undefined}
          onAction={orders.length === 0 ? openNew : undefined}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden sm:table-cell">Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => {
                  const total = orderTotal(o.items, o.discount);
                  return (
                    <React.Fragment key={o.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {expandedId === o.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {getCustomerName(o.customerId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(o.orderDate), 'dd/MM/yy')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {o.items.reduce((s, i) => s + i.quantity, 0)} un
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1 text-xs', ORDER_STATUS_COLORS[o.status])}>
                            {statusIcons[o.status]}
                            {ORDER_STATUS_LABELS[o.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(o)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => { deleteOrder(o.id); toast.success('Pedido removido'); }}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === o.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {/* Items */}
                              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <p className="font-medium text-foreground">Itens do Pedido</p>
                                <div className="space-y-1">
                                  {o.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-muted-foreground">
                                      <span>{item.quantity}x {item.plateName}</span>
                                      <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                                    </div>
                                  ))}
                                  {o.discount > 0 && (
                                    <div className="flex justify-between text-destructive border-t border-border pt-1">
                                      <span>Desconto</span>
                                      <span>-{formatCurrency(o.discount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                  </div>
                                </div>
                              </div>
                              {/* Info */}
                              <div className="space-y-2">
                                <p className="font-medium text-foreground">Informações</p>
                                {o.deliveryDate && (
                                  <p className="flex items-center gap-2 text-muted-foreground">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    Entrega: {format(new Date(o.deliveryDate), "dd/MM/yyyy")}
                                  </p>
                                )}
                                {o.paymentMethod && (
                                  <p className="text-muted-foreground">Pagamento: {o.paymentMethod}</p>
                                )}
                              </div>
                              {/* Status change + notes */}
                              <div className="space-y-2">
                                <p className="font-medium text-foreground">Alterar Status</p>
                                <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v as OrderStatus)}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                                      <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {o.notes && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mt-2">Obs: {o.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Client & dates */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Cliente e Datas</p>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente *" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !orderDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderDate ? format(orderDate, "dd/MM/yyyy") : "Data do pedido"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={orderDate} onSelect={d => d && setOrderDate(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !deliveryDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : "Data de entrega"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Itens do Pedido</p>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum item. Clique em "Adicionar".</p>
              )}
              {items.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-start p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex-1 space-y-2">
                    <Select value={item.plateId || ''} onValueChange={v => selectPlateForItem(idx, v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Selecione o prato" />
                      </SelectTrigger>
                      <SelectContent>
                        {plates.filter(p => p.active).map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(platePriceMap[p.id]?.price || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        type="number" min={1} value={item.quantity}
                        onChange={e => updateItem(idx, { quantity: Math.max(1, +e.target.value) })}
                        className="w-20 h-8 text-sm" placeholder="Qtd"
                      />
                      <Input
                        type="number" min={0} step={0.01} value={item.unitPrice}
                        onChange={e => updateItem(idx, { unitPrice: +e.target.value })}
                        className="flex-1 h-8 text-sm" placeholder="Preço unit."
                      />
                      <span className="text-sm font-medium text-foreground self-center whitespace-nowrap">
                        = {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="mt-1" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              {items.length > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="text-xs text-muted-foreground">Desconto</label>
                      <Input type="number" min={0} step={0.01} value={discount}
                        onChange={e => setDiscount(+e.target.value)}
                        className="w-28 h-8 text-sm mt-0.5" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(orderTotal(items, discount))}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment & status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={status} onValueChange={v => setStatus(v as OrderStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <Textarea placeholder="Observações do pedido..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Salvar' : 'Registrar Pedido'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
