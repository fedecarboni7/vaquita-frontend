import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { useCategories } from "@/hooks/useCategories";
import type { Category } from "@/types/transaction";

interface Props {
  data: Record<string, unknown>;
  onCancel?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Monto",
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

const EXCLUDED_FIELDS = new Set(["subcategory_id"]);

export default function TransactionDraftCard({ data, onCancel }: Props) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>(() => {
    const normalized = { ...data };
    if (typeof normalized.subcategory === "string" && !normalized.subcategory_name) {
      normalized.subcategory_name = normalized.subcategory;
    }
    return normalized;
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const selectedCategoryName = typeof editData.category === "string" ? editData.category : "";
  const selectedSubcategoryId = typeof editData.subcategory_id === "string" ? editData.subcategory_id : "";
  const selectedCategory = categories.find((category) => category.name === selectedCategoryName);
  const availableSubcategories = selectedCategory?.subcategories ?? [];

  const handleConfirm = async () => {
    setStatus("saving");
    try {
      const payload = {
        ...editData,
        expense_date: editData.expense_date || new Date().toISOString().split("T")[0],
        account: editData.account || "efectivo",
        subcategory_id: typeof editData.subcategory_id === "string" ? editData.subcategory_id : null,
      };

      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: field === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setEditData((prev) => ({
      ...prev,
      category: value || null,
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

  if (status === "saved") {
    return (
      <div className="border border-green-600 rounded-lg p-3 bg-green-900/30 text-green-300">
        ✓ Transacción guardada
      </div>
    );
  }

  const displayFields = Object.entries(editData).filter(
    ([key]) => key in FIELD_LABELS && !EXCLUDED_FIELDS.has(key) && editData[key] != null
  );
  const hasSubcategoryField = displayFields.some(([key]) => key === "subcategory_name");
  if (selectedCategoryName && !hasSubcategoryField) {
    displayFields.push(["subcategory_name", ""]);
  }

  return (
    <div className="border border-gray-600 rounded-lg p-3 bg-gray-800 min-w-0">
      <div className="space-y-2 mb-3">
        {displayFields.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-400">{FIELD_LABELS[key]}:</span>
            {isEditing && key === "category" ? (
              <select
                value={selectedCategoryName}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
              >
                <option value="">Sin categoría</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : isEditing && key === "subcategory_name" ? (
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
            ) : isEditing ? (
              <input
                type={key === "amount" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 w-full sm:w-40 sm:text-right"
              />
            ) : (
              <span className="text-white break-words">{String(value)}</span>
            )}
          </div>
        ))}
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm mb-2">Error al guardar. Intentá de nuevo.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleConfirm}
          disabled={status === "saving"}
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
