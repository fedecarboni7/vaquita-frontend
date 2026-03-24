import { useState, useCallback, useMemo } from "react";
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

function calculateNetTotal(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    if (t.type === "income") return acc + t.amount;
    if (t.type === "expense") return acc - t.amount;
    return acc;
  }, 0);
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [accountFilter, setAccountFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | undefined>();
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
    subcategoryId: subcategoryFilter,
    limit: 100,
    offset,
  });

  // Merge paginated results
  const transactions = useMemo(
    () => (offset === 0 ? (data?.items ?? []) : [...accumulated, ...(data?.items ?? [])]),
    [offset, data?.items, accumulated]
  );
  const hasMore = data?.has_more ?? false;

  // Client-side search filtering
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const lowerSearch = search.toLowerCase();
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(lowerSearch) ||
      t.note?.toLowerCase().includes(lowerSearch) ||
      t.category?.toLowerCase().includes(lowerSearch) ||
      t.account?.toLowerCase().includes(lowerSearch)
    );
  }, [transactions, search]);

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
    setSubcategoryFilter(undefined);
    resetFilters();
  };

  const handleSubcategoryChange = (subcategoryId: string | undefined) => {
    setSubcategoryFilter(subcategoryId);
    resetFilters();
  };

  const handleLoadMore = () => {
    setAccumulated(transactions);
    setOffset((prev) => prev + 100);
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

  const netTotal = calculateNetTotal(filteredTransactions);
  const currency = filteredTransactions[0]?.currency ?? "ARS";

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <FilterBar
        type={typeFilter}
        account={accountFilter}
        category={categoryFilter}
        subcategoryId={subcategoryFilter}
        search={search}
        accounts={accounts}
        categories={categories}
        onTypeChange={handleTypeChange}
        onAccountChange={handleAccountChange}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onSearchChange={setSearch}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between py-3 mb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold capitalize min-w-[120px] text-center">
                {formatMonthNav(month)}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <span
              className={`text-sm font-medium tabular-nums ${
                netTotal >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {netTotal >= 0 ? "+" : ""}
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(netTotal)}
            </span>
          </div>

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
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm">No hay transacciones en este mes</p>
            </div>
          ) : (
            <MonthSection
              transactions={filteredTransactions}
              hasMore={hasMore && search === ""}
              onLoadMore={handleLoadMore}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
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
