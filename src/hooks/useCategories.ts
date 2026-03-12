import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { Category } from "../types/transaction";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories"),
  });
}
