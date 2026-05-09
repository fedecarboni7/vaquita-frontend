import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { toast } from "sonner";
import type { Account, CurrencyCode } from "@/types/transaction";

interface CreditCardPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCard: Account | null;
  accounts: Account[];
}

export default function CreditCardPaymentModal({
  open,
  onOpenChange,
  creditCard,
  accounts,
}: CreditCardPaymentModalProps) {
  const queryClient = useQueryClient();
  const [sourceAccountId, setSourceAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceAccounts = useMemo(() =>
    accounts.filter(
      (account) =>
        account.account_type !== "credit_card" &&
        account.currency === creditCard?.currency
    ),
    [accounts, creditCard?.currency]
  );

  useEffect(() => {
    if (open && creditCard) {
      setAmount(Math.abs(creditCard.balance).toFixed(2));
      setSourceAccountId(sourceAccounts.length === 1 ? sourceAccounts[0].id : "");
    }
  }, [open, creditCard, sourceAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditCard || !sourceAccountId) return;

    const parsedAmount = Number.parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          type: "transfer",
          account_id: sourceAccountId,
          account_destination_id: creditCard.id,
          amount: parsedAmount,
          currency: creditCard.currency,
          expense_date: new Date().toISOString().split("T")[0],
          description: `Pago tarjeta ${creditCard.name}`,
          affects_balance: true,
          category_id: null,
          subcategory_id: null,
        }),
      });

      toast.success("Pago registrado");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
    } catch {
      toast.error("No se pudo registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!creditCard) return null;

  const currency = creditCard.currency as CurrencyCode;
  const formattedDebt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Math.abs(creditCard.balance));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar tarjeta {creditCard.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Tarjeta: <span className="text-foreground">{creditCard.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Deuda actual: <span className="text-foreground font-medium">{formattedDebt}</span>
              </div>
            </div>

            {sourceAccounts.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
                No tenés cuentas disponibles del mismo tipo de moneda para realizar el pago
              </div>
            ) : (
              <div>
                <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                  Cuenta origen
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  required
                >
                  <option value="">Seleccionar cuenta...</option>
                  {sourceAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                required
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || sourceAccounts.length === 0 || !sourceAccountId || !amount.trim()}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
