import { useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch } from "@/api";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
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

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const requiredText = "estoy seguro de que quiero eliminar mi cuenta y todos los datos";

  const deleteAccount = useMutation({
    mutationFn: async () => {
      await apiFetch("/users/me", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.clear();
      logout();
      navigate("/login");
    },
    onError: () => {
      toast.error("No se pudo eliminar la cuenta. Intenta de nuevo.");
      setOpen(false);
      setConfirmationText("");
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationText("");
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirmationText !== requiredText) return;
    deleteAccount.mutate();
  };

  return (
    <section className="mb-8">
      <div className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-3 pb-2 border-b border-border">
        Zona de Peligro
      </div>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        <div className="flex flex-col items-start gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13.5px] text-destructive">Eliminar cuenta</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Esta acción no se puede deshacer
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => setOpen(true)}
          >
            Eliminar cuenta
          </Button>

          <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Esta acción es irreversible y todos tus datos serán eliminados permanentemente.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Para confirmar, escribe: <span className="font-mono bg-muted px-1 py-0.5 rounded text-destructive select-all">{requiredText}</span>
                    </p>
                    <input
                      value={confirmationText}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmationText(e.target.value)}
                      placeholder={requiredText}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteAccount.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  disabled={confirmationText !== requiredText || deleteAccount.isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleteAccount.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Eliminar cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}
