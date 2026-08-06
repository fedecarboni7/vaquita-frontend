import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrencyAmount } from "@/lib/utils";
import { groupTransactionsByDay } from "@/lib/transactions";
import TransactionRow from "./TransactionRow";
import type { Category, CurrencyCode, Transaction } from "@/types/transaction";

interface Props {
  transactions: Transaction[];
  currency: CurrencyCode;
  balancesVisible: boolean;
  hasMore: boolean;
  categories: Category[];
  onLoadMore: () => void;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function DayGroupedList({
  transactions,
  currency,
  balancesVisible,
  hasMore,
  categories,
  onLoadMore,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const days = useMemo(() => groupTransactionsByDay(transactions), [transactions]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return (
    <section className="space-y-5">
      {days.map((day) => (
        <div key={day.date}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h3 className="text-xs font-semibold text-muted-foreground">{day.label}</h3>
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                day.netBalance > 0
                  ? "text-green-500"
                  : day.netBalance < 0
                    ? "text-red-500"
                    : "text-muted-foreground",
              )}
            >
              {balancesVisible
                ? `${day.netBalance > 0 ? "+" : ""}${formatCurrencyAmount(day.netBalance, currency)}`
                : "••••••"}
            </span>
          </div>

          <div className="space-y-1.5">
            {day.transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                balancesVisible={balancesVisible}
                categoryData={
                  transaction.category_id ? categoryMap.get(transaction.category_id) : undefined
                }
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center py-3">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Cargar más
          </Button>
        </div>
      )}
    </section>
  );
}
