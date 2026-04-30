import { useEffect, useState } from "react";

const KEY = "balances_visible";

export function useBalanceVisibility(): {
  balancesVisible: boolean;
  toggleBalancesVisible: () => void;
} {
  const [balancesVisible, setBalancesVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw === null) return true;
      return raw === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, balancesVisible ? "true" : "false");
    } catch {
      // ignore
    }
  }, [balancesVisible]);

  const toggleBalancesVisible = () => setBalancesVisible((v) => !v);

  return { balancesVisible, toggleBalancesVisible };
}
