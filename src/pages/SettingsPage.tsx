import { useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
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
import { useApiKeyStatus, useDeleteApiKey, useSaveApiKey } from "@/hooks/useApiKeySettings";
import SubcategoryManager from "@/components/settings/SubcategoryManager";
import { useTheme } from "@/hooks/useTheme";
import type { Category } from "@/types/transaction";
import type { ApiKeyProvider, SessionApiKeyPayload } from "@/types/settings";

const SESSION_API_KEY_STORAGE_KEY = "session_llm_api_key";

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
  const { data: apiKeyStatus, isLoading: apiKeyStatusLoading } = useApiKeyStatus();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const saveApiKey = useSaveApiKey();
  const removeApiKey = useDeleteApiKey();
  const { isDark, toggleTheme } = useTheme();

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [provider, setProvider] = useState<ApiKeyProvider>("google");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [hasSessionKey, setHasSessionKey] = useState(() => {
    const rawSessionApiKey = sessionStorage.getItem(SESSION_API_KEY_STORAGE_KEY);
    if (!rawSessionApiKey) {
      return false;
    }

    try {
      const parsed = JSON.parse(rawSessionApiKey) as SessionApiKeyPayload;
      return Boolean(parsed.api_key && parsed.provider);
    } catch {
      sessionStorage.removeItem(SESSION_API_KEY_STORAGE_KEY);
      return false;
    }
  });

  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");

  const statusText = useMemo(() => {
    if (apiKeyStatusLoading) {
      return "Cargando estado...";
    }
    if (apiKeyStatus?.has_key) {
      const providerLabel = apiKeyStatus.provider === "groq" ? "Groq" : "Google AI Studio";
      return `API key guardada (${providerLabel}).`;
    }
    if (hasSessionKey) {
      return "API key activa solo para esta sesión.";
    }
    return "No hay API key guardada.";
  }, [apiKeyStatus?.has_key, apiKeyStatus?.provider, apiKeyStatusLoading, hasSessionKey]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    createCategory.mutate(
      { name: trimmed, type: newCatType },
      { onSuccess: () => { setNewCatName(""); } }
    );
  };

  const handleDeleteCategory = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleSaveUserApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedApiKey = apiKeyInput.trim();
    if (!normalizedApiKey) {
      toast.error("Ingresá una API key válida");
      return;
    }

    try {
      if (rememberApiKey) {
        sessionStorage.removeItem(SESSION_API_KEY_STORAGE_KEY);
        setHasSessionKey(false);
      } else {
        sessionStorage.setItem(
          SESSION_API_KEY_STORAGE_KEY,
          JSON.stringify({ provider, api_key: normalizedApiKey } satisfies SessionApiKeyPayload),
        );
        setHasSessionKey(true);
      }

      await saveApiKey.mutateAsync({
        provider,
        api_key: normalizedApiKey,
        persist: rememberApiKey,
      });
      setApiKeyInput("");
      toast.success(rememberApiKey ? "API key guardada" : "API key guardada solo en esta sesión");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la API key";
      toast.error(message);
    }
  };

  const handleDeleteUserApiKey = async () => {
    try {
      sessionStorage.removeItem(SESSION_API_KEY_STORAGE_KEY);
      setHasSessionKey(false);
      await removeApiKey.mutateAsync();
      toast.success("API key eliminada");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la API key";
      toast.error(message);
    }
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

      {/* API Key */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          API Key
        </div>

        <Link
          to="/api-keys-guide"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          ¿Cómo obtengo una key gratis?
          <ExternalLink className="h-3 w-3" />
        </Link>

        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="text-xs text-muted-foreground mb-3">{statusText}</div>

          <form onSubmit={handleSaveUserApiKey} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Proveedor
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ApiKeyProvider)}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
                >
                  <option value="google">Google AI Studio</option>
                  <option value="groq">Groq</option>
                </select>
              </label>

              <label className="text-xs text-muted-foreground">
                API key
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Pegá tu API key"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none transition-colors focus:border-muted-foreground"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rememberApiKey}
                onChange={(e) => setRememberApiKey(e.target.checked)}
              />
              Recordar mi API key
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={saveApiKey.isPending || !apiKeyInput.trim()}
              >
                {saveApiKey.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Guardando
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDeleteUserApiKey}
                disabled={removeApiKey.isPending}
              >
                {removeApiKey.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Eliminando
                  </>
                ) : (
                  "Eliminar"
                )}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-3">
            Tu API key se almacena encriptada y se usa exclusivamente para procesar tus mensajes con el agente de IA.
          </p>
        </div>
      </section>

      {/* Categorías */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Categorías
        </div>

        {categoriesLoading ? (
          <div className="space-y-3 mb-3">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`expense-${i}`} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={`income-${i}`} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-3">
            <div>
              <div className="text-[11px] font-mono tracking-wide uppercase text-muted-foreground mb-1.5">
                Gastos
              </div>
              <div className="flex flex-wrap gap-2">
                {expenseCategories.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sin categorías de gasto</div>
                ) : (
                  expenseCategories.map((cat) => (
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
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono tracking-wide uppercase text-muted-foreground mb-1.5">
                Ingresos
              </div>
              <div className="flex flex-wrap gap-2">
                {incomeCategories.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sin categorías de ingreso</div>
                ) : (
                  incomeCategories.map((cat) => (
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
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nueva categoría..."
            className="w-full sm:max-w-[200px] px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none transition-colors focus:border-muted-foreground"
          />
          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as "expense" | "income")}
            className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg bg-card text-sm outline-none cursor-pointer"
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

      {/* Subcategorías */}
      <section className="mb-8">
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
          Subcategorías
        </div>
        <SubcategoryManager
          categories={categories}
          loadingCategories={categoriesLoading}
        />
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

      {/* Delete Account */}
      <DeleteAccountSection />

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
