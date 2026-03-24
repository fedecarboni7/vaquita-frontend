import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { useUpdateTransaction } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import type { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
}: Props) {
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description || "");
  const [category, setCategory] = useState(transaction.category || "");
  const [subcategoryId, setSubcategoryId] = useState(transaction.subcategory_id || "__none__");
  const [account, setAccount] = useState(transaction.account);
  const [expenseDate, setExpenseDate] = useState(transaction.expense_date);

  const updateMutation = useUpdateTransaction();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const selectedCategory = useMemo(
    () => categories.find((item) => item.name === category) ?? null,
    [categories, category],
  );
  const availableSubcategories = selectedCategory?.subcategories ?? [];

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: transaction.id,
        data: {
          amount: parseFloat(amount),
          description,
          category: category || null,
          subcategory_id: subcategoryId === "__none__" ? null : subcategoryId,
          account,
          expense_date: expenseDate,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar transacción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Monto</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Categoría</label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value ?? "");
                setSubcategoryId("__none__");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Subcategoría</label>
            <Select
              value={subcategoryId}
              onValueChange={(value) => setSubcategoryId(value ?? "__none__")}
              disabled={!category}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin subcategoría</SelectItem>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Cuenta</label>
            <Select value={account} onValueChange={(v) => setAccount(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.name}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Fecha</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
