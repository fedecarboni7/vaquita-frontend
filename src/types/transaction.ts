export type TransactionType = "expense" | "income" | "transfer";
export type CurrencyCode = "ARS" | "USD" | "EUR";
export type AccountTypeCode = "savings" | "checking" | "credit_card" | "digital_wallet" | "cash";

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  category_name: string | null;
  category?: string | null;
  account: string | null;
  description: string | null;
  expense_date: string; // 'YYYY-MM-DD'
  subcategory_id: string | null;
  subcategory_name: string | null;
  note?: string | null;
  installments?: number | null;
  account_destination?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  has_more: boolean;
}

export interface Account {
  id: string;
  name: string;
  account_type: AccountTypeCode;
  currency: CurrencyCode;
  balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  created_at: string;
  subcategories: Subcategory[];
}
