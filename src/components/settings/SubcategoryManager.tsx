import { useMemo, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  useCreateSubcategory,
  useDeleteSubcategory,
  useSubcategories,
  useUpdateSubcategory,
} from "@/hooks/useSubcategories";
import type { Category, Subcategory } from "@/types/transaction";

interface Props {
  categories: Category[];
  loadingCategories: boolean;
}

export default function SubcategoryManager({ categories, loadingCategories }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subcategory | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingSubcategoryValue, setEditingSubcategoryValue] = useState("");
  const [savingSubcategoryId, setSavingSubcategoryId] = useState<string | null>(null);
  const ignoreSubcategoryBlurRef = useRef(false);

  const createSubcategory = useCreateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();
  const updateSubcategory = useUpdateSubcategory();

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

  const normalizeSubcategoryName = (value: string) => value.trim();

  const startSubcategoryEdit = (subcategory: Subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingSubcategoryValue(subcategory.name);
  };

  const cancelSubcategoryEdit = () => {
    setEditingSubcategoryId(null);
    setEditingSubcategoryValue("");
  };

  const commitSubcategoryEdit = async (subcategory: Subcategory) => {
    if (savingSubcategoryId === subcategory.id) return;

    const trimmed = normalizeSubcategoryName(editingSubcategoryValue);
    if (!trimmed) {
      cancelSubcategoryEdit();
      return;
    }

    const currentNormalized = normalizeSubcategoryName(subcategory.name);
    if (trimmed === currentNormalized) {
      cancelSubcategoryEdit();
      return;
    }

    setSavingSubcategoryId(subcategory.id);
    try {
      await updateSubcategory.mutateAsync({
        categoryId: subcategory.category_id,
        subcategoryId: subcategory.id,
        name: trimmed,
      });
      cancelSubcategoryEdit();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la subcategoria";
      toast.error(message);
    } finally {
      setSavingSubcategoryId(null);
    }
  };

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
              subcategories.map((subcategory) => {
                const isEditing = editingSubcategoryId === subcategory.id;
                const isSaving = savingSubcategoryId === subcategory.id;

                return (
                  <div
                    key={subcategory.id}
                    className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border text-xs"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingSubcategoryValue}
                        onChange={(event) => setEditingSubcategoryValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            ignoreSubcategoryBlurRef.current = true;
                            void commitSubcategoryEdit(subcategory);
                          }

                          if (event.key === "Escape") {
                            event.preventDefault();
                            ignoreSubcategoryBlurRef.current = true;
                            cancelSubcategoryEdit();
                          }
                        }}
                        onBlur={() => {
                          if (ignoreSubcategoryBlurRef.current) {
                            ignoreSubcategoryBlurRef.current = false;
                            return;
                          }
                          void commitSubcategoryEdit(subcategory);
                        }}
                        disabled={isSaving}
                        autoFocus
                        className="bg-transparent text-xs outline-none min-w-[120px]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startSubcategoryEdit(subcategory)}
                        className="text-left transition-colors hover:text-foreground"
                      >
                        {subcategory.name}
                      </button>
                    )}
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(subcategory)}
                      disabled={isEditing || isSaving}
                      className="text-muted-foreground hover:text-destructive transition-opacity sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-30"
                      aria-label={`Eliminar subcategoría ${subcategory.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar subcategoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la subcategoría "{deleteTarget?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget);
                }
              }}
              disabled={deleteSubcategory.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteSubcategory.isPending && (
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
