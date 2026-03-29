import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import TransactionRow from "./TransactionRow";
import type { Transaction } from "@/types/transaction";

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
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

interface Props {
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function MonthSection({
  transactions,
  hasMore,
  onLoadMore,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
            const label = t.description || t.category || "Sin descripción";
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
                      {t.type === "expense" ? "-" : ""}
                      {formatAmount(t.amount, t.currency)}
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

                <div className="mt-2 flex items-center gap-2 flex-wrap min-w-0">
                  {t.category && (
                    <span className={`tag ${getCategoryTagClass(t.category)}`}>
                      {t.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {t.account}
                  </span>
                </div>

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
