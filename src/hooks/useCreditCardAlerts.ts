import { useMemo } from "react";
import type { Account } from "@/types/transaction";

const DAY_MS = 86_400_000;

export interface CreditCardAlert {
  accountId: string;
  accountName: string;
  dueDate: string;
  daysUntilDue: number;
}

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function useCreditCardAlerts(accounts: Account[]) {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const alerts: CreditCardAlert[] = [];

    for (const account of accounts) {
      if (account.account_type !== "credit_card" || !account.payment_due_date) {
        continue;
      }

      const dueDate = parseLocalDate(account.payment_due_date);
      if (Number.isNaN(dueDate.getTime())) {
        continue;
      }

      const dueDay = startOfDay(dueDate);
      const daysUntilDue = Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);
      const isUpcoming = daysUntilDue >= 0 && daysUntilDue <= 5;
      const isPastDueThisMonth =
        daysUntilDue < 0 &&
        dueDay.getFullYear() === todayYear &&
        dueDay.getMonth() === todayMonth;

      if (!isUpcoming && !isPastDueThisMonth) {
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
