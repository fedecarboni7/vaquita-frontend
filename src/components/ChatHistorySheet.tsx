import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiFetch } from "@/api";
import { useChatThreads, type ChatThreadSummary } from "@/hooks/useChatThreads";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: string) => void;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatCount(value: number, singular: string, plural: string): string {
  if (value === 1) {
    return `1 ${singular}`;
  }
  return `${value} ${plural}`;
}

export default function ChatHistorySheet({ open, onOpenChange, onSelectThread }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThreadSummary | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const trimmed = searchInput.trim();
    const handler = window.setTimeout(() => {
      setDebouncedSearch(trimmed ? trimmed : null);
    }, 300);

    return () => window.clearTimeout(handler);
  }, [searchInput]);

  const threadsQuery = useChatThreads(debouncedSearch);
  const threads = useMemo(() => threadsQuery.data?.threads ?? [], [threadsQuery.data]);

  const deleteThread = useMutation({
    mutationFn: (threadId: string) =>
      apiFetch<void>(`/chat/threads/${threadId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      if (location.pathname === `/chat/threads/${threadId}`) {
        navigate("/", { state: { openHistory: true } });
      }
      setDeleteTarget(null);
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget || deleteThread.isPending) {
      return;
    }
    deleteThread.mutate(deleteTarget.thread_id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Historial de conversaciones</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar en conversaciones"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
          {threadsQuery.isLoading && (
            <div className="text-sm text-muted-foreground">Cargando conversaciones...</div>
          )}
          {threadsQuery.isError && (
            <div className="text-sm text-muted-foreground">No se pudo cargar el historial.</div>
          )}
          {!threadsQuery.isLoading && !threadsQuery.isError && threads.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {debouncedSearch ? "No se encontraron conversaciones." : "Todavia no hay conversaciones guardadas."}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-3">
            {threads.map((thread) => (
              <div
                key={thread.thread_id}
                className="relative flex w-full flex-col gap-2 rounded-2xl border border-border bg-card text-left transition hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => onSelectThread(thread.thread_id)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left"
                >
                  <div className="text-sm font-medium text-foreground">
                    {formatDateTime(thread.started_at)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatCount(thread.interaction_count, "mensaje", "mensajes")}</span>
                    <span>•</span>
                    <span>{formatCount(thread.transactions_created, "registro", "registros")}</span>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(thread);
                  }}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  aria-label="Eliminar conversación"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteThread.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
