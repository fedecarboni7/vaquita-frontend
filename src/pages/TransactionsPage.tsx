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
import CreateTransactionModal from "@/components/transactions/CreateTransactionModal";
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

function calculateNetTotalsByCurrency(
  transactions: Transaction[]
): Array<{ currency: Transaction["currency"]; total: number }> {
  const totals = new Map<Transaction["currency"], number>();

  for (const transaction of transactions) {
    if (transaction.affects_balance === false) {
      continue;
    }

    const signal = transaction.type === "income" ? 1 : transaction.type === "expense" ? -1 : 0;
    if (signal === 0) continue;

    totals.set(transaction.currency, (totals.get(transaction.currency) ?? 0) + signal * transaction.amount);
  }

  return Array.from(totals.entries())
    .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
    .map(([currency, total]) => ({ currency, total }));
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<TransactionType[]>([]);
  const [accountFilters, setAccountFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [subcategoryFilters, setSubcategoryFilters] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Transaction[]>([]);

  // Detail / Edit / Delete state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const getAllowedSubcategoryIds = useCallback(
    (selectedCategoryIds: string[]) =>
      new Set(
        (selectedCategoryIds.length === 0
          ? categories.flatMap((category) => category.subcategories)
          : categories
              .filter((category) => selectedCategoryIds.includes(category.id))
              .flatMap((category) => category.subcategories)
        ).map((subcategory) => subcategory.id)
      ),
    [categories]
  );

  const effectiveSubcategoryFilters = useMemo(() => {
    const allowed = getAllowedSubcategoryIds(categoryFilters);
    return subcategoryFilters.filter((subcategoryId) => allowed.has(subcategoryId));
  }, [subcategoryFilters, categoryFilters, getAllowedSubcategoryIds]);

  const { data, isLoading, isError, refetch } = useTransactions({
    month,
    types: typeFilters,
    accountIds: accountFilters,
    categoryIds: categoryFilters,
    subcategoryIds: effectiveSubcategoryFilters,
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
      (t.category_name ?? t.category)?.toLowerCase().includes(lowerSearch) ||
      t.account?.toLowerCase().includes(lowerSearch)
    );
  }, [transactions, search]);

  const resetPagination = useCallback(() => {
    setOffset(0);
    setAccumulated([]);
  }, []);

  const handleMonthChange = (delta: number) => {
    setMonth((prev) => shiftMonth(prev, delta));
    resetPagination();
  };

  const handleTypesChange = (types: TransactionType[]) => {
    setTypeFilters(types);
    resetPagination();
  };

  const handleAccountsChange = (accountIds: string[]) => {
    setAccountFilters(accountIds);
    resetPagination();
  };

  const handleCategoriesChange = (categoryIds: string[]) => {
    setCategoryFilters(categoryIds);
    const allowedSubcategoryIds = getAllowedSubcategoryIds(categoryIds);
    setSubcategoryFilters((previous) =>
      previous.filter((subcategoryId) => allowedSubcategoryIds.has(subcategoryId))
    );
    resetPagination();
  };

  const handleSubcategoriesChange = (subcategoryIds: string[]) => {
    const allowedSubcategoryIds = getAllowedSubcategoryIds(categoryFilters);
    setSubcategoryFilters(
      subcategoryIds.filter((subcategoryId) => allowedSubcategoryIds.has(subcategoryId))
    );
    resetPagination();
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilters([]);
    setAccountFilters([]);
    setCategoryFilters([]);
    setSubcategoryFilters([]);
    resetPagination();
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

  const netTotalsByCurrency = useMemo(
    () => calculateNetTotalsByCurrency(filteredTransactions),
    [filteredTransactions]
  );
  const balancesByCurrency =
    netTotalsByCurrency.length > 0
      ? netTotalsByCurrency
      : [{ currency: "ARS" as Transaction["currency"], total: 0 }];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Filters */}
      <FilterBar
        types={typeFilters}
        accountIds={accountFilters}
        categoryIds={categoryFilters}
        subcategoryIds={effectiveSubcategoryFilters}
        search={search}
        accounts={accounts}
        categories={categories}
        onTypesChange={handleTypesChange}
        onAccountsChange={handleAccountsChange}
        onCategoriesChange={handleCategoriesChange}
        onSubcategoriesChange={handleSubcategoriesChange}
        onSearchChange={setSearch}
        onClearFilters={handleClearFilters}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 sm:px-4">
          <div className="flex flex-col gap-2 py-3 mb-2 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleMonthChange(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm font-semibold capitalize text-center min-w-0">
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
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Nuevo
              </Button>
            </div>
            
            <div className="flex flex-col items-end gap-0.5 self-end sm:self-auto">
              {balancesByCurrency.map(({ currency, total }) => (
                <span
                  key={currency}
                  className={`text-xs sm:text-sm font-medium tabular-nums ${
                    total >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {total >= 0 ? "+" : ""}
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(total)}
                </span>
              ))}
            </div>
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
              <p className="text-sm">
                {search || typeFilters.length || accountFilters.length || categoryFilters.length || effectiveSubcategoryFilters.length
                  ? "No hay transacciones con los filtros actuales"
                  : "No hay transacciones en este mes"}
              </p>
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
      {createOpen && (
        <CreateTransactionModal
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

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
