import { useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { importPreview, useImportConfirm } from "@/hooks/useImportMutations";
import type { ImportConfirmResponse, UniquePair } from "@/types/import";

type Step = "idle" | "upload" | "mapping" | "result";

interface PairMapping {
  categoryValue: string;
  subcategoryValue: string | null;
}

export default function ImportWizard() {
  const [step, setStep] = useState<Step>("idle");
  const [stagingToken, setStagingToken] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [uniquePairs, setUniquePairs] = useState<UniquePair[]>([]);
  const [mappingChoices, setMappingChoices] = useState<PairMapping[]>([]);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categories = [] } = useCategories();
  const confirmImport = useImportConfirm();

  const reset = () => {
    setStep("idle");
    setStagingToken(null);
    setTransactionCount(0);
    setUniquePairs([]);
    setMappingChoices([]);
    setResult(null);
    setError(null);
    setIsUploading(false);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setStep("upload");

    try {
      const data = await importPreview(file);
      setStagingToken(data.staging_token);
      setTransactionCount(data.transaction_count);
      setUniquePairs(data.unique_pairs);
      setMappingChoices(
        data.unique_pairs.map((pair) => ({
          categoryValue: "__new__",
          subcategoryValue: pair.subcategory_name ? "__new__" : null,
        })),
      );
      setStep("mapping");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar el archivo";
      const clean = message.replace(/^HTTP \d+: /, "");
      setError(clean);
      setStep("idle");
      toast.error(clean);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCategoryChange = (index: number, value: string) => {
    setMappingChoices((prev) => {
      const next = [...prev];
      next[index] = {
        categoryValue: value,
        subcategoryValue: uniquePairs[index].subcategory_name ? "__new__" : null,
      };
      return next;
    });
  };

  const handleSubcategoryChange = (index: number, value: string) => {
    setMappingChoices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], subcategoryValue: value };
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!stagingToken) return;

    const mapping = uniquePairs.map((pair, i) => ({
      category_name: pair.category_name,
      subcategory_name: pair.subcategory_name,
      existing_category_id:
        mappingChoices[i].categoryValue === "__new__"
          ? null
          : mappingChoices[i].categoryValue,
      existing_subcategory_id:
        mappingChoices[i].subcategoryValue === null ||
        mappingChoices[i].subcategoryValue === "__new__"
          ? null
          : mappingChoices[i].subcategoryValue,
    }));

    try {
      const res = await confirmImport.mutateAsync({
        staging_token: stagingToken,
        mapping,
      });
      setResult(res);
      setStep("result");
      toast.success("Importación completada");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const clean = message.replace(/^HTTP \d+: /, "");
      let displayError: string;
      if (
        message.toLowerCase().includes("staging") ||
        message.toLowerCase().includes("token")
      ) {
        displayError =
          "El tiempo de importación expiró. Volvé a subir el archivo.";
      } else {
        displayError = clean || "Error al confirmar la importación";
      }
      setError(displayError);
      setStep("result");
      toast.error(displayError);
    }
  };

  if (step === "idle") {
    return (
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Importación
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13.5px]">Importar transacciones</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Subí un archivo CSV exportado desde Vaquita para importar las
                transacciones.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Subiendo
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Importar CSV
                </>
              )}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </section>
    );
  }

  if (step === "upload") {
    return (
      <section className="mb-8">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Procesando archivo CSV...
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (step === "mapping") {
    return (
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Importación
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
          <div>
            <div className="text-[13.5px] font-medium">
              {transactionCount} transacciones encontradas
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Asigná las categorías a los datos importados:
            </div>
          </div>

          {uniquePairs.map((pair, i) => {
            const choice = mappingChoices[i];
            const selectedCat = categories.find(
              (c) => c.id === choice.categoryValue,
            );

            return (
              <div
                key={`${pair.category_name}-${pair.subcategory_name ?? ""}-${i}`}
                className="space-y-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {pair.category_name}
                    {pair.subcategory_name && (
                      <>
                        {" "}/ {pair.subcategory_name}
                      </>
                    )}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Categoría
                    </label>
                    <select
                      value={choice.categoryValue}
                      onChange={(e) =>
                        handleCategoryChange(i, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
                    >
                      <option value="__new__">Crear nueva</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {pair.subcategory_name && (
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Subcategoría
                      </label>
                      {choice.categoryValue === "__new__" ? (
                        <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm text-muted-foreground">
                          Se creará automáticamente
                        </div>
                      ) : (
                        <select
                          value={choice.subcategoryValue ?? "__new__"}
                          onChange={(e) =>
                            handleSubcategoryChange(i, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
                        >
                          <option value="__new__">Crear nueva</option>
                          {selectedCat?.subcategories?.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={confirmImport.isPending}
            >
              {confirmImport.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Confirmando
                </>
              ) : (
                "Confirmar importación"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reset}
              disabled={confirmImport.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (step === "result") {
    return (
      <section className="mb-8">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
          {result ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="text-[13.5px] font-medium">
                  Importación completada
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Transacciones creadas
                  </span>
                  <span className="font-medium">
                    {result.created_transactions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cuentas creadas
                  </span>
                  <span className="font-medium">
                    {result.created_accounts.length}
                  </span>
                </div>
                {result.created_accounts.length > 0 && (
                  <div className="text-xs text-muted-foreground pl-4">
                    {result.created_accounts.join(", ")}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Categorías creadas
                  </span>
                  <span className="font-medium">
                    {result.created_categories.length}
                  </span>
                </div>
                {result.created_categories.length > 0 && (
                  <div className="text-xs text-muted-foreground pl-4">
                    {result.created_categories.join(", ")}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subcategorías creadas
                  </span>
                  <span className="font-medium">
                    {result.created_subcategories.length}
                  </span>
                </div>
                {result.created_subcategories.length > 0 && (
                  <div className="text-xs text-muted-foreground pl-4">
                    {result.created_subcategories.join(", ")}
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={reset}
              >
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                <div className="text-[13.5px] font-medium">
                  Error en la importación
                </div>
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={reset}>
                  Reintentar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={reset}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  return null;
}
