import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AmountInput from "@/components/ui/AmountInput";
import { useCategories } from "@/hooks/useCategories";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgets";
import {
  formatAmountForDisplay,
  parseAmountForSubmission,
  sanitizeAmountInput,
} from "@/lib/amountInput";
import type { Budget } from "@/types/budgets";
import type { Category, CurrencyCode } from "@/types/transaction";

const NONE_VALUE = "__none__";

interface BudgetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  defaultCurrency: CurrencyCode;
}

function getInitialAmount(budget: Budget | null): string {
  if (!budget) return "";
  return sanitizeAmountInput(String(budget.amount).replace(".", ","));
}

interface BudgetFormContentProps {
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  defaultCurrency: CurrencyCode;
}

function BudgetFormContent({ onOpenChange, budget, defaultCurrency }: BudgetFormContentProps) {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const initialAmount = getInitialAmount(budget);
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? NONE_VALUE);
  const [subcategoryId, setSubcategoryId] = useState(budget?.subcategory_id ?? NONE_VALUE);
  const [amount, setAmount] = useState(initialAmount);
  const [displayAmount, setDisplayAmount] = useState(formatAmountForDisplay(initialAmount));
  const [currency, setCurrency] = useState<CurrencyCode>(budget?.currency ?? defaultCurrency);

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );
  const selectedCategory = expenseCategories.find((category) => category.id === categoryId) ?? null;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isEditing = budget !== null;

  const updateAmount = (rawValue: string) => {
    const sanitized = sanitizeAmountInput(rawValue.replace(/\./g, ","));
    setAmount(sanitized);
    setDisplayAmount(formatAmountForDisplay(sanitized));
  };

  const selectedSubcategory = selectedCategory?.subcategories.find((item) => item.id === subcategoryId) ?? null;

  const handleSubmit = async () => {
    const parsedAmount = parseAmountForSubmission(amount);
    if (categoryId === NONE_VALUE || parsedAmount == null || parsedAmount <= 0) return;

    const payload = {
      category_id: categoryId,
      subcategory_id: subcategoryId === NONE_VALUE ? null : subcategoryId,
      amount: parsedAmount,
      currency,
    };

    try {
      if (budget) {
        await updateMutation.mutateAsync({ id: budget.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      return;
    }
  };

  return (
    <DialogContent showCloseButton={false}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2"
        aria-label="Cerrar"
        title="Cerrar"
        onClick={() => onOpenChange(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Categoría</span>
          <Select
            value={categoryId === NONE_VALUE ? null : categoryId}
            onValueChange={(value) => {
              setCategoryId(value ?? NONE_VALUE);
              setSubcategoryId(NONE_VALUE);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar categoría">
                {selectedCategory
                  ? [selectedCategory.emoji, selectedCategory.name].filter(Boolean).join(" ")
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {[category.emoji, category.name].filter(Boolean).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Subcategoría (opcional)</span>
          <Select
            value={subcategoryId === NONE_VALUE ? null : subcategoryId}
            onValueChange={(value) => setSubcategoryId(value ?? NONE_VALUE)}
            disabled={!selectedCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toda la categoría">
                {selectedSubcategory?.name ?? (subcategoryId === NONE_VALUE ? "Toda la categoría" : undefined)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Toda la categoría</SelectItem>
              {selectedCategory?.subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Límite mensual</label>
          <AmountInput
            value={displayAmount}
            onChange={(event) => updateAmount(event.target.value)}
            onValueChange={updateAmount}
            placeholder="0,00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted-foreground"
          />
        </div>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Moneda</span>
          <Select
            value={currency}
            onValueChange={(value) => {
              if (value === "ARS" || value === "USD") setCurrency(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || categoryId === NONE_VALUE || !amount.trim()}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar cambios" : "Crear presupuesto"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function BudgetFormModal({
  open,
  onOpenChange,
  budget,
  defaultCurrency,
}: BudgetFormModalProps) {
  const formKey = `${open ? "open" : "closed"}-${budget?.id ?? "new"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BudgetFormContent
        key={formKey}
        onOpenChange={onOpenChange}
        budget={budget}
        defaultCurrency={defaultCurrency}
      />
    </Dialog>
  );
}
