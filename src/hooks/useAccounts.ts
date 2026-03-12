import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { Account } from "../types/transaction";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<Account[]>("/accounts"),
  });
}
