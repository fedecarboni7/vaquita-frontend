import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Image as ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  uploadReceipt,
  useCreateTransaction,
  type CreateTransactionPayload,
} from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import {
  formatArAmountInput,
  normalizeArAmountInput,
  parseNormalizedAmount,
} from "@/lib/amountInput";
import type { CurrencyCode, TransactionType } from "@/types/transaction";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SubmitMode = "close" | "continue";

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
];

const NO_DESTINATION_VALUE = "__none__";
const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

export default function CreateTransactionModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("__none__");
  const [subcategoryId, setSubcategoryId] = useState("__none__");
  const [accountId, setAccountId] = useState("");
  const [accountDestinationId, setAccountDestinationId] = useState("");
  const [expenseDate, setExpenseDate] = useState(getCurrentLocalDateISO());
  const [note, setNote] = useState("");
  const [installmentsInput, setInstallmentsInput] = useState("");
  const [toAmountInput, setToAmountInput] = useState("");
  const [affectsBalance, setAffectsBalance] = useState(true);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("close");
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);

  const isTransfer = transactionType === "transfer";
  const isExpense = transactionType === "expense";
  const selectedAccountId = accountId;
  const selectedSourceAccount = useMemo(
    () => accounts.find((item) => item.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );
  const selectedDestinationAccount = useMemo(
    () => accounts.find((item) => item.id === accountDestinationId) ?? null,
    [accounts, accountDestinationId],
  );
  const resolvedCurrency: CurrencyCode = selectedSourceAccount?.currency ?? "ARS";
  const resolvedDestinationCurrency: CurrencyCode = selectedDestinationAccount?.currency ?? resolvedCurrency;

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

  const selectedTypeLabel =
    TYPE_OPTIONS.find((option) => option.value === transactionType)?.label || "Gasto";

  const installments = parseInstallments(installmentsInput);
  const hasInvalidInstallments = isExpense && installmentsInput !== "" && installments === null;
  const parsedAmount = parseNormalizedAmount(amount);
  const hasInvalidAmount = parsedAmount == null || parsedAmount <= 0;
  const parsedToAmount = parseNormalizedAmount(toAmountInput);
  const hasInvalidToAmount =
    isTransfer && toAmountInput !== "" && (parsedToAmount == null || parsedToAmount <= 0);

  const handleTypeChange = (value: TransactionType) => {
    setTransactionType(value);
    setCategoryId("__none__");
    setSubcategoryId("__none__");

    if (value !== "transfer") {
      setAccountDestinationId("");
      setToAmountInput("");
    }

    if (value !== "expense") {
      setInstallmentsInput("");
    }
  };

  const handleOriginAccountChange = (value: string | null) => {
    const nextAccountId = value ?? "";
    setAccountId(nextAccountId);

    // Avoid invalid transfer state when user picks destination first and then matches origin.
    if (transactionType === "transfer" && nextAccountId === accountDestinationId) {
      setAccountDestinationId("");
    }
  };

  const clearSelectedReceipt = useCallback(() => {
    setSelectedReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const openReceiptPicker = () => {
    fileInputRef.current?.click();
  };

  const handleReceiptFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan JPG, PNG o WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      toast.error("El comprobante debe pesar hasta 10MB");
      event.target.value = "";
      return;
    }

    setSelectedReceiptFile(file);
  };

  const uploadReceiptInBackground = useCallback(
    async (transactionId: string, file: File) => {
      try {
        await uploadReceipt(transactionId, file);
        toast.success("Comprobante guardado");
      } catch {
        toast.error("No se pudo guardar el comprobante");
      } finally {
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    },
    [queryClient],
  );
  const resetFormForNextEntry = useCallback((
    nextAccountId: string,
    nextExpenseDate: string,
    nextTransactionType: TransactionType,
  ) => {
    setTransactionType(nextTransactionType);
    setAmount("");
    setDescription("");
    setCategoryId("__none__");
    setSubcategoryId("__none__");
    setAccountId(nextAccountId);
    setAccountDestinationId("");
    setExpenseDate(nextExpenseDate);
    setNote("");
    setInstallmentsInput("");
    setToAmountInput("");
    setAffectsBalance(true);
    clearSelectedReceipt();
  }, [clearSelectedReceipt]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        clearSelectedReceipt();
      }
      onOpenChange(nextOpen);
    },
    [clearSelectedReceipt, onOpenChange],
  );

  const handleSave = useCallback((mode: SubmitMode) => {
    const trimmedDescription = description.trim();
    const nextExpenseDate = expenseDate || getCurrentLocalDateISO();
    const nextTransactionType = transactionType;
    const nextAccountId = selectedAccountId;
    const receiptFileToUpload = selectedReceiptFile;

    if (!selectedAccountId || parsedAmount == null || parsedAmount <= 0) {
      return;
    }

    if (isTransfer && !accountDestinationId) {
      return;
    }

    if (hasInvalidToAmount) {
      return;
    }

    const commonData: CreateTransactionPayload = {
      amount: parsedAmount,
      description: trimmedDescription,
      account_id: selectedAccountId,
      expense_date: nextExpenseDate,
      currency: resolvedCurrency,
      type: transactionType,
      note: note.trim() ? note.trim() : null,
      affects_balance: affectsBalance,
    };

    const transferData: CreateTransactionPayload = {
      ...commonData,
      category_id: null,
      subcategory_id: null,
      installments: null,
      account_destination_id: accountDestinationId || null,
      to_amount: toAmountInput.trim() ? parsedToAmount : null,
    };

    const defaultData: CreateTransactionPayload = {
      ...commonData,
      category_id: safeCategoryValue === "__none__" ? null : safeCategoryValue,
      subcategory_id: safeSubcategoryValue === "__none__" ? null : safeSubcategoryValue,
      installments: isExpense ? installments : null,
      account_destination_id: null,
    };

    setSubmitMode(mode);

    createMutation.mutate(isTransfer ? transferData : defaultData, {
      onSuccess: (created) => {
        toast.success("Registro creado correctamente");

        if (receiptFileToUpload) {
          void uploadReceiptInBackground(created.id, receiptFileToUpload);
        }
        if (mode === "continue") {
          resetFormForNextEntry(nextAccountId, nextExpenseDate, nextTransactionType);
        } else {
          handleOpenChange(false);
        }

        setSubmitMode("close");
      },
      onError: (error) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "No se pudo crear la transacción";
        toast.error(message);
        setSubmitMode("close");
      },
    });
  }, [
    accountDestinationId,
    affectsBalance,
    createMutation,
    description,
    expenseDate,
    hasInvalidToAmount,
    installments,
    isExpense,
    isTransfer,
    note,
    parsedAmount,
    parsedToAmount,
    resolvedCurrency,
    resetFormForNextEntry,
    selectedReceiptFile,
    safeCategoryValue,
    safeSubcategoryValue,
    selectedAccountId,
    handleOpenChange,
    toAmountInput,
    transactionType,
    uploadReceiptInBackground,
  ]);

  const disableSave =
    createMutation.isPending ||
    !selectedAccountId ||
    hasInvalidAmount ||
    (isTransfer && !accountDestinationId) ||
    (isTransfer && selectedAccountId === accountDestinationId) ||
    hasInvalidToAmount ||
    hasInvalidInstallments;


  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        disableSave ||
        event.repeat ||
        event.altKey ||
        event.metaKey ||
        event.isComposing
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

      if (event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        handleSave("close");
        return;
      }

      if (event.shiftKey && !event.ctrlKey) {
        event.preventDefault();
        handleSave("continue");
      }
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
          <DialogTitle>Nuevo registro</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
        >
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
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={formatArAmountInput(amount)}
                onChange={(e) => setAmount(normalizeArAmountInput(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-14 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="0,00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {resolvedCurrency}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {isTransfer ? "Cuenta de origen" : "Cuenta"}
            </label>
            <Select value={selectedAccountId || undefined} onValueChange={handleOriginAccountChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cuenta">
                  {selectedSourceAccount?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTransfer && (
            <div>
              <label className="text-sm font-medium mb-1 block">Cuenta destino</label>
              <Select
                key={selectedAccountId}
                value={accountDestinationId || NO_DESTINATION_VALUE}
                onValueChange={(v) =>
                  setAccountDestinationId(v === NO_DESTINATION_VALUE ? "" : (v ?? ""))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cuenta destino">
                    {selectedDestinationAccount?.name ?? "Seleccionar cuenta destino"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DESTINATION_VALUE}>Seleccionar cuenta destino</SelectItem>
                  {accounts
                    .filter((account) => account.id !== selectedAccountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedAccountId && accountDestinationId && selectedAccountId === accountDestinationId && (
                <p className="mt-1 text-xs text-destructive">
                  La cuenta destino debe ser distinta de la cuenta de origen.
                </p>
              )}
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="text-sm font-medium mb-1 block">Monto destino (opcional)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatArAmountInput(toAmountInput)}
                  onChange={(e) => setToAmountInput(normalizeArAmountInput(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-14 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="0,00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {resolvedDestinationCurrency}
                </span>
              </div>
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
                    {categoriesForType.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
            <p className="text-sm font-medium">Comprobante (opcional)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleReceiptFileChange}
            />
            {selectedReceiptFile ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <div className="min-w-0 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium truncate">{selectedReceiptFile.name}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedReceipt}
                  aria-label="Quitar comprobante seleccionado"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={openReceiptPicker}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Adjuntar comprobante (opcional)
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSave("continue")}
              disabled={disableSave}
            >
              {createMutation.isPending && submitMode === "continue" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar y crear otro
            </Button>
            <Button type="button" className="w-full" onClick={() => handleSave("close")} disabled={disableSave}>
              {createMutation.isPending && submitMode === "close" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar registro
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
