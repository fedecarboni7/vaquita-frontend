import { createContext, useEffect, useState, type ReactNode } from "react";
import type { CurrencyCode } from "@/types/transaction";

/* eslint-disable react-refresh/only-export-components */

const KEY = "stats_currency_preference";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

export const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "ARS",
  setCurrency: () => {},
});

function getInitialValue(): CurrencyCode {
  if (typeof window === "undefined") return "ARS";
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "USD" ? "USD" : "ARS";
  } catch {
    return "ARS";
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>(getInitialValue);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, currency);
    } catch {
      // ignore
    }
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}
