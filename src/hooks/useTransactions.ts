import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type {
  CurrencyCode,
  TransactionType,
  PaginatedTransactions,
  Transaction,
} from "../types/transaction";

interface UseTransactionsParams {
  month: string; // 'YYYY-MM'
  types?: TransactionType[];
  accountIds?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateTransactionPayload {
  amount: number;
  description: string;
  type: TransactionType;
  account_id: string;
  expense_date: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  currency?: CurrencyCode;
  note?: string | null;
  installments?: number | null;
  account_destination_id?: string | null;
  to_amount?: number | null;
  affects_balance?: boolean;
}

function buildSearchParams(params: UseTransactionsParams): string {
  const {
    month,
    types,
    accountIds,
    categoryIds,
    subcategoryIds,
    limit = 20,
    offset = 0,
  } = params;

  const [year, monthNum] = month.split("-").map(Number);
  const dateFrom = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const dateTo = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const sp = new URLSearchParams();
  sp.set("date_from", dateFrom);
  sp.set("date_to", dateTo);
  sp.set("limit", String(limit));
  sp.set("offset", String(offset));

  for (const transactionType of types ?? []) {
    sp.append("types", transactionType);
  }
  for (const accountId of accountIds ?? []) {
    sp.append("account_ids", accountId);
  }
  for (const categoryId of categoryIds ?? []) {
    sp.append("category_ids", categoryId);
  }
  for (const subcategoryId of subcategoryIds ?? []) {
    sp.append("subcategory_ids", subcategoryId);
  }

  return sp.toString();
}

export function useTransactions(params: UseTransactionsParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () =>
      apiFetch<PaginatedTransactions>(
        `/expenses?${buildSearchParams(params)}`,
      ),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      apiFetch<Transaction>("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Transaction>;
    }) =>
      apiFetch<Transaction>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
