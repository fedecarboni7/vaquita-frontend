import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/api";
import type { ImportConfirmRequest, ImportConfirmResponse, ImportPreviewResponse } from "@/types/import";

export async function importPreview(file: File): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<ImportPreviewResponse>("/import/preview", {
    method: "POST",
    body: formData,
  });
}

export function useImportConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportConfirmRequest) =>
      apiFetch<ImportConfirmResponse>("/import/confirm", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
