import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/api";
import type { ApiKeyStatusResponse, ApiKeyUpsertRequest } from "@/types/settings";

const API_KEY_STATUS_QUERY_KEY = ["settings", "api-key"] as const;

export function useApiKeyStatus() {
  return useQuery({
    queryKey: API_KEY_STATUS_QUERY_KEY,
    queryFn: () => apiFetch<ApiKeyStatusResponse>("/settings/api-key"),
  });
}

export function useSaveApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApiKeyUpsertRequest) =>
      apiFetch<ApiKeyStatusResponse>("/settings/api-key", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_STATUS_QUERY_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/settings/api-key", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_STATUS_QUERY_KEY });
    },
  });
}
