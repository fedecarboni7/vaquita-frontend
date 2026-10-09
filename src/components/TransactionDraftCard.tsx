import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import {
  formatAmountForDisplay,
  parseAmountForSubmission,
  sanitizeAmountInput,
} from "@/lib/amountInput";
import { formatCurrencyAmount } from "@/lib/utils";
import AmountInput from "@/components/ui/AmountInput";
import { getCategoryEmoji } from "@/lib/categoryDisplay";
import type { Category, TransactionType } from "@/types/transaction";
import {
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  Grid2X2,
  History,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";

interface Props {
  data: Record<string, unknown>;
  onDraftSettled?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Monto",
  to_amount: "Monto destino",
  installment_amount: "Monto por cuota",
  description: "Descripción",
  type: "Tipo",
  account: "Cuenta",
  account_destination: "Cuenta destino",
  category: "Categoría",
  subcategory_name: "Subcategoría",
  expense_date: "Fecha",
  installments: "Cuotas",
  note: "Nota",
};

const FIELD_ICONS: Record<string, LucideIcon> = {
  amount: DollarSign,
  to_amount: DollarSign,
  installment_amount: DollarSign,
  description: FileText,
  type: Tag,
  account: CreditCard,
  account_destination: CreditCard,
  category: Grid2X2,
  subcategory_name: Tag,
  expense_date: Calendar,
  installments: History,
  note: FileText,
};

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
];
const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Gasto",
  income: "Ingreso",
  transfer: "Transferencia",
};

function normalizeTransactionType(value: unknown): TransactionType {
  if (value === "expense" || value === "income" || value === "transfer") {
    return value;
  }
  return "expense";
}

function parsePositiveInteger(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}



function buildFormattedAmount(value: unknown, currency: string): string {
  let amount: number;
  if (typeof value === "number") {
    amount = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    amount = parseAmountForSubmission(value) ?? 0;
  } else {
    amount = 0;
  }
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  return formatCurrencyAmount(normalizedAmount, currency);
}

function getCurrentLocalDateISO(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split("T")[0];
}

function buildSavedSummary(data: Record<string, unknown>, currency: string): string {
  const type = normalizeTransactionType(data.type);
  const typeLabel = TYPE_LABELS[type];
  const amount = buildFormattedAmount(data.amount, currency);
  const description =
    typeof data.description === "string" && data.description.trim()
      ? data.description.trim()
      : "Sin descripción";
  const account = typeof data.account === "string" ? data.account : "Cuenta sin nombre";

  if (type === "transfer") {
    const destination =
      typeof data.account_destination === "string"
        ? data.account_destination
        : "Cuenta destino sin nombre";
    return `✓ ${typeLabel} registrada: ${amount} — ${account} → ${destination}`;
  }

  return `✓ ${typeLabel} registrado: ${amount} — ${description} · ${account}`;
}

export default function TransactionDraftCard({ data, onDraftSettled }: Props) {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const [editData, setEditData] = useState<Record<string, unknown>>(() => {
    const normalized = { ...data };

    if (typeof normalized.subcategory === "string" && !normalized.subcategory_name) {
      normalized.subcategory_name = normalized.subcategory;
    }

    if (typeof normalized.category_name === "string" && !normalized.category) {
      normalized.category = normalized.category_name;
    }

    if (typeof normalized.expense_date !== "string" || !normalized.expense_date.trim()) {
      normalized.expense_date = getCurrentLocalDateISO();
    }

    normalized.type = normalizeTransactionType(normalized.type);

    return normalized;
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "cancelled">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [displayAmount, setDisplayAmount] = useState(() =>
    formatAmountForDisplay(sanitizeAmountInput(String(data.amount ?? ""))),
  );
  const [displayToAmount, setDisplayToAmount] = useState(() =>
    data.to_amount != null
      ? formatAmountForDisplay(sanitizeAmountInput(String(data.to_amount)))
      : "",
  );

  const selectedType = normalizeTransactionType(editData.type);
  const isTransfer = selectedType === "transfer";
  const isExpense = selectedType === "expense";

  const categoriesForType =
    isTransfer ? [] : categories.filter((category) => category.type === selectedType);

  const selectedCategoryName = typeof editData.category === "string" ? editData.category : "";
  const selectedSubcategoryId = typeof editData.subcategory_id === "string" ? editData.subcategory_id : "";
  const selectedCategory = categoriesForType.find((category) => category.name === selectedCategoryName);
  const availableSubcategories = selectedCategory?.subcategories ?? [];

  const selectedAccount = typeof editData.account === "string" ? editData.account : "";
  const selectedDestinationAccount =
    typeof editData.account_destination === "string" ? editData.account_destination : "";
  const selectedAccountRecord = accounts.find((account) => account.name === selectedAccount);
  const selectedDestinationAccountRecord = accounts.find(
    (account) => account.name === selectedDestinationAccount,
  );
  const selectedAccountCurrency = selectedAccountRecord?.currency ?? "ARS";
  const selectedDestinationCurrency = selectedDestinationAccountRecord?.currency ?? selectedAccountCurrency;
  const destinationAccountOptions = accounts.filter((account) => account.name !== selectedAccount);

  const installmentsValue = editData.installments == null ? "" : String(editData.installments);
  const parsedInstallments = parsePositiveInteger(installmentsValue);
  const parsedAmount = parseAmountForSubmission(String(editData.amount ?? ""));
  const hasInvalidAmount = parsedAmount == null || !Number.isFinite(parsedAmount) || parsedAmount <= 0;
  const parsedToAmount = parseAmountForSubmission(String(editData.to_amount ?? ""));
  const hasToAmount = editData.to_amount != null && String(editData.to_amount).trim() !== "";
  const hasInvalidToAmount =
    hasToAmount && (parsedToAmount == null || !Number.isFinite(parsedToAmount) || parsedToAmount <= 0);

  const canConfirm =
    status !== "saving" &&
    !hasInvalidAmount &&
    !!selectedAccountRecord &&
    (!isTransfer || !!selectedDestinationAccountRecord) &&
    (!isTransfer || !hasInvalidToAmount) &&
    (!isExpense || installmentsValue === "" || parsedInstallments !== null);

  const handleConfirm = async () => {
    if (!selectedAccount) {
      setStatus("error");
      setErrorMessage("Seleccioná una cuenta para guardar la transacción.");
      return;
    }

    if (isTransfer && !selectedDestinationAccount) {
      setStatus("error");
      setErrorMessage("Seleccioná una cuenta destino para registrar la transferencia.");
      return;
    }

    if (isExpense && installmentsValue !== "" && parsedInstallments === null) {
      setStatus("error");
      setErrorMessage("La cantidad de cuotas debe ser un número mayor a 0.");
      return;
    }

    if (hasInvalidAmount) {
      setStatus("error");
      setErrorMessage("El monto debe ser un número mayor a 0.");
      return;
    }

    if (!selectedAccountRecord) {
      setStatus("error");
      setErrorMessage("La cuenta seleccionada no existe. Elegí una cuenta válida.");
      return;
    }

    if (isTransfer && !selectedDestinationAccountRecord) {
      setStatus("error");
      setErrorMessage("La cuenta destino seleccionada no existe. Elegí una cuenta válida.");
      return;
    }

    if (isTransfer && hasInvalidToAmount) {
      setStatus("error");
      setErrorMessage("El monto destino debe ser un número mayor a 0.");
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const selectedCategoryId =
        typeof editData.category_id === "string"
          ? editData.category_id
          : selectedCategory?.id ?? null;
      const selectedSubcategory =
        typeof editData.subcategory_id === "string" ? editData.subcategory_id : null;

      const payload = {
        amount: parsedAmount ?? 0,
        description: String(editData.description ?? ""),
        type: selectedType,
        expense_date:
          typeof editData.expense_date === "string" && editData.expense_date.trim()
            ? editData.expense_date
            : getCurrentLocalDateISO(),
        account_id: selectedAccountRecord.id,
        account_destination_id: isTransfer ? selectedDestinationAccountRecord?.id || null : null,
        category_id: isTransfer ? null : selectedCategoryId,
        subcategory_id: isTransfer ? null : selectedSubcategory,
        currency: selectedAccountCurrency,
        installments: isExpense ? parsedInstallments : null,
        to_amount: isTransfer && hasToAmount ? parsedToAmount : null,
        note:
          typeof editData.note === "string" && editData.note.trim()
            ? editData.note.trim()
            : null,
      };

      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setStatus("saved");
      onDraftSettled?.();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar. Intentá de nuevo.");
    }
  };

const handleFieldChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeAmountInput(value);

    setChangedFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });

    setEditData((prev) => ({
      ...prev,
      [field]:
        field === "amount"
          ? sanitizedValue
          : field === "to_amount"
            ? (value.trim() === "" ? null : sanitizedValue)
            : field === "installments"
              ? parsePositiveInteger(value)
              : value,
    }));
  };

  const isInferred = (field: string) =>
    !changedFields.has(field) &&
    Array.isArray(data.inferred_fields) &&
    data.inferred_fields.includes(field);

  const handleTypeChange = (value: TransactionType) => {
    setEditData((prev) => {
      const next: Record<string, unknown> = {
        ...prev,
        type: value,
        category: null,
        category_id: null,
        subcategory_id: null,
        subcategory_name: null,
      };

      if (value !== "expense") {
        next.installments = null;
        next.installment_amount = null;
      }

      if (value !== "transfer") {
        next.account_destination = null;
        next.to_amount = null;
      }

      return next;
    });
  };

  const handleCategoryChange = (value: string) => {
    const selected = categoriesForType.find((category) => category.name === value);

    setEditData((prev) => ({
      ...prev,
      category: value || null,
      category_id: selected?.id ?? null,
      subcategory_id: null,
      subcategory_name: null,
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    if (!value) {
      setEditData((prev) => ({
        ...prev,
        subcategory_id: null,
        subcategory_name: null,
      }));
      return;
    }

    const selected = availableSubcategories.find((subcategory) => subcategory.id === value);
    setEditData((prev) => ({
      ...prev,
      subcategory_id: selected?.id ?? null,
      subcategory_name: selected?.name ?? null,
    }));
  };

  const renderRow = (field: string, content: ReactNode) => {
    const Icon = FIELD_ICONS[field];
    return (
      <div className="flex flex-row items-center gap-3 border-b border-border/50 py-1.5 last:border-0">
        <div className="flex w-[34%] min-w-0 shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-foreground/80" strokeWidth={1.8} />}
          <span className="truncate">{FIELD_LABELS[field] ?? field}</span>
        </div>
        <div className="min-w-0 flex-1">{content}</div>
      </div>
    );
  };

  const accountNotFound =
    selectedAccount && !accounts.some((account) => account.name === selectedAccount);
  const destinationNotFound =
    selectedDestinationAccount &&
    !destinationAccountOptions.some((account) => account.name === selectedDestinationAccount);

  if (status === "saved") {
    return (
      <div className="border border-border rounded-xl p-4 bg-card text-sm flex items-center gap-2 text-muted-foreground">
        {buildSavedSummary(editData, selectedAccountCurrency)}
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="border border-border rounded-xl p-4 bg-card text-sm text-muted-foreground">
        ✗ Registro cancelado
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-3 bg-card min-w-0 shadow-sm">
      <div className="space-y-1 mb-2">
        {renderRow(
          "expense_date",
          <input
            type="date"
            value={String(editData.expense_date ?? "")}
            onChange={(event) => handleFieldChange("expense_date", event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />,
        )}

        {renderRow(
          "type",
          <select
            value={selectedType}
            onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>,
        )}

        {renderRow(
          "amount",
          <AmountInput
            value={displayAmount}
            onChange={(event) => {
              const rawValue = event.target.value.replace(/\./g, "");
              const sanitized = sanitizeAmountInput(rawValue);
              handleFieldChange("amount", sanitized);
              setDisplayAmount(formatAmountForDisplay(sanitized));
            }}
            onValueChange={(rawValue) => {
              const sanitized = sanitizeAmountInput(rawValue.replace(/\./g, ","));
              handleFieldChange("amount", sanitized);
              setDisplayAmount(formatAmountForDisplay(sanitized));
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="0,00"
            suffix={selectedAccountCurrency}
          />,
        )}

        {isExpense &&
          renderRow(
            "installments",
            <input
              type="number"
              min="1"
              value={installmentsValue}
              onChange={(event) => handleFieldChange("installments", event.target.value)}
              placeholder="Sin cuotas"
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />,
          )}

        {isExpense && editData.installment_amount != null &&
          renderRow(
            "installment_amount",
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {buildFormattedAmount(editData.installment_amount, selectedAccountCurrency)}
            </span>,
          )}

        {renderRow(
          "account",
          <div className="flex flex-col items-end gap-1">
            <select
              value={selectedAccount}
              onChange={(event) => handleFieldChange("account", event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccionar cuenta</option>
              {accountNotFound && <option value={selectedAccount}>{selectedAccount}</option>}
              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
            {isInferred("account") && (
              <span className="text-[11px] text-muted-foreground">Cuenta sugerida, revisá que sea la correcta</span>
            )}
          </div>,
        )}

        {isTransfer &&
          renderRow(
            "account_destination",
            <select
              value={selectedDestinationAccount}
              onChange={(event) => handleFieldChange("account_destination", event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccionar cuenta destino</option>
              {destinationNotFound && (
                <option value={selectedDestinationAccount}>{selectedDestinationAccount}</option>
              )}
              {destinationAccountOptions.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>,
          )}

        {isTransfer &&
          renderRow(
            "to_amount",
            <AmountInput
              value={displayToAmount}
              onChange={(event) => {
                const rawValue = event.target.value.replace(/\./g, "");
                const sanitized = sanitizeAmountInput(rawValue);
                handleFieldChange("to_amount", sanitized);
                setDisplayToAmount(formatAmountForDisplay(sanitized));
              }}
              onValueChange={(rawValue) => {
                const sanitized = sanitizeAmountInput(rawValue.replace(/\./g, ","));
                handleFieldChange("to_amount", sanitized);
                setDisplayToAmount(formatAmountForDisplay(sanitized));
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Misma moneda"
            />,
          )}

        {isTransfer && hasToAmount &&
          renderRow(
            "Conversión",
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {buildFormattedAmount(editData.amount, selectedAccountCurrency)}
              <span className="mx-1.5">→</span>
              {buildFormattedAmount(parsedToAmount, selectedDestinationCurrency)}
            </span>,
          )}

        {renderRow(
          "description",
          <input
            type="text"
            value={String(editData.description ?? "")}
            onChange={(event) => handleFieldChange("description", event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />,
        )}

        {!isTransfer &&
          renderRow(
            "category",
            <select
              value={selectedCategoryName}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Sin categoría</option>
              {categoriesForType.map((category: Category) => (
                <option key={category.id} value={category.name}>
                  {[getCategoryEmoji(category), category.name].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>,
          )}

        {!isTransfer &&
          renderRow(
            "subcategory_name",
            <select
              value={selectedSubcategoryId}
              onChange={(event) => handleSubcategoryChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={!selectedCategoryName}
            >
              <option value="">Sin subcategoría</option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>,
          )}

        {renderRow(
          "note",
          <input
            type="text"
            value={String(editData.note ?? "")}
            onChange={(event) => handleFieldChange("note", event.target.value)}
            placeholder="Sin nota"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />,
        )}
      </div>

      {status === "error" && (
        <p className="text-destructive text-xs mb-2">{errorMessage || "Error al guardar. Intentá de nuevo."}</p>
      )}

      <div className="flex flex-row-reverse flex-nowrap justify-center gap-2 pt-1">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#07130b] transition-colors hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {status === "saving" ? "Guardando..." : "Confirmar"}
        </button>
        <button
          onClick={() => {
            setStatus("cancelled");
            onDraftSettled?.();
          }}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-[#1F2937] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#374151]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          Cancelar
        </button>
      </div>
    </div>
  );
}
