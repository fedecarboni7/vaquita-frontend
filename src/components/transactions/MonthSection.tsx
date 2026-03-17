import { Button } from "@/components/ui/button";
import TransactionRow from "./TransactionRow";
import type { Transaction } from "@/types/transaction";

interface Props {
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function MonthSection({
  transactions,
  hasMore,
  onLoadMore,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th className="text-right">Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center py-3">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Cargar más
          </Button>
        </div>
      )}
    </section>
  );
}
