import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import type { StatsResponse } from "@/types/stats";
import type { CurrencyCode } from "@/types/transaction";

export function useStats(month: string, currency: CurrencyCode) {
  return useQuery({
    queryKey: ["stats", month, currency],
    queryFn: () =>
      apiFetch<StatsResponse>(
        `/stats?month=${encodeURIComponent(month)}&currency=${encodeURIComponent(currency)}`,
      ),
  });
}
