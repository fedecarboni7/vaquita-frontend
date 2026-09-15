import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import BudgetFormModal from "@/components/budgets/BudgetFormModal";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets, useDeleteBudget } from "@/hooks/useBudgets";
import { getCategoryColor, getCategoryEmoji } from "@/lib/categoryDisplay";
import { formatCurrencyAmount } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import type { Budget } from "@/types/budgets";
import type { Category, CurrencyCode, Subcategory } from "@/types/transaction";

function getBudgetNumber(value: number | string): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getBudgetTone(percentage: number): {
  text: string;
  bar: string;
} {
  if (percentage >= 100) {
    return { text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" };
  }
  if (percentage >= 70) {
    return { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  }
  return { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" };
}

function formatBudgetAmount(value: number | string, currency: CurrencyCode): string {
  return formatCurrencyAmount(getBudgetNumber(value), currency);
}

interface BudgetRowProps {
  budget: Budget;
  category: Category;
  subcategory: Subcategory | null;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

function BudgetRow({ budget, category, subcategory, onEdit, onDelete }: BudgetRowProps) {
  const spent = getBudgetNumber(budget.spent);
  const amount = getBudgetNumber(budget.amount);
  const remaining = getBudgetNumber(budget.remaining);
  const percentage = getBudgetNumber(budget.percentage);
  const tone = getBudgetTone(percentage);
  const categoryColor = getCategoryColor(category);
  const label = subcategory
    ? `${getCategoryEmoji(category)} ${category.name} → ${subcategory.name}`.trim()
    : `${getCategoryEmoji(category)} ${category.name}`.trim();

  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-8 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatBudgetAmount(spent, budget.currency)} / {formatBudgetAmount(amount, budget.currency)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Editar presupuesto"
                aria-label="Editar presupuesto"
                onClick={() => onEdit(budget)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Eliminar presupuesto"
                aria-label="Eliminar presupuesto"
                onClick={() => onDelete(budget)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Progress
            value={Math.min(Math.max(percentage, 0), 100)}
            aria-label={`Progreso de ${label}`}
            className={`mt-3 h-2 gap-0 [&_[data-slot=progress-indicator]]:${tone.bar}`}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <span className={tone.text}>
              {percentage.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% usado
            </span>
            <span className={remaining < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>
              {remaining < 0
                ? `Excedido por ${formatBudgetAmount(Math.abs(remaining), budget.currency)}`
                : `Restante ${formatBudgetAmount(remaining, budget.currency)}`}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

interface BudgetGroup {
  category: Category;
  categoryBudget: Budget | null;
  subcategoryBudgets: Array<{ budget: Budget; subcategory: Subcategory }>;
}

export default function BudgetsSection() {
  const { currency } = useCurrency();
  const { data: budgets = [], isLoading, isError, refetch } = useBudgets(currency);
  const { data: categories = [] } = useCategories();
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const deleteMutation = useDeleteBudget();

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const groups = useMemo<BudgetGroup[]>(() => {
    const grouped = new Map<string, BudgetGroup>();
    for (const budget of budgets) {
      const category = categoryMap.get(budget.category_id);
      if (!category) continue;
      const group = grouped.get(category.id) ?? {
        category,
        categoryBudget: null,
        subcategoryBudgets: [],
      };
      if (budget.subcategory_id === null) {
        group.categoryBudget = budget;
      } else {
        const subcategory = category.subcategories.find((item) => item.id === budget.subcategory_id);
        if (subcategory) group.subcategoryBudgets.push({ budget, subcategory });
      }
      grouped.set(category.id, group);
    }
    return [...grouped.values()];
  }, [budgets, categoryMap]);

  const openCreate = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingBudget(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deletingBudget) return;
    deleteMutation.mutate(deletingBudget.id, {
      onSuccess: () => setDeletingBudget(null),
    });
  };

  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Presupuestos</h2>
          <p className="mt-1 text-xs text-muted-foreground">Límites de gasto en {currency}</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo presupuesto
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          <p>No pudimos cargar tus presupuestos.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          <p>Sin presupuestos configurados todavía.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={openCreate}>
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((group) => {
            const hasSubcategoryBudgets = group.subcategoryBudgets.length > 0;
            const isExpanded = expandedCategoryIds.has(group.category.id);
            const showSubcategoryBudgets = !group.categoryBudget || isExpanded;
            return (
              <div key={group.category.id} className="space-y-2">
                {hasSubcategoryBudgets && group.categoryBudget && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => toggleCategory(group.category.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {group.category.name}
                  </button>
                )}
                {group.categoryBudget && (
                  <BudgetRow
                    budget={group.categoryBudget}
                    category={group.category}
                    subcategory={null}
                    onEdit={openEdit}
                    onDelete={setDeletingBudget}
                  />
                )}
                {showSubcategoryBudgets && group.subcategoryBudgets.map(({ budget, subcategory }) => (
                  <div key={budget.id} className={group.categoryBudget ? "ml-4 border-l border-border pl-3" : undefined}>
                    <BudgetRow
                      budget={budget}
                      category={group.category}
                      subcategory={subcategory}
                      onEdit={openEdit}
                      onDelete={setDeletingBudget}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <BudgetFormModal
          open
          onOpenChange={(open) => {
            if (!open) closeForm();
          }}
          budget={editingBudget}
          defaultCurrency={currency}
        />
      )}
      <AlertDialog open={deletingBudget !== null} onOpenChange={(open) => !open && setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El límite mensual será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
