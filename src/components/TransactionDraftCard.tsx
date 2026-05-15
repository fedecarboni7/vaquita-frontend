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
import type { Category, TransactionType } from "@/types/transaction";

interface Props {
  data: Record<string, unknown>;
  threadId?: string | null;
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

const READ_ONLY_FIELDS = new Set(["installment_amount"]);
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

function formatDisplayDate(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const parts = value.split("-");
  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export default function TransactionDraftCard({ data, threadId }: Props) {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const [isEditing, setIsEditing] = useState(false);
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
        chat_thread_id: threadId ?? null,
      };

      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar. Intentá de nuevo.");
    }
  };

const handleFieldChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeAmountInput(value);

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

  const renderRow = (label: string, content: ReactNode) => {
    return (
      <div className="flex flex-row items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">{label}:</span>
        {content}
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
        ✓ Transacción guardada
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
    <div className="border border-border rounded-xl p-4 bg-card min-w-0 shadow-sm">
      <div className="space-y-2 mb-3">
        {renderRow(
          FIELD_LABELS.expense_date,
          isEditing ? (
            <input
              type="date"
              value={String(editData.expense_date ?? "")}
              onChange={(event) => handleFieldChange("expense_date", event.target.value)}
              className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {formatDisplayDate(editData.expense_date) || "-"}
            </span>
          ),
        )}

        {renderRow(
          FIELD_LABELS.type,
          isEditing ? (
            <select
              value={selectedType}
              onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
              className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">{TYPE_LABELS[selectedType]}</span>
          ),
        )}

        {renderRow(
          FIELD_LABELS.amount,
          isEditing ? (
            <input
              type="text"
              inputMode="decimal"
              value={displayAmount}
              onChange={(event) => {
                const sanitized = sanitizeAmountInput(event.target.value);
                handleFieldChange("amount", sanitized);
                setDisplayAmount(sanitized);
              }}
              onBlur={() => {
                const rawValue = String(editData.amount ?? "");
                setDisplayAmount(formatAmountForDisplay(rawValue));
              }}
              onFocus={() => setDisplayAmount(String(editData.amount ?? ""))}
              className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="0,00"
            />
          ) : (
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {buildFormattedAmount(editData.amount, selectedAccountCurrency)}
            </span>
          ),
        )}

        {isTransfer &&
          renderRow(
            FIELD_LABELS.to_amount,
            isEditing ? (
              <input
                type="text"
                inputMode="decimal"
                value={displayToAmount}
                onChange={(event) => {
                  const sanitized = sanitizeAmountInput(event.target.value);
                  handleFieldChange("to_amount", sanitized);
                  setDisplayToAmount(sanitized);
                }}
                onBlur={() => {
                  const rawValue = editData.to_amount == null ? "" : String(editData.to_amount);
                  setDisplayToAmount(formatAmountForDisplay(rawValue));
                }}
                onFocus={() => setDisplayToAmount(editData.to_amount == null ? "" : String(editData.to_amount))}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="0,00"
              />
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
                {hasToAmount
                  ? buildFormattedAmount(parsedToAmount, selectedDestinationCurrency)
                  : "Misma moneda"}
              </span>
            ),
          )}

        {isTransfer && hasToAmount && !isEditing &&
          renderRow(
            "Conversión",
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {buildFormattedAmount(editData.amount, selectedAccountCurrency)}
              <span className="mx-1.5">→</span>
              {buildFormattedAmount(parsedToAmount, selectedDestinationCurrency)}
            </span>,
          )}

        {renderRow(
          FIELD_LABELS.account,
          isEditing ? (
            <select
              value={selectedAccount}
              onChange={(event) => handleFieldChange("account", event.target.value)}
              className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccionar cuenta</option>
              {accountNotFound && <option value={selectedAccount}>{selectedAccount}</option>}
              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">{selectedAccount || "Sin cuenta"}</span>
          ),
        )}

        {isTransfer &&
          renderRow(
            FIELD_LABELS.account_destination,
            isEditing ? (
              <select
                value={selectedDestinationAccount}
                onChange={(event) => handleFieldChange("account_destination", event.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
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
              </select>
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
                {selectedDestinationAccount || "Sin cuenta destino"}
              </span>
            ),
          )}

        {renderRow(
          FIELD_LABELS.description,
          isEditing ? (
            <input
              type="text"
              value={String(editData.description ?? "")}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">{String(editData.description ?? "")}</span>
          ),
        )}

        {!isTransfer &&
          renderRow(
            FIELD_LABELS.category,
            isEditing ? (
              <select
                value={selectedCategoryName}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sin categoría</option>
                {categoriesForType.map((category: Category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
                {selectedCategoryName || "Sin categoría"}
              </span>
            ),
          )}

        {!isTransfer &&
          renderRow(
            FIELD_LABELS.subcategory_name,
            isEditing ? (
              <select
                value={selectedSubcategoryId}
                onChange={(event) => handleSubcategoryChange(event.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={!selectedCategoryName}
              >
                <option value="">Sin subcategoría</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
                {typeof editData.subcategory_name === "string"
                  ? editData.subcategory_name
                  : "Sin subcategoría"}
              </span>
            ),
          )}

        {isExpense &&
          renderRow(
            FIELD_LABELS.installments,
            isEditing ? (
              <input
                type="number"
                min="1"
                value={installmentsValue}
                onChange={(event) => handleFieldChange("installments", event.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
              />
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
                {installmentsValue || "Sin cuotas"}
              </span>
            ),
          )}

        {isExpense && editData.installment_amount != null &&
          renderRow(
            FIELD_LABELS.installment_amount,
            <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">
              {buildFormattedAmount(editData.installment_amount, selectedAccountCurrency)}
            </span>,
          )}

        {(isEditing || editData.note != null) &&
          renderRow(
            FIELD_LABELS.note,
            isEditing && !READ_ONLY_FIELDS.has("note") ? (
              <input
                type="text"
                value={String(editData.note ?? "")}
                onChange={(event) => handleFieldChange("note", event.target.value)}
                className="bg-background text-foreground border border-border rounded-lg px-2 py-1.5 text-sm w-full sm:w-44 sm:text-right focus:outline-none focus:ring-1 focus:ring-ring"
              />
            ) : (
              <span className="text-sm text-foreground text-right shrink-0 max-w-[55%] break-words">{String(editData.note ?? "")}</span>
            ),
          )}
      </div>

      {status === "error" && (
        <p className="text-destructive text-xs mb-3">{errorMessage || "Error al guardar. Intentá de nuevo."}</p>
      )}

      <div className="flex flex-nowrap gap-2">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {status === "saving" ? "Guardando..." : "Confirmar"}
        </button>
        <button
          onClick={() => {
            if (isEditing) {
              const parsedAmount = parseAmountForSubmission(String(editData.amount ?? ""));
              const formattedAmount = parsedAmount != null && Number.isFinite(parsedAmount)
                ? formatAmountForDisplay(String(editData.amount ?? ""))
                : formatAmountForDisplay(sanitizeAmountInput(String(data.amount ?? "")));
              setDisplayAmount(formattedAmount);

              if (isTransfer) {
                const parsedToAmount = parseAmountForSubmission(String(editData.to_amount ?? ""));
                const formattedToAmount = parsedToAmount != null && Number.isFinite(parsedToAmount)
                  ? formatAmountForDisplay(String(editData.to_amount ?? ""))
                  : formatAmountForDisplay(sanitizeAmountInput(String(data.to_amount ?? "")));
                setDisplayToAmount(formattedToAmount);
              }
            }
            setIsEditing(!isEditing);
          }}
          className="bg-secondary text-secondary-foreground text-sm px-4 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
        >
          {isEditing ? "Listo" : "Editar"}
        </button>
        <button
          onClick={() => setStatus("cancelled")}
          className="text-destructive text-sm px-4 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors font-medium border border-destructive/30"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
