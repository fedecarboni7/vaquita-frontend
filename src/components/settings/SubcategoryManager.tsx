import { useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateSubcategory, useDeleteSubcategory, useSubcategories } from "@/hooks/useSubcategories";
import type { Category, Subcategory } from "@/types/transaction";

interface Props {
  categories: Category[];
  loadingCategories: boolean;
}

export default function SubcategoryManager({ categories, loadingCategories }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subcategory | null>(null);

  const createSubcategory = useCreateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  const sortedCategories = useMemo(() => {
    const typeOrder: Record<Category["type"], number> = {
      expense: 0,
      income: 1,
      transfer: 2,
    };

    return [...categories].sort((a, b) => {
      const typeDelta = typeOrder[a.type] - typeOrder[b.type];
      if (typeDelta !== 0) {
        return typeDelta;
      }
      return a.name.localeCompare(b.name, "es");
    });
  }, [categories]);

  const effectiveCategoryId = useMemo(() => {
    if (selectedCategoryId && sortedCategories.some((category) => category.id === selectedCategoryId)) {
      return selectedCategoryId;
    }
    return sortedCategories[0]?.id ?? "";
  }, [selectedCategoryId, sortedCategories]);

  const { data: subcategories = [], isLoading: loadingSubcategories } = useSubcategories(
    effectiveCategoryId || null,
  );

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveCategoryId || !newSubcategoryName.trim()) return;

    createSubcategory.mutate(
      {
        categoryId: effectiveCategoryId,
        name: newSubcategoryName.trim(),
      },
      {
        onSuccess: () => setNewSubcategoryName(""),
      },
    );
  };

  const handleDelete = (subcategory: Subcategory) => {
    if (!effectiveCategoryId) return;
    deleteSubcategory.mutate({
      categoryId: effectiveCategoryId,
      subcategoryId: subcategory.id,
    });
    setDeleteTarget(null);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Categoría padre</label>
        <select
          value={effectiveCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
          disabled={loadingCategories || sortedCategories.length === 0}
        >
          {sortedCategories.length === 0 ? (
            <option value="">No hay categorías</option>
          ) : (
            sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type === "income" ? "Ingreso" : "Gasto"})
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        {loadingSubcategories ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subcategories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Esta categoría todavía no tiene subcategorías.
              </p>
            ) : (
              subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border text-xs"
                >
                  <span>{subcategory.name}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(subcategory)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Eliminar subcategoría ${subcategory.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          type="text"
          value={newSubcategoryName}
          onChange={(event) => setNewSubcategoryName(event.target.value)}
          placeholder="Nueva subcategoría..."
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none"
          disabled={!effectiveCategoryId}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={
            !effectiveCategoryId
            || !newSubcategoryName.trim()
            || createSubcategory.isPending
          }
        >
          {createSubcategory.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "+ Agregar"}
        </Button>
      </form>

      {deleteTarget && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between gap-3">
          <p className="text-xs">
            Eliminar subcategoría "{deleteTarget.name}".
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(deleteTarget)}
              disabled={deleteSubcategory.isPending}
            >
              {deleteSubcategory.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Eliminar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
