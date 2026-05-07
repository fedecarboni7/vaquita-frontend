import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/api";
import type { Category, Subcategory } from "@/types/transaction";

export function useSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const categories = await apiFetch<Category[]>("/categories");
      const category = categories.find((item) => item.id === categoryId);
      return category?.subcategories ?? [];
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      name,
    }: {
      categoryId: string;
      name: string;
    }) =>
      apiFetch<Subcategory>(`/categories/${categoryId}/subcategories`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.categoryId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudo crear la subcategoria";
      toast.error(message);
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      subcategoryId,
    }: {
      categoryId: string;
      subcategoryId: string;
    }) =>
      apiFetch<void>(`/categories/${categoryId}/subcategories/${subcategoryId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      subcategoryId,
      name,
    }: {
      categoryId: string;
      subcategoryId: string;
      name: string;
    }) =>
      apiFetch<Subcategory>(`/categories/${categoryId}/subcategories/${subcategoryId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.categoryId] });
    },
  });
}
