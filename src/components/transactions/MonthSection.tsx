import { Button } from "@/components/ui/button";
import TransactionRow from "./TransactionRow";
import type { Transaction } from "@/types/transaction";

interface Props {
  month: string; // 'YYYY-MM'
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

function formatMonthHeader(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1);
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function calculateNetTotal(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    if (t.type === "income") return acc + t.amount;
    if (t.type === "expense") return acc - t.amount;
    return acc;
  }, 0);
}

export default function MonthSection({
  month,
  transactions,
  hasMore,
  onLoadMore,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const netTotal = calculateNetTotal(transactions);
  const currency = transactions[0]?.currency ?? "ARS";

  return (
    <section>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold capitalize">
          {formatMonthHeader(month)}
        </h2>
        <span
          className={`text-sm font-medium tabular-nums ${
            netTotal >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {netTotal >= 0 ? "+" : ""}
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(netTotal)}
        </span>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

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
