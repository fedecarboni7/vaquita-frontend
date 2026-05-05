import { useContext } from "react";
import { BalanceVisibilityContext } from "@/context/BalanceVisibilityContext";

export function useBalanceVisibility() {
  return useContext(BalanceVisibilityContext);
}

export { BalanceVisibilityProvider } from "@/context/BalanceVisibilityContext";
