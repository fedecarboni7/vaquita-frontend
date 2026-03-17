import { useState } from "react";
import { X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { useTheme } from "@/hooks/useTheme";
import type { Category } from "@/types/transaction";

const CATEGORY_COLORS: Record<string, string> = {
  Comida: "#c06a2b",
  Transporte: "#2563a8",
  Servicios: "#6d28d9",
  Salud: "#b91c1c",
  Ocio: "#9333ea",
  Hogar: "#c2620e",
};

function getCategoryColor(name: string, type: string): string {
  if (type === "income") return "var(--accent, #2d6a4f)";
  return CATEGORY_COLORS[name] || "#8a8a84";
}

export default function SettingsPage() {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const { isDark, toggleTheme } = useTheme();

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    createCategory.mutate(
      { name: trimmed, type: newCatType },
      { onSuccess: () => { setNewCatName(""); setNewCatType("expense"); } }
    );
  };

  const handleDeleteCategory = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="font-serif text-2xl font-medium tracking-tight">
          Configuración
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">
          Preferencias y datos
        </div>
      </div>

      {/* Categorías */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Categorías
        </div>

        {categoriesLoading ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-[12.5px] transition-colors hover:border-muted-foreground/40"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: getCategoryColor(cat.name, cat.type) }}
                />
                {cat.name}
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="text-muted-foreground/40 hover:text-destructive text-sm leading-none ml-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="flex items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nueva categoría..."
            className="max-w-[200px] px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none transition-colors focus:border-muted-foreground"
          />
          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as "expense" | "income")}
            className="px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!newCatName.trim() || createCategory.isPending}
          >
            {createCategory.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "+ Agregar"
            )}
          </Button>
        </form>
      </section>

      {/* Apariencia */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Apariencia
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13.5px]">Modo oscuro</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Cambia el tema de la interfaz
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                isDark ? "bg-green-500" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Moneda y región */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Moneda y región
        </div>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13.5px]">Moneda principal</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Para mostrar importes
              </div>
            </div>
            <select className="px-3 py-1.5 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer">
              <option>ARS — Peso argentino</option>
              <option>USD — Dólar</option>
              <option>EUR — Euro</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13.5px]">Formato de fecha</div>
            </div>
            <select className="px-3 py-1.5 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer">
              <option>DD/MM/AAAA</option>
              <option>MM/DD/AAAA</option>
            </select>
          </div>
        </div>
      </section>

      {/* Datos */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Datos
        </div>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13.5px]">Importar registros</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Desde archivo CSV
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Importar
            </Button>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13.5px] text-destructive">
                Eliminar todos los datos
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Esta acción no se puede deshacer
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {/* Delete category confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la categoría "{deleteTarget?.name}". Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteCategory.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
