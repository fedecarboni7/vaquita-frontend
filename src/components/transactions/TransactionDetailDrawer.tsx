import { useState } from "react";
import { Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrencyAmount, getWeakCurrencyExchangeRateFromAmounts } from "@/lib/utils";
import { getReceiptUrl } from "@/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  expense: "Gasto",
  income: "Ingreso",
  transfer: "Transferencia",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailContent({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isViewingReceipt, setIsViewingReceipt] = useState(false);
  const exchangeRate = getWeakCurrencyExchangeRateFromAmounts(
    transaction.amount,
    transaction.to_amount,
    transaction.currency,
    transaction.account_destination_currency ?? transaction.currency,
  );

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Tipo", value: TYPE_LABELS[transaction.type] },
    {
      label: "Monto",
      value: formatCurrencyAmount(transaction.amount, transaction.currency),
    },
    {
      label: "Monto destino",
      value:
        transaction.to_amount != null
          ? formatCurrencyAmount(
              transaction.to_amount,
              transaction.account_destination_currency ?? transaction.currency,
            )
          : null,
    },
    {
      label: "Tipo de cambio",
      value: exchangeRate ? formatCurrencyAmount(exchangeRate.amount, exchangeRate.currency) : null,
    },
    { label: "Descripción", value: transaction.description },
    { label: "Categoría", value: transaction.category_name ?? transaction.category },
    { label: "Subcategoría", value: transaction.subcategory_name },
    { label: "Cuenta", value: transaction.account },
    { label: "Cuenta destino", value: transaction.account_destination },
    { label: "Fecha", value: formatDate(transaction.expense_date) },
    { label: "Nota", value: transaction.note },
    {
      label: "Cuotas",
      value: transaction.installments
        ? String(transaction.installments)
        : null,
    },
    {
      label: "Afecta balance en Registros",
      value: transaction.affects_balance === false ? "No" : "Si",
    },
  ];

  const handleViewReceipt = async () => {
    setIsViewingReceipt(true);

    try {
      const response = await getReceiptUrl(transaction.id);
      window.open(response.receipt_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir el comprobante";
      toast.error(message);
    } finally {
      setIsViewingReceipt(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <div key={r.label}>
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-sm font-medium">{r.value}</p>
            </div>
          ))}
      </div>
      {transaction.receipt_url && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Comprobante adjunto</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleViewReceipt} disabled={isViewingReceipt}>
            {isViewingReceipt ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="mr-2 h-4 w-4" />
            )}
            Ver comprobante
          </Button>
        </div>
      )}
      <Separator />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!transaction) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalle de transacción
              {transaction.receipt_url && (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </DialogTitle>
          </DialogHeader>
          <DetailContent
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            Detalle de transacción
            {transaction.receipt_url && (
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            )}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto">
          <DetailContent
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
