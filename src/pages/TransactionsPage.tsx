import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import FilterBar from "@/components/transactions/FilterBar";
import MonthSection from "@/components/transactions/MonthSection";
import TransactionDetailDrawer from "@/components/transactions/TransactionDetailDrawer";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import DeleteConfirmDialog from "@/components/transactions/DeleteConfirmDialog";
import type { Transaction, TransactionType } from "@/types/transaction";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthNav(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [accountFilter, setAccountFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Transaction[]>([]);

  // Detail / Edit / Delete state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const { data, isLoading, isError, refetch } = useTransactions({
    month,
    type: typeFilter,
    account: accountFilter,
    category: categoryFilter,
    limit: 20,
    offset,
  });

  // Merge paginated results
  const transactions =
    offset === 0 ? (data?.items ?? []) : [...accumulated, ...(data?.items ?? [])];
  const hasMore = data?.has_more ?? false;

  const resetFilters = useCallback(() => {
    setOffset(0);
    setAccumulated([]);
  }, []);

  const handleMonthChange = (delta: number) => {
    setMonth((prev) => shiftMonth(prev, delta));
    resetFilters();
  };

  const handleTypeChange = (t: TransactionType | undefined) => {
    setTypeFilter(t);
    resetFilters();
  };

  const handleAccountChange = (a: string | undefined) => {
    setAccountFilter(a);
    resetFilters();
  };

  const handleCategoryChange = (c: string | undefined) => {
    setCategoryFilter(c);
    resetFilters();
  };

  const handleLoadMore = () => {
    setAccumulated(transactions);
    setOffset((prev) => prev + 20);
  };

  const handleSelect = (t: Transaction) => {
    setSelectedTx(t);
    setDetailOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setSelectedTx(t);
    setEditOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = (t: Transaction) => {
    setSelectedTx(t);
    setDeleteOpen(true);
    setDetailOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Month navigator */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMonthChange(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold capitalize">
          {formatMonthNav(month)}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMonthChange(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </header>

      {/* Filters */}
      <FilterBar
        type={typeFilter}
        account={accountFilter}
        category={categoryFilter}
        accounts={accounts}
        categories={categories}
        onTypeChange={handleTypeChange}
        onAccountChange={handleAccountChange}
        onCategoryChange={handleCategoryChange}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && offset === 0 ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3 text-muted-foreground">
            <p className="text-sm">Error al cargar transacciones</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No hay transacciones en este mes</p>
          </div>
        ) : (
          <MonthSection
            month={month}
            transactions={transactions}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Dialogs */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => handleEdit(selectedTx!)}
        onDelete={() => handleDelete(selectedTx!)}
      />

      {selectedTx && (
        <EditTransactionModal
          key={selectedTx.id}
          transaction={selectedTx}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      <DeleteConfirmDialog
        transactionId={selectedTx?.id ?? null}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
