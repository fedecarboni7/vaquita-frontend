import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

function getCategoryInitial(category: string | null): string {
  if (!category) return "?";
  return category.charAt(0).toUpperCase();
}

function getCategoryColor(category: string | null): string {
  if (!category) return "bg-muted";
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-red-500/20 text-red-400",
    "bg-blue-500/20 text-blue-400",
    "bg-green-500/20 text-green-400",
    "bg-yellow-500/20 text-yellow-400",
    "bg-purple-500/20 text-purple-400",
    "bg-pink-500/20 text-pink-400",
    "bg-orange-500/20 text-orange-400",
    "bg-teal-500/20 text-teal-400",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionRow({
  transaction,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const day = new Date(transaction.expense_date + "T12:00:00").getDate();
  const label = transaction.description || transaction.category || "Sin descripción";
  const subtitle = [transaction.category, transaction.account]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => onSelect(transaction)}
    >
      {/* Category icon */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold shrink-0",
          getCategoryColor(transaction.category),
        )}
      >
        {getCategoryInitial(transaction.category)}
      </div>

      {/* Description + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground tabular-nums w-6 text-center shrink-0">
        {day}
      </span>

      {/* Amount */}
      <span
        className={cn(
          "text-sm font-medium tabular-nums shrink-0",
          transaction.type === "expense" && "text-red-500",
          transaction.type === "income" && "text-green-500",
          transaction.type === "transfer" && "text-muted-foreground",
        )}
      >
        {transaction.type === "expense" ? "-" : ""}
        {formatAmount(transaction.amount, transaction.currency)}
      </span>

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-1 rounded-md hover:bg-accent shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSelect(transaction)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(transaction)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(transaction)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
