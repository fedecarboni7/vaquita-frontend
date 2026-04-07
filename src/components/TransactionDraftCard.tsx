import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrencyAmount } from "@/lib/utils";
import type { Category, CurrencyCode, TransactionType } from "@/types/transaction";

interface Props {
  data: Record<string, unknown>;
  onCancel?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Monto",
  installment_amount: "Monto por cuota",
  description: "Descripción",
  type: "Tipo",
  account: "Cuenta",
  account_destination: "Cuenta destino",
  category: "Categoría",
  subcategory_name: "Subcategoría",
  expense_date: "Fecha",
  currency: "Moneda",
  installments: "Cuotas",
  note: "Nota",
};

const READ_ONLY_FIELDS = new Set(["installment_amount"]);
const CURRENCY_OPTIONS: CurrencyCode[] = ["ARS", "USD", "EUR"];
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

function normalizeCurrency(value: unknown): CurrencyCode {
  if (typeof value !== "string") {
    return "ARS";
  }

  const normalized = value.toUpperCase();
  if (normalized === "ARS" || normalized === "USD" || normalized === "EUR") {
    return normalized;
  }
  return "ARS";
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

function buildFormattedAmount(value: unknown, currency: CurrencyCode): string {
  const amount = typeof value === "number" ? value : Number(value);
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  return formatCurrencyAmount(normalizedAmount, currency);
}

function getCurrentLocalDateISO(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split("T")[0];
}

export default function TransactionDraftCard({ data, onCancel }: Props) {
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
    normalized.currency = normalizeCurrency(normalized.currency);

    return normalized;
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedType = normalizeTransactionType(editData.type);
  const selectedCurrency = normalizeCurrency(editData.currency);
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
  const destinationAccountOptions = accounts.filter((account) => account.name !== selectedAccount);

  const installmentsValue = editData.installments == null ? "" : String(editData.installments);
  const parsedInstallments = parsePositiveInteger(installmentsValue);

  const canConfirm =
    status !== "saving" &&
    !!selectedAccount &&
    (!isTransfer || !!selectedDestinationAccount) &&
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
        amount: typeof editData.amount === "number" ? editData.amount : Number(editData.amount) || 0,
        description: String(editData.description ?? ""),
        type: selectedType,
        expense_date:
          typeof editData.expense_date === "string" && editData.expense_date.trim()
            ? editData.expense_date
            : getCurrentLocalDateISO(),
        account: selectedAccount,
        account_destination: isTransfer ? selectedDestinationAccount || null : null,
        category_id: isTransfer ? null : selectedCategoryId,
        subcategory_id: isTransfer ? null : selectedSubcategory,
        currency: selectedCurrency,
        installments: isExpense ? parsedInstallments : null,
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
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Error al guardar. Intentá de nuevo.");
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]:
        field === "amount"
          ? parseFloat(value) || 0
          : field === "installments"
            ? parsePositiveInteger(value)
            : field === "currency"
              ? value.toUpperCase()
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
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-400">{label}:</span>
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
      <div className="border border-green-600 rounded-lg p-3 bg-green-900/30 text-green-300">
        ✓ Transacción guardada
      </div>
    );
  }

  return (
    <div className="border border-gray-600 rounded-lg p-3 bg-gray-800 min-w-0">
      <div className="space-y-2 mb-3">
        {renderRow(
          FIELD_LABELS.expense_date,
          isEditing ? (
            <input
              type="date"
              value={String(editData.expense_date ?? "")}
              onChange={(event) => handleFieldChange("expense_date", event.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
            />
          ) : (
            <span className="text-white break-words">{String(editData.expense_date ?? "")}</span>
          ),
        )}

        {renderRow(
          FIELD_LABELS.type,
          isEditing ? (
            <select
              value={selectedType}
              onChange={(event) => handleTypeChange(event.target.value as TransactionType)}
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-white break-words">{TYPE_LABELS[selectedType]}</span>
          ),
        )}

        {renderRow(
          FIELD_LABELS.amount,
          isEditing ? (
            <input
              type="number"
              step="0.01"
              value={String(editData.amount ?? "")}
              onChange={(event) => handleFieldChange("amount", event.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
            />
          ) : (
            <span className="text-white break-words">
              {buildFormattedAmount(editData.amount, selectedCurrency)}
            </span>
          ),
        )}

        {renderRow(
          FIELD_LABELS.account,
          isEditing ? (
            <select
              value={selectedAccount}
              onChange={(event) => handleFieldChange("account", event.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
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
            <span className="text-white break-words">{selectedAccount || "Sin cuenta"}</span>
          ),
        )}

        {isTransfer &&
          renderRow(
            FIELD_LABELS.account_destination,
            isEditing ? (
              <select
                value={selectedDestinationAccount}
                onChange={(event) => handleFieldChange("account_destination", event.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
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
              <span className="text-white break-words">
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
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
            />
          ) : (
            <span className="text-white break-words">{String(editData.description ?? "")}</span>
          ),
        )}

        {!isTransfer &&
          renderRow(
            FIELD_LABELS.category,
            isEditing ? (
              <select
                value={selectedCategoryName}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
              >
                <option value="">Sin categoría</option>
                {categoriesForType.map((category: Category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-white break-words">
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
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
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
              <span className="text-white break-words">
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
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
              />
            ) : (
              <span className="text-white break-words">
                {installmentsValue || "Sin cuotas"}
              </span>
            ),
          )}

        {isExpense && editData.installment_amount != null &&
          renderRow(
            FIELD_LABELS.installment_amount,
            <span className="text-white break-words">
              {buildFormattedAmount(editData.installment_amount, selectedCurrency)}
            </span>,
          )}

        {renderRow(
          FIELD_LABELS.currency,
          isEditing ? (
            <select
              value={selectedCurrency}
              onChange={(event) => handleFieldChange("currency", event.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-white break-words">{selectedCurrency}</span>
          ),
        )}

        {(isEditing || editData.note != null) &&
          renderRow(
            FIELD_LABELS.note,
            isEditing && !READ_ONLY_FIELDS.has("note") ? (
              <input
                type="text"
                value={String(editData.note ?? "")}
                onChange={(event) => handleFieldChange("note", event.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
              />
            ) : (
              <span className="text-white break-words">{String(editData.note ?? "")}</span>
            ),
          )}
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm mb-2">{errorMessage || "Error al guardar. Intentá de nuevo."}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
        >
          {status === "saving" ? "Guardando..." : "Confirmar"}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-gray-600 hover:bg-gray-500 text-white text-sm px-3 py-1 rounded"
        >
          {isEditing ? "Listo" : "Editar"}
        </button>
        <button
          onClick={onCancel}
          className="bg-red-700 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
