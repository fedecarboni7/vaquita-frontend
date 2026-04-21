import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import type { StatsResponse } from "@/types/stats";

export function useStats(month: string) {
  return useQuery({
    queryKey: ["stats", month],
    queryFn: () =>
      apiFetch<StatsResponse>(`/stats?month=${encodeURIComponent(month)}`),
  });
}
