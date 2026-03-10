import { useState } from "react";
import { apiFetch } from "../api";

interface Props {
  data: Record<string, unknown>;
  onCancel?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Monto",
  description: "Descripción",
  type: "Tipo",
  account: "Cuenta",
  category: "Categoría",
  subcategory: "Subcategoría",
  expense_date: "Fecha",
  currency: "Moneda",
  note: "Nota",
};

export default function TransactionDraftCard({ data, onCancel }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({ ...data });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleConfirm = async () => {
    setStatus("saving");
    try {
      const payload = {
        ...editData,
        expense_date: editData.expense_date || new Date().toISOString().split("T")[0],
        account: editData.account || "efectivo",
      };

      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

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

  if (status === "saved") {
    return (
      <div className="border border-green-600 rounded-lg p-3 bg-green-900/30 text-green-300">
        ✓ Transacción guardada
      </div>
    );
  }

  const displayFields = Object.entries(editData).filter(
    ([key]) => key in FIELD_LABELS && editData[key] != null
  );

  return (
    <div className="border border-gray-600 rounded-lg p-3 bg-gray-800">
      <div className="space-y-2 mb-3">
        {displayFields.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-400">{FIELD_LABELS[key]}:</span>
            {isEditing ? (
              <input
                type={key === "amount" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-0.5 w-40 text-right"
              />
            ) : (
              <span className="text-white">{String(value)}</span>
            )}
          </div>
        ))}
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm mb-2">Error al guardar. Intentá de nuevo.</p>
      )}

      <div className="flex gap-2">
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
