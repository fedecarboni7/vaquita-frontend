import type { CurrencyCode, Transaction } from "@/types/transaction";

export interface CurrencySummary {
  income: number;
  expenses: number;
  netBalance: number;
}

export interface DayGroup {
  date: string;
  label: string;
  netBalance: number;
  transactions: Transaction[];
}

function getAmountSignal(transaction: Transaction): number {
  if (transaction.affects_balance === false) return 0;
  if (transaction.type === "income") return 1;
  if (transaction.type === "expense") return -1;
  return 0;
}

export function calculateCurrencySummary(
  transactions: Transaction[],
  currency: CurrencyCode,
): CurrencySummary {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    if (transaction.currency !== currency) continue;
    const signal = getAmountSignal(transaction);
    if (signal === 0) continue;
    if (signal > 0) income += transaction.amount;
    else expenses += transaction.amount;
  }

  return { income, expenses, netBalance: income - expenses };
}

function parseDate(dateIso: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayLabel(dateIso: string): string {
  const date = parseDate(dateIso);
  const label = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function groupTransactionsByDay(transactions: Transaction[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const transaction of transactions) {
    const existing = groups.get(transaction.expense_date);
    const netBalance = (existing?.netBalance ?? 0) + getAmountSignal(transaction) * transaction.amount;
    groups.set(transaction.expense_date, {
      date: transaction.expense_date,
      label: formatDayLabel(transaction.expense_date),
      netBalance,
      transactions: existing ? [...existing.transactions, transaction] : [transaction],
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
}
