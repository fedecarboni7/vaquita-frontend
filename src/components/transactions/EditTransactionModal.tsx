import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  formatAmountForDisplay,
  parseAmountForSubmission,
  sanitizeAmountInput,
} from "@/lib/amountInput";
import type { CurrencyCode, Transaction, TransactionType } from "@/types/transaction";
import ReceiptUploader from "./ReceiptUploader";

interface Props {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
];

function getCurrentLocalDateISO(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split("T")[0];
}

function parseInstallments(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export default function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
}: Props) {
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(() => sanitizeAmountInput(String(transaction.amount)));
  const [displayAmount, setDisplayAmount] = useState(() =>
    formatAmountForDisplay(sanitizeAmountInput(String(transaction.amount))),
  );
  const [description, setDescription] = useState(transaction.description || "");
  const [categoryId, setCategoryId] = useState(transaction.category_id || "__none__");
  const [subcategoryId, setSubcategoryId] = useState(transaction.subcategory_id || "__none__");
  const [account, setAccount] = useState(transaction.account || "");
  const [accountDestination, setAccountDestination] = useState(transaction.account_destination || "");
  const [expenseDate, setExpenseDate] = useState(transaction.expense_date || getCurrentLocalDateISO());
  const [currency, setCurrency] = useState<CurrencyCode>(transaction.currency);
  const [note, setNote] = useState(transaction.note || "");
  const [affectsBalance, setAffectsBalance] = useState(transaction.affects_balance !== false);
  const [toAmountInput, setToAmountInput] = useState(
    () => transaction.to_amount != null ? sanitizeAmountInput(String(transaction.to_amount)) : "",
  );
  const [displayToAmount, setDisplayToAmount] = useState(() =>
    transaction.to_amount != null
      ? formatAmountForDisplay(sanitizeAmountInput(String(transaction.to_amount)))
      : "",
  );
  const [installmentsInput, setInstallmentsInput] = useState(
    transaction.installments != null ? String(transaction.installments) : "",
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(transaction.receipt_url ?? null);

  const updateMutation = useUpdateTransaction();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const isTransfer = transactionType === "transfer";
  const isExpense = transactionType === "expense";
  const categoriesForType = useMemo(
    () =>
      transactionType === "transfer"
        ? []
        : categories.filter((item) => item.type === transactionType),
    [categories, transactionType],
  );

  const selectedCategory = useMemo(
    () => categoriesForType.find((item) => item.id === categoryId) ?? null,
    [categoriesForType, categoryId],
  );
  const availableSubcategories = useMemo(
    () => selectedCategory?.subcategories ?? [],
    [selectedCategory],
  );
  const safeCategoryValue = useMemo(() => {
    if (categoryId === "__none__") {
      return "__none__";
    }

    const categoryExists = categoriesForType.some((item) => item.id === categoryId);
    return categoryExists ? categoryId : "__none__";
  }, [categoriesForType, categoryId]);
  const safeSubcategoryValue = useMemo(() => {
    if (subcategoryId === "__none__") {
      return "__none__";
    }

    const subcategoryExists = availableSubcategories.some((item) => item.id === subcategoryId);
    return subcategoryExists ? subcategoryId : "__none__";
  }, [availableSubcategories, subcategoryId]);
  const parsedAmount = parseAmountForSubmission(amount);
  const hasInvalidAmount = parsedAmount == null || parsedAmount <= 0;
  const installments = parseInstallments(installmentsInput);
  const hasInvalidInstallments = isExpense && installmentsInput !== "" && installments === null;
  const parsedToAmount = parseAmountForSubmission(toAmountInput);
  const hasInvalidToAmount =
    isTransfer && toAmountInput !== "" && (parsedToAmount == null || parsedToAmount <= 0);
  const selectedTypeLabel =
    TYPE_OPTIONS.find((option) => option.value === transactionType)?.label || "Gasto";

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setReceiptUrl(transaction.receipt_url ?? null);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, transaction.receipt_url],
  );

  const handleTypeChange = (value: TransactionType) => {
    setTransactionType(value);
    setCategoryId("__none__");
    setSubcategoryId("__none__");

    if (value !== "transfer") {
      setAccountDestination("");
      setToAmountInput("");
    }

    if (value !== "expense") {
      setInstallmentsInput("");
    }
  };

  const handleSave = useCallback(() => {
    const selectedSourceAccount = accounts.find((item) => item.name === account);
    const selectedDestinationAccount = accounts.find((item) => item.name === accountDestination);
    const resolvedAccountId = selectedSourceAccount?.id ?? transaction.account_id;

    if (!resolvedAccountId) {
      return;
    }

    if (parsedAmount == null || parsedAmount <= 0) {
      return;
    }

    if (isTransfer && hasInvalidToAmount) {
      return;
    }

    const commonData = {
      amount: parsedAmount,
      description,
      account_id: resolvedAccountId,
      expense_date: expenseDate || getCurrentLocalDateISO(),
      currency,
      type: transactionType,
      note: note.trim() ? note.trim() : null,
      affects_balance: affectsBalance,
    };

    const transferData = {
      ...commonData,
      category_id: null,
      subcategory_id: null,
      installments: null,
      account_destination_id:
        (selectedDestinationAccount?.id ?? transaction.account_destination_id) || null,
      to_amount: toAmountInput.trim() ? parsedToAmount : null,
    };

    const defaultData = {
      ...commonData,
      category_id: safeCategoryValue === "__none__" ? null : safeCategoryValue,
      subcategory_id: safeSubcategoryValue === "__none__" ? null : safeSubcategoryValue,
      installments: isExpense ? installments : null,
      account_destination_id: null,
    };

    updateMutation.mutate(
      {
        id: transaction.id,
        data: isTransfer ? transferData : defaultData,
      },
      {
        onSuccess: () => {
          toast.success("Registro actualizado correctamente");
          handleOpenChange(false);
        },
        onError: (error) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "No se pudo actualizar la transacción";
          toast.error(message);
        },
      },
    );
  }, [
    account,
    accountDestination,
    accounts,
    affectsBalance,
    currency,
    description,
    expenseDate,
    handleOpenChange,
    hasInvalidToAmount,
    installments,
    isExpense,
    isTransfer,
    note,
    parsedAmount,
    parsedToAmount,
    safeCategoryValue,
    safeSubcategoryValue,
    toAmountInput,
    transaction,
    transactionType,
    updateMutation,
  ]);

  const disableSave =
    updateMutation.isPending ||
    hasInvalidAmount ||
    (isTransfer && !accountDestination) ||
    hasInvalidToAmount ||
    hasInvalidInstallments;


  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        !event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey ||
        event.isComposing ||
        event.repeat ||
        disableSave
      ) {
        return;
      }

      if (event.target instanceof HTMLElement) {
        const isSelectInteraction = event.target.closest(
          '[role="combobox"], [role="listbox"], [role="option"]',
        );
        if (isSelectInteraction) {
          return;
        }
      }

      event.preventDefault();
      handleSave();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disableSave, handleSave, open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar transacción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <Select
              value={transactionType}
              onValueChange={(value) => handleTypeChange((value as TransactionType) ?? "expense")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo">{selectedTypeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Monto</label>
            <input
              type="text"
              inputMode="decimal"
              value={displayAmount}
              onChange={(e) => {
                const sanitized = sanitizeAmountInput(e.target.value);
                setAmount(sanitized);
                setDisplayAmount(sanitized);
              }}
              onBlur={() => setDisplayAmount(formatAmountForDisplay(amount))}
              onFocus={() => setDisplayAmount(amount)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="0,00"
            />
            {hasInvalidAmount && (
              <p className="mt-1 text-xs text-destructive">
                Ingresá un monto numérico mayor a 0.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {isTransfer ? "Cuenta de origen" : "Cuenta"}
            </label>
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

          {isTransfer && (
            <div>
              <label className="text-sm font-medium mb-1 block">Cuenta destino</label>
              <Select value={accountDestination} onValueChange={(v) => setAccountDestination(v ?? "")}> 
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.name !== account)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="text-sm font-medium mb-1 block">Monto destino (opcional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={displayToAmount}
                onChange={(e) => {
                  const sanitized = sanitizeAmountInput(e.target.value);
                  setToAmountInput(sanitized);
                  setDisplayToAmount(sanitized);
                }}
                onBlur={() => setDisplayToAmount(formatAmountForDisplay(toAmountInput))}
                onFocus={() => setDisplayToAmount(toAmountInput)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="0,00"
              />
              {hasInvalidToAmount && (
                <p className="mt-1 text-xs text-destructive">
                  Ingresá un monto destino mayor a 0 o dejalo vacío.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {!isTransfer && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select
                  value={safeCategoryValue}
                  onValueChange={(value) => {
                    setCategoryId(value ?? "__none__");
                    setSubcategoryId("__none__");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin categoría">
                      {safeCategoryValue === "__none__" ? "Sin categoría" : selectedCategory?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin categoría</SelectItem>
                    {categoriesForType.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Subcategoría</label>
                <Select
                  value={safeSubcategoryValue}
                  onValueChange={(value) => setSubcategoryId(value ?? "__none__")}
                  disabled={safeCategoryValue === "__none__"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin subcategoría">
                      {safeSubcategoryValue === "__none__"
                        ? "Sin subcategoría"
                        : availableSubcategories.find((item) => item.id === safeSubcategoryValue)?.name}
                    </SelectValue>
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

              {isExpense && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Cuotas</label>
                  <input
                    type="number"
                    min="1"
                    value={installmentsInput}
                    onChange={(event) => setInstallmentsInput(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Sin cuotas"
                  />
                  {hasInvalidInstallments && (
                    <p className="mt-1 text-xs text-destructive">
                      Ingresá un número entero mayor a 0.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">Moneda</label>
            <Select value={currency} onValueChange={(value) => setCurrency((value as CurrencyCode) ?? "ARS")}> 
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Nota</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={affectsBalance}
              onChange={(event) => setAffectsBalance(event.target.checked)}
              className="h-4 w-4"
            />
            Afecta balance en Registros
          </label>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-medium">Comprobante</p>
            <ReceiptUploader
              transactionId={transaction.id}
              currentReceiptUrl={receiptUrl}
              onUploadSuccess={(newUrl) => setReceiptUrl(newUrl)}
              onDeleteSuccess={() => setReceiptUrl(null)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={disableSave}
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
