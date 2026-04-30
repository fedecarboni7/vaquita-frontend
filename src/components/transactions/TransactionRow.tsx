import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrencyAmount, getWeakCurrencyExchangeRateFromAmounts } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
  balancesVisible: boolean;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

function getCategoryTagClass(category: string | null): string {
  if (!category) return "tag-home";
  const norm = category.toLowerCase();
  if (norm.includes("comida") || norm.includes("aliment") || norm.includes("super")) return "tag-food";
  if (norm.includes("transporte") || norm.includes("viaje") || norm.includes("auto")) return "tag-transport";
  if (norm.includes("servicios") || norm.includes("internet") || norm.includes("luz") || norm.includes("gas") || norm.includes("agua")) return "tag-services";
  if (norm.includes("salud") || norm.includes("farmacia") || norm.includes("doctor") || norm.includes("médic") || norm.includes("medic")) return "tag-health";
  if (norm.includes("ocio") || norm.includes("entretenimiento") || norm.includes("salida") || norm.includes("juego")) return "tag-leisure";
  if (norm.includes("sueldo") || norm.includes("salario") || norm.includes("ingreso")) return "tag-salary";
  return "tag-home";
}

export default function TransactionRow({
  transaction,
  balancesVisible,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const exchangeRate = getWeakCurrencyExchangeRateFromAmounts(
    transaction.amount,
    transaction.to_amount,
    transaction.currency,
    transaction.account_destination_currency ?? transaction.currency,
  );

  const categoryLabel = transaction.category_name ?? transaction.category ?? null;
  // Parse date safely, splitting YYYY-MM-DD to avoid timezone shifts
  const [year, month, day] = transaction.expense_date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dateStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

  const label = transaction.description || categoryLabel || "Sin descripción";

  return (
    <tr onClick={() => onSelect(transaction)} className="cursor-pointer">
      <td className="date">{dateStr}</td>
      <td>
        <div className="font-medium">{label}</div>
        {transaction.note && <div className="note">{transaction.note}</div>}
        {transaction.affects_balance === false && (
          <div className="text-[11px] text-muted-foreground">No afecta balance</div>
        )}
      </td>
      <td>
        {categoryLabel && (
          <span className={`tag ${getCategoryTagClass(categoryLabel)}`}>
            {categoryLabel}
          </span>
        )}
      </td>
      <td>
        <span className="account-badge">{transaction.account}</span>
      </td>
      <td className={cn(
        "amount",
        transaction.type === "expense" && "neg",
        transaction.type === "income" && "pos",
      )}>
        {transaction.type === "transfer" && transaction.to_amount != null ? (
          <div className="flex flex-col items-end gap-0.5">
            <span>{balancesVisible ? formatCurrencyAmount(transaction.amount, transaction.currency) : "••••••"}</span>
            <span className="text-[11px] text-muted-foreground">
              → {balancesVisible
                ? formatCurrencyAmount(
                  transaction.to_amount,
                  transaction.account_destination_currency ?? transaction.currency,
                )
                : "••••••"}
              {exchangeRate && ` · TC ${balancesVisible ? formatCurrencyAmount(exchangeRate.amount, exchangeRate.currency) : "••••••"}`}
            </span>
          </div>
        ) : (
          <>
            {balancesVisible
              ? `${transaction.type === "expense" ? "-" : ""}${formatCurrencyAmount(transaction.amount, transaction.currency)}`
              : "••••••"}
          </>
        )}
      </td>
      <td className="w-10 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 rounded-md hover:bg-accent shrink-0 inline-flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(transaction); }}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(transaction); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
