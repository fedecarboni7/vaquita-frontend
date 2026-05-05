import { createContext, useEffect, useState, type ReactNode } from "react";

/* eslint-disable react-refresh/only-export-components */

const KEY = "balances_visible";

interface BalanceVisibilityContextValue {
  balancesVisible: boolean;
  toggleBalancesVisible: () => void;
}

export const BalanceVisibilityContext = createContext<BalanceVisibilityContextValue>({
  balancesVisible: true,
  toggleBalancesVisible: () => {},
});

function getInitialValue(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [balancesVisible, setBalancesVisible] = useState(getInitialValue);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, balancesVisible ? "true" : "false");
    } catch {
      // ignore
    }
  }, [balancesVisible]);

  const toggleBalancesVisible = () => setBalancesVisible((v) => !v);

  return (
    <BalanceVisibilityContext.Provider value={{ balancesVisible, toggleBalancesVisible }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}
