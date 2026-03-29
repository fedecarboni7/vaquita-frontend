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
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "Tipo", value: TYPE_LABELS[transaction.type] },
    {
      label: "Monto",
      value: `${transaction.currency} ${transaction.amount.toLocaleString("es-AR")}`,
    },
    { label: "Descripción", value: transaction.description },
    { label: "Categoría", value: transaction.category },
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
  ];

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
            <DialogTitle>Detalle de transacción</DialogTitle>
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
          <DrawerTitle>Detalle de transacción</DrawerTitle>
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
