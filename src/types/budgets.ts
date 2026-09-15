import type { CurrencyCode } from "@/types/transaction";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  subcategory_id: string | null;
  amount: number | string;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
  spent: number | string;
  remaining: number | string;
  percentage: number;
}

export interface BudgetPayload {
  category_id: string;
  subcategory_id: string | null;
  amount: number;
  currency: CurrencyCode;
}

export interface BudgetUpdatePayload {
  category_id?: string;
  subcategory_id?: string | null;
  amount?: number;
  currency?: CurrencyCode;
}
