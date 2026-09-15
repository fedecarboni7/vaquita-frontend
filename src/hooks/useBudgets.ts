import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/api";
import type { Budget, BudgetPayload, BudgetUpdatePayload } from "@/types/budgets";
import type { CurrencyCode } from "@/types/transaction";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useBudgets(currency: CurrencyCode) {
  return useQuery({
    queryKey: ["budgets", currency],
    queryFn: async () => {
      const budgets = await apiFetch<Budget[]>("/budgets");
      return budgets.filter((budget) => budget.currency === currency);
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BudgetPayload) =>
      apiFetch<Budget>("/budgets", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo crear el presupuesto"));
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: BudgetUpdatePayload & { id: string }) =>
      apiFetch<Budget>(`/budgets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar el presupuesto"));
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar el presupuesto"));
    },
  });
}
