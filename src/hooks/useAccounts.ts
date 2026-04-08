import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { Account, AccountTypeCode, CurrencyCode } from "../types/transaction";

interface AccountCreatePayload {
  name: string;
  account_type: AccountTypeCode;
  currency: CurrencyCode;
  include_in_total?: boolean;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  payment_due_date?: string | null;
}

interface AccountUpdatePayload extends AccountCreatePayload {
  id: string;
}

interface AccountAdjustPayload {
  id: string;
  balance: number;
}

interface AccountAdjustResponse {
  applied: boolean;
  delta: number;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiFetch<Account[]>("/accounts"),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccountCreatePayload) =>
      apiFetch<Account>("/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: AccountUpdatePayload) =>
      apiFetch<Account>(`/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useAdjustAccountBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, balance }: AccountAdjustPayload) =>
      apiFetch<AccountAdjustResponse>(`/accounts/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ balance }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
