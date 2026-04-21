export interface StatsSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  income_delta_pct: number | null;
  expenses_delta_pct: number | null;
  net_balance_delta_pct: number | null;
}

export interface StatsMonthlySeriesItem {
  month: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
}

export interface StatsCategoryExpenseItem {
  category_name: string;
  total: number;
  percentage: number;
}

export interface StatsResponse {
  month: string;
  summary: StatsSummary;
  monthly_series: StatsMonthlySeriesItem[];
  expenses_by_category: StatsCategoryExpenseItem[];
}
