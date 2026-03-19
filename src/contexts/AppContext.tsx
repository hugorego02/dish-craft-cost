import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Ingredient, YieldFactor, FoodComponent, PlateSize, Plate, ExtraCost } from '@/types';

const STORAGE_KEY = 'mealprep-pricing-data';

const defaultData: AppData = {
  ingredients: [],
  yieldFactors: [],
  components: [],
  plateSizes: [],
  plates: [],
  extraCosts: [],
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {}
  return defaultData;
}

interface AppContextType extends AppData {
  // Ingredients
  addIngredient: (i: Ingredient) => void;
  updateIngredient: (i: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  // Yield
  addYieldFactor: (y: YieldFactor) => void;
  updateYieldFactor: (y: YieldFactor) => void;
  deleteYieldFactor: (id: string) => void;
  // Components
  addComponent: (c: FoodComponent) => void;
  updateComponent: (c: FoodComponent) => void;
  deleteComponent: (id: string) => void;
  // Plate sizes
  addPlateSize: (p: PlateSize) => void;
  updatePlateSize: (p: PlateSize) => void;
  deletePlateSize: (id: string) => void;
  // Plates
  addPlate: (p: Plate) => void;
  updatePlate: (p: Plate) => void;
  deletePlate: (id: string) => void;
  // Extra costs
  addExtraCost: (e: ExtraCost) => void;
  updateExtraCost: (e: ExtraCost) => void;
  deleteExtraCost: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData(prev => fn(prev)), []);

  const ctx: AppContextType = {
    ...data,
    addIngredient: (i) => update(d => ({ ...d, ingredients: [...d.ingredients, i] })),
    updateIngredient: (i) => update(d => ({ ...d, ingredients: d.ingredients.map(x => x.id === i.id ? i : x) })),
    deleteIngredient: (id) => update(d => ({ ...d, ingredients: d.ingredients.filter(x => x.id !== id) })),
    addYieldFactor: (y) => update(d => ({ ...d, yieldFactors: [...d.yieldFactors, y] })),
    updateYieldFactor: (y) => update(d => ({ ...d, yieldFactors: d.yieldFactors.map(x => x.id === y.id ? y : x) })),
    deleteYieldFactor: (id) => update(d => ({ ...d, yieldFactors: d.yieldFactors.filter(x => x.id !== id) })),
    addComponent: (c) => update(d => ({ ...d, components: [...d.components, c] })),
    updateComponent: (c) => update(d => ({ ...d, components: d.components.map(x => x.id === c.id ? c : x) })),
    deleteComponent: (id) => update(d => ({ ...d, components: d.components.filter(x => x.id !== id) })),
    addPlateSize: (p) => update(d => ({ ...d, plateSizes: [...d.plateSizes, p] })),
    updatePlateSize: (p) => update(d => ({ ...d, plateSizes: d.plateSizes.map(x => x.id === p.id ? p : x) })),
    deletePlateSize: (id) => update(d => ({ ...d, plateSizes: d.plateSizes.filter(x => x.id !== id) })),
    addPlate: (p) => update(d => ({ ...d, plates: [...d.plates, p] })),
    updatePlate: (p) => update(d => ({ ...d, plates: d.plates.map(x => x.id === p.id ? p : x) })),
    deletePlate: (id) => update(d => ({ ...d, plates: d.plates.filter(x => x.id !== id) })),
    addExtraCost: (e) => update(d => ({ ...d, extraCosts: [...d.extraCosts, e] })),
    updateExtraCost: (e) => update(d => ({ ...d, extraCosts: d.extraCosts.map(x => x.id === e.id ? e : x) })),
    deleteExtraCost: (id) => update(d => ({ ...d, extraCosts: d.extraCosts.filter(x => x.id !== id) })),
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
