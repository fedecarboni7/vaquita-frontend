import { useMemo } from "react";
import type { Account } from "@/types/transaction";

const DAY_MS = 86_400_000;

export interface CreditCardAlert {
  accountId: string;
  accountName: string;
  dueDate: string;
  daysUntilDue: number;
}

function parseLocalDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function useCreditCardAlerts(accounts: Account[]) {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const alerts: CreditCardAlert[] = [];

    for (const account of accounts) {
      if (account.account_type !== "credit_card" || !account.payment_due_date) {
        continue;
      }

      const dueDate = parseLocalDate(account.payment_due_date);
      if (!dueDate) {
        continue;
      }

      const dueDay = startOfDay(dueDate);
      const daysUntilDue = Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);
      if (daysUntilDue < 0 || daysUntilDue > 5) {
        continue;
      }

      alerts.push({
        accountId: account.id,
        accountName: account.name,
        dueDate: account.payment_due_date,
        daysUntilDue,
      });
    }

    return alerts;
  }, [accounts]);
}
