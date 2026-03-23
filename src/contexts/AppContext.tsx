import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppData, Ingredient, YieldFactor, FoodComponent, PlateSize, Plate, ExtraCost, PlateComponent, PlateGroupConfig, FoodGroup } from '@/types';
import { toast } from 'sonner';

const defaultData: AppData = {
  ingredients: [],
  yieldFactors: [],
  components: [],
  plateSizes: [],
  plates: [],
  extraCosts: [],
};

interface AppContextType extends AppData {
  loading: boolean;
  addIngredient: (i: Ingredient) => Promise<void>;
  updateIngredient: (i: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  addYieldFactor: (y: YieldFactor) => Promise<void>;
  updateYieldFactor: (y: YieldFactor) => Promise<void>;
  deleteYieldFactor: (id: string) => Promise<void>;
  addComponent: (c: FoodComponent) => Promise<void>;
  updateComponent: (c: FoodComponent) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  addPlateSize: (p: PlateSize) => Promise<void>;
  updatePlateSize: (p: PlateSize) => Promise<void>;
  deletePlateSize: (id: string) => Promise<void>;
  addPlate: (p: Plate) => Promise<void>;
  updatePlate: (p: Plate) => Promise<void>;
  deletePlate: (id: string) => Promise<void>;
  addExtraCost: (e: ExtraCost) => Promise<void>;
  updateExtraCost: (e: ExtraCost) => Promise<void>;
  deleteExtraCost: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// Helper to map DB row to app type
function mapIngredient(row: any): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    quantity: Number(row.quantity),
    unit: row.unit,
    supplier: row.supplier || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

function mapYieldFactor(row: any): YieldFactor {
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    rawWeight: Number(row.raw_weight),
    cookedWeight: Number(row.cooked_weight),
    factor: Number(row.factor),
    method: row.method || undefined,
    notes: row.notes || undefined,
  };
}

function mapComponent(row: any): FoodComponent {
  return {
    id: row.id,
    name: row.name,
    ingredientId: row.ingredient_id,
    yieldFactorId: row.yield_factor_id || undefined,
    group: row.food_group as FoodGroup,
    notes: row.notes || undefined,
  };
}

function mapPlateSize(row: any): PlateSize {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    totalWeight: Number(row.total_weight),
    groups: (row.groups as any[]) || [],
    active: row.active,
    notes: row.notes || undefined,
  };
}

function mapPlate(row: any): Plate {
  return {
    id: row.id,
    name: row.name,
    plateSizeId: row.plate_size_id,
    type: row.type as 'standard' | 'customizable',
    components: (row.components as any[]) || [],
    extraCostIds: (row.extra_cost_ids as any[]) || [],
    manualPrice: row.manual_price != null ? Number(row.manual_price) : undefined,
    pricingMethod: row.pricing_method as 'manual' | 'markup' | 'margin',
    markupOrMargin: row.markup_or_margin != null ? Number(row.markup_or_margin) : undefined,
    notes: row.notes || undefined,
    active: row.active,
  };
}

function mapExtraCost(row: any): ExtraCost {
  return {
    id: row.id,
    name: row.name,
    value: Number(row.value),
    applyPer: row.apply_per as 'plate' | 'batch' | 'order',
    category: row.category,
    notes: row.notes || undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);

  // Load all data from DB
  const fetchAll = useCallback(async () => {
    try {
      const [ingRes, yfRes, compRes, psRes, plRes, ecRes] = await Promise.all([
        supabase.from('ingredients').select('*'),
        supabase.from('yield_factors').select('*'),
        supabase.from('components').select('*'),
        supabase.from('plate_sizes').select('*'),
        supabase.from('plates').select('*'),
        supabase.from('extra_costs').select('*'),
      ]);

      setData({
        ingredients: (ingRes.data || []).map(mapIngredient),
        yieldFactors: (yfRes.data || []).map(mapYieldFactor),
        components: (compRes.data || []).map(mapComponent),
        plateSizes: (psRes.data || []).map(mapPlateSize),
        plates: (plRes.data || []).map(mapPlate),
        extraCosts: (ecRes.data || []).map(mapExtraCost),
      });
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Ingredients ---
  const addIngredient = useCallback(async (i: Ingredient) => {
    const { error } = await supabase.from('ingredients').insert({
      id: i.id, name: i.name, category: i.category, price: i.price,
      quantity: i.quantity, unit: i.unit, supplier: i.supplier || null,
      notes: i.notes || null,
    });
    if (error) { toast.error('Erro ao salvar insumo'); console.error(error); return; }
    setData(d => ({ ...d, ingredients: [...d.ingredients, i] }));
  }, []);

  const updateIngredient = useCallback(async (i: Ingredient) => {
    const { error } = await supabase.from('ingredients').update({
      name: i.name, category: i.category, price: i.price,
      quantity: i.quantity, unit: i.unit, supplier: i.supplier || null,
      notes: i.notes || null,
    }).eq('id', i.id);
    if (error) { toast.error('Erro ao atualizar insumo'); console.error(error); return; }
    setData(d => ({ ...d, ingredients: d.ingredients.map(x => x.id === i.id ? i : x) }));
  }, []);

  const deleteIngredient = useCallback(async (id: string) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir insumo'); console.error(error); return; }
    setData(d => ({ ...d, ingredients: d.ingredients.filter(x => x.id !== id) }));
  }, []);

  // --- Yield Factors ---
  const addYieldFactor = useCallback(async (y: YieldFactor) => {
    const { error } = await supabase.from('yield_factors').insert({
      id: y.id, ingredient_id: y.ingredientId, raw_weight: y.rawWeight,
      cooked_weight: y.cookedWeight, factor: y.factor,
      method: y.method || null, notes: y.notes || null,
    });
    if (error) { toast.error('Erro ao salvar fator'); console.error(error); return; }
    setData(d => ({ ...d, yieldFactors: [...d.yieldFactors, y] }));
  }, []);

  const updateYieldFactor = useCallback(async (y: YieldFactor) => {
    const { error } = await supabase.from('yield_factors').update({
      ingredient_id: y.ingredientId, raw_weight: y.rawWeight,
      cooked_weight: y.cookedWeight, factor: y.factor,
      method: y.method || null, notes: y.notes || null,
    }).eq('id', y.id);
    if (error) { toast.error('Erro ao atualizar fator'); console.error(error); return; }
    setData(d => ({ ...d, yieldFactors: d.yieldFactors.map(x => x.id === y.id ? y : x) }));
  }, []);

  const deleteYieldFactor = useCallback(async (id: string) => {
    const { error } = await supabase.from('yield_factors').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir fator'); console.error(error); return; }
    setData(d => ({ ...d, yieldFactors: d.yieldFactors.filter(x => x.id !== id) }));
  }, []);

  // --- Components ---
  const addComponent = useCallback(async (c: FoodComponent) => {
    const { error } = await supabase.from('components').insert({
      id: c.id, name: c.name, ingredient_id: c.ingredientId,
      yield_factor_id: c.yieldFactorId || null,
      food_group: c.group, notes: c.notes || null,
    });
    if (error) { toast.error('Erro ao salvar componente'); console.error(error); return; }
    setData(d => ({ ...d, components: [...d.components, c] }));
  }, []);

  const updateComponent = useCallback(async (c: FoodComponent) => {
    const { error } = await supabase.from('components').update({
      name: c.name, ingredient_id: c.ingredientId,
      yield_factor_id: c.yieldFactorId || null, served_weight: c.servedWeight,
      food_group: c.group, notes: c.notes || null,
    }).eq('id', c.id);
    if (error) { toast.error('Erro ao atualizar componente'); console.error(error); return; }
    setData(d => ({ ...d, components: d.components.map(x => x.id === c.id ? c : x) }));
  }, []);

  const deleteComponent = useCallback(async (id: string) => {
    const { error } = await supabase.from('components').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir componente'); console.error(error); return; }
    setData(d => ({ ...d, components: d.components.filter(x => x.id !== id) }));
  }, []);

  // --- Plate Sizes ---
  const addPlateSize = useCallback(async (p: PlateSize) => {
    const { error } = await supabase.from('plate_sizes').insert({
      id: p.id, name: p.name, description: p.description || null,
      total_weight: p.totalWeight, groups: p.groups as any,
      active: p.active, notes: p.notes || null,
    });
    if (error) { toast.error('Erro ao salvar tamanho'); console.error(error); return; }
    setData(d => ({ ...d, plateSizes: [...d.plateSizes, p] }));
  }, []);

  const updatePlateSize = useCallback(async (p: PlateSize) => {
    const { error } = await supabase.from('plate_sizes').update({
      name: p.name, description: p.description || null,
      total_weight: p.totalWeight, groups: p.groups as any,
      active: p.active, notes: p.notes || null,
    }).eq('id', p.id);
    if (error) { toast.error('Erro ao atualizar tamanho'); console.error(error); return; }
    setData(d => ({ ...d, plateSizes: d.plateSizes.map(x => x.id === p.id ? p : x) }));
  }, []);

  const deletePlateSize = useCallback(async (id: string) => {
    const { error } = await supabase.from('plate_sizes').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir tamanho'); console.error(error); return; }
    setData(d => ({ ...d, plateSizes: d.plateSizes.filter(x => x.id !== id) }));
  }, []);

  // --- Plates ---
  const addPlate = useCallback(async (p: Plate) => {
    const { error } = await supabase.from('plates').insert({
      id: p.id, name: p.name, plate_size_id: p.plateSizeId,
      type: p.type, components: p.components as any,
      extra_cost_ids: p.extraCostIds as any,
      manual_price: p.manualPrice ?? null,
      pricing_method: p.pricingMethod,
      markup_or_margin: p.markupOrMargin ?? null,
      notes: p.notes || null, active: p.active,
    });
    if (error) { toast.error('Erro ao salvar prato'); console.error(error); return; }
    setData(d => ({ ...d, plates: [...d.plates, p] }));
  }, []);

  const updatePlate = useCallback(async (p: Plate) => {
    const { error } = await supabase.from('plates').update({
      name: p.name, plate_size_id: p.plateSizeId,
      type: p.type, components: p.components as any,
      extra_cost_ids: p.extraCostIds as any,
      manual_price: p.manualPrice ?? null,
      pricing_method: p.pricingMethod,
      markup_or_margin: p.markupOrMargin ?? null,
      notes: p.notes || null, active: p.active,
    }).eq('id', p.id);
    if (error) { toast.error('Erro ao atualizar prato'); console.error(error); return; }
    setData(d => ({ ...d, plates: d.plates.map(x => x.id === p.id ? p : x) }));
  }, []);

  const deletePlate = useCallback(async (id: string) => {
    const { error } = await supabase.from('plates').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir prato'); console.error(error); return; }
    setData(d => ({ ...d, plates: d.plates.filter(x => x.id !== id) }));
  }, []);

  // --- Extra Costs ---
  const addExtraCost = useCallback(async (e: ExtraCost) => {
    const { error } = await supabase.from('extra_costs').insert({
      id: e.id, name: e.name, value: e.value,
      apply_per: e.applyPer, category: e.category,
      notes: e.notes || null,
    });
    if (error) { toast.error('Erro ao salvar custo extra'); console.error(error); return; }
    setData(d => ({ ...d, extraCosts: [...d.extraCosts, e] }));
  }, []);

  const updateExtraCost = useCallback(async (e: ExtraCost) => {
    const { error } = await supabase.from('extra_costs').update({
      name: e.name, value: e.value, apply_per: e.applyPer,
      category: e.category, notes: e.notes || null,
    }).eq('id', e.id);
    if (error) { toast.error('Erro ao atualizar custo extra'); console.error(error); return; }
    setData(d => ({ ...d, extraCosts: d.extraCosts.map(x => x.id === e.id ? e : x) }));
  }, []);

  const deleteExtraCost = useCallback(async (id: string) => {
    const { error } = await supabase.from('extra_costs').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir custo extra'); console.error(error); return; }
    setData(d => ({ ...d, extraCosts: d.extraCosts.filter(x => x.id !== id) }));
  }, []);

  const ctx: AppContextType = {
    ...data,
    loading,
    addIngredient, updateIngredient, deleteIngredient,
    addYieldFactor, updateYieldFactor, deleteYieldFactor,
    addComponent, updateComponent, deleteComponent,
    addPlateSize, updatePlateSize, deletePlateSize,
    addPlate, updatePlate, deletePlate,
    addExtraCost, updateExtraCost, deleteExtraCost,
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
