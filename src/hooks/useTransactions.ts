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
  type?: TransactionType;
  account?: string;
  category?: string;
  subcategoryId?: string;
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
}

function buildSearchParams(params: UseTransactionsParams): string {
  const { month, type, account, category, subcategoryId, limit = 20, offset = 0 } = params;

  const [year, monthNum] = month.split("-").map(Number);
  const dateFrom = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const dateTo = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const sp = new URLSearchParams();
  sp.set("date_from", dateFrom);
  sp.set("date_to", dateTo);
  sp.set("limit", String(limit));
  sp.set("offset", String(offset));
  if (type) sp.set("type", type);
  if (account) sp.set("account", account);
  if (category) sp.set("category", category);
  if (subcategoryId) sp.set("subcategory_id", subcategoryId);

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
