export type TransactionType = "expense" | "income" | "transfer";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string | null;
  account: string;
  description: string;
  expense_date: string; // 'YYYY-MM-DD'
  subcategory?: string | null;
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
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  created_at: string;
}
