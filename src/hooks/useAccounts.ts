import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { Account, AccountSummary, AccountTypeCode, CurrencyCode } from "../types/transaction";

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
  affects_balance?: boolean;
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

export function useAccountSummary(accountId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["account-summary", accountId, from, to],
    queryFn: () => {
      const params = new URLSearchParams({ from, to });
      return apiFetch<AccountSummary>(`/accounts/${accountId}/summary?${params.toString()}`);
    },
    enabled: Boolean(accountId),
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
    mutationFn: ({ id, balance, affects_balance }: AccountAdjustPayload) =>
      apiFetch<AccountAdjustResponse>(`/accounts/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ balance, affects_balance }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
