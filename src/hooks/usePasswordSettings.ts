import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/api";

export const CURRENT_USER_QUERY_KEY = ["current-user"] as const;

export function useSetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPassword: string) =>
      apiFetch("/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}