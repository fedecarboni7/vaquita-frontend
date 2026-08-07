import { FileText, Paperclip } from "lucide-react";
import { cn, formatCurrencyAmount } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/categoryDisplay";
import type { Category, Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
  balancesVisible: boolean;
  categoryData: Category | null | undefined;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function TransactionRow({
  transaction,
  balancesVisible,
  categoryData,
  onSelect,
}: Props) {
  const isTransfer = transaction.type === "transfer";

  const categoryLabel = transaction.category_name ?? transaction.category ?? null;
  const label =
    transaction.description ||
    (isTransfer ? "Transferencia" : categoryLabel) ||
    "Sin descripción";
  const emoji = isTransfer ? "🔁" : categoryData ? getCategoryEmoji(categoryData) : "";
  const hasNote = Boolean(transaction.note);
  const hasReceipt = Boolean(transaction.receipt_url);

  const accountLabel = isTransfer
    ? `${transaction.account ?? "Sin cuenta"} → ${transaction.account_destination ?? "Sin cuenta destino"}`
    : transaction.account;

  const amountColor = isTransfer
    ? "text-foreground"
    : transaction.type === "income"
      ? "text-green-500"
      : "text-red-500";

  return (
    <article
      onClick={() => onSelect(transaction)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
        {emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="min-w-0 truncate text-sm font-medium">{label}</p>
          {hasNote && <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {hasReceipt && <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>
      </div>

      <span className={cn("shrink-0 whitespace-nowrap text-sm font-medium tabular-nums", amountColor)}>
        {balancesVisible
          ? `${transaction.type === "expense" ? "-" : ""}${formatCurrencyAmount(transaction.amount, transaction.currency)}`
          : "••••••"}
      </span>
    </article>
  );
}
