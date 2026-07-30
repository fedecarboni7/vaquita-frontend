import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrencyAmount, getWeakCurrencyExchangeRateFromAmounts } from "@/lib/utils";
import { getCategoryColor, getCategoryEmoji } from "@/lib/categoryDisplay";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import TransactionRow from "./TransactionRow";
import type { Category, Transaction } from "@/types/transaction";

function getDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

interface Props {
  transactions: Transaction[];
  balancesVisible: boolean;
  hasMore: boolean;
  categories: Category[];
  onLoadMore: () => void;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function MonthSection({
  transactions,
  balancesVisible,
  hasMore,
  categories,
  onLoadMore,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  return (
    <section>
      {isDesktop ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Cuenta</th>
                <th className="text-right">Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  balancesVisible={balancesVisible}
                  categoryData={t.category_id ? categoryMap.get(t.category_id) : undefined}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((t) => {
            const categoryLabel = t.category_name ?? t.category ?? null;
            const label = t.description || categoryLabel || "Sin descripción";
            return (
              <article
                key={t.id}
                onClick={() => onSelect(t)}
                className="rounded-lg border border-border bg-card p-3 shadow-xs cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-mono tracking-wide uppercase">
                      {getDateLabel(t.expense_date)}
                    </p>
                    <p className="mt-1 text-sm font-medium break-words">{label}</p>
                  </div>

                  <div className="flex items-start gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        t.type === "expense" && "text-red-500",
                        t.type === "income" && "text-green-500",
                      )}
                    >
                      {balancesVisible
                        ? `${t.type === "expense" ? "-" : ""}${formatCurrencyAmount(t.amount, t.currency)}`
                        : "••••••"}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="p-1 rounded-md hover:bg-accent inline-flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(t); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(t); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(t); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {t.type === "transfer" ? (
                  <div className="mt-2 text-xs text-muted-foreground break-words">
                    {t.account}
                    <span className="mx-1.5">→</span>
                    {t.account_destination || "Sin cuenta destino"}
                    {t.to_amount != null && (
                      <>
                        <span className="mx-1.5">·</span>
                        {balancesVisible ? formatCurrencyAmount(t.amount, t.currency) : "••••••"}
                        <span className="mx-1.5">→</span>
                        {balancesVisible
                          ? formatCurrencyAmount(
                            t.to_amount,
                            t.account_destination_currency ?? t.currency,
                          )
                          : "••••••"}
                        {(() => {
                          const exchangeRate = getWeakCurrencyExchangeRateFromAmounts(
                            t.amount,
                            t.to_amount,
                            t.currency,
                            t.account_destination_currency ?? t.currency,
                          )

                          if (!exchangeRate) return null

                          return (
                            <>
                              <span className="mx-1.5">·</span>
                              TC {balancesVisible ? formatCurrencyAmount(exchangeRate.amount, exchangeRate.currency) : "••••••"}
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 flex-wrap min-w-0">
                    {categoryLabel && t.category_id && categoryMap.get(t.category_id) && (
                      (() => {
                        const cat = categoryMap.get(t.category_id)!;
                        return (
                          <span
                            className="category-badge inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ backgroundColor: getCategoryColor(cat) + "1a", color: getCategoryColor(cat) }}
                          >
                            {getCategoryEmoji(cat)} {categoryLabel}
                          </span>
                        );
                      })()
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {t.account}
                    </span>
                  </div>
                )}

                {t.note && (
                  <p className="mt-2 text-xs text-muted-foreground break-words">{t.note}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

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
