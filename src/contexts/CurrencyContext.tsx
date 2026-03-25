import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CurrencyCode = 'BRL' | 'USD';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  fmt: (value: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY = 'precifichef-currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'USD' || saved === 'BRL') ? saved : 'BRL';
  });

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const config = CURRENCIES[currency];

  const fmt = useCallback((value: number) => {
    return `${config.symbol} ${value.toFixed(2)}`;
  }, [config.symbol]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, symbol: config.symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
