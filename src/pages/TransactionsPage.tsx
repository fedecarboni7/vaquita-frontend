import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTransactions, useAvailableMonths } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import { useCurrency } from "@/hooks/useCurrency";
import { cn, formatCurrencyAmount } from "@/lib/utils";
import { calculateCurrencySummary } from "@/lib/transactions";
import CurrencyToggle from "@/components/CurrencyToggle";
import FilterBar from "@/components/transactions/FilterBar";
import DayGroupedList from "@/components/transactions/DayGroupedList";
import TransactionDetailDrawer from "@/components/transactions/TransactionDetailDrawer";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import CreateTransactionModal from "@/components/transactions/CreateTransactionModal";
import DeleteConfirmDialog from "@/components/transactions/DeleteConfirmDialog";
import type { Transaction, TransactionType, CurrencyCode } from "@/types/transaction";

const UNCATEGORIZED_CATEGORY_FILTER = "none";

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
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

const MONTH_ABBREVIATIONS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function MonthPickerPanel({
  availableMonths,
  currentMonth,
  onSelect,
}: {
  availableMonths: string[];
  currentMonth: string;
  onSelect: (month: string) => void;
}) {
  const [pickerYear, setPickerYear] = useState(Number(currentMonth.slice(0, 4)));
  const availableSet = useMemo(() => new Set(availableMonths), [availableMonths]);

  useEffect(() => {
    setPickerYear(Number(currentMonth.slice(0, 4)));
  }, [currentMonth]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          onClick={() => setPickerYear((year) => year - 1)}
          aria-label="Año anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold tabular-nums">{pickerYear}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7"
          onClick={() => setPickerYear((year) => year + 1)}
          aria-label="Año siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {MONTH_ABBREVIATIONS.map((abbreviation, index) => {
          const key = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
          const isAvailable = availableSet.has(key);
          const isCurrent = key === currentMonth;
          return (
            <button
              key={key}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(key)}
              className={cn(
                "h-8 rounded-md text-xs font-medium transition-colors",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isAvailable
                    ? "hover:bg-accent"
                    : "cursor-default text-muted-foreground/40"
              )}
            >
              {abbreviation}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  amount,
  currency,
  balancesVisible,
  className,
}: {
  label: string;
  amount: number;
  currency: CurrencyCode;
  balancesVisible: boolean;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-3">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm font-medium tabular-nums", className)}>
        {balancesVisible ? formatCurrencyAmount(amount, currency) : "••••••"}
      </span>
    </div>
  );
}

export default function TransactionsPage() {
  const { balancesVisible } = useBalanceVisibility();
  const { currency } = useCurrency();
  const [month, setMonth] = useState(getCurrentMonth);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
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
  const { data: availableMonths = [] } = useAvailableMonths();
  const hasUncategorizedCategoryFilter = categoryFilters.includes(UNCATEGORIZED_CATEGORY_FILTER);
  const selectedCategoryIds = categoryFilters.filter(
    (categoryId) => categoryId !== UNCATEGORIZED_CATEGORY_FILTER
  );

  const getAllowedSubcategoryIds = useCallback(
    (selectedCategoryIds: string[]) => {
      const hasUncategorized = selectedCategoryIds.includes(UNCATEGORIZED_CATEGORY_FILTER);
      const regularCategoryIds = selectedCategoryIds.filter(
        (categoryId) => categoryId !== UNCATEGORIZED_CATEGORY_FILTER
      );

      if (hasUncategorized && regularCategoryIds.length === 0) {
        return new Set<string>();
      }

      const sourceCategories =
        regularCategoryIds.length === 0
          ? categories
          : categories.filter((category) => regularCategoryIds.includes(category.id));

      return new Set(sourceCategories.flatMap((category) => category.subcategories).map((subcategory) => subcategory.id));
    },
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
    categoryIds: hasUncategorizedCategoryFilter ? undefined : categoryFilters,
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

  const categoryFilteredTransactions = useMemo(() => {
    if (!hasUncategorizedCategoryFilter) return transactions;

    if (selectedCategoryIds.length === 0) {
      return transactions.filter((transaction) => transaction.category_id === null);
    }

    const selectedCategoryIdSet = new Set(selectedCategoryIds);
    return transactions.filter(
      (transaction) =>
        transaction.category_id === null ||
        (transaction.category_id !== null && selectedCategoryIdSet.has(transaction.category_id))
    );
  }, [transactions, hasUncategorizedCategoryFilter, selectedCategoryIds]);

  // Client-side search filtering
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return categoryFilteredTransactions;
    const lowerSearch = search.toLowerCase();
    return categoryFilteredTransactions.filter(t => 
      t.description?.toLowerCase().includes(lowerSearch) ||
      t.note?.toLowerCase().includes(lowerSearch) ||
      (t.category_name ?? t.category)?.toLowerCase().includes(lowerSearch) ||
      t.account?.toLowerCase().includes(lowerSearch)
    );
  }, [categoryFilteredTransactions, search]);

  // Client-side currency filtering
  const currencyFilteredTransactions = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.currency === currency),
    [filteredTransactions, currency],
  );

  const monthSummary = useMemo(
    () => calculateCurrencySummary(filteredTransactions, currency),
    [filteredTransactions, currency],
  );

  const resetPagination = useCallback(() => {
    setOffset(0);
    setAccumulated([]);
  }, []);

  const handleMonthChange = (delta: number) => {
    setMonth((prev) => shiftMonth(prev, delta));
    resetPagination();
  };

  const handleSelectMonth = (targetMonth: string) => {
    setMonth(targetMonth);
    resetPagination();
    setMonthPickerOpen(false);
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border py-2">
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange(-1)}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                <PopoverTrigger
                  render={
                    <Button variant="ghost" className="h-8 px-2 text-sm font-semibold">
                      <span className="capitalize">{formatMonthNav(month)}</span>
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-64">
                  <MonthPickerPanel
                    availableMonths={availableMonths}
                    currentMonth={month}
                    onSelect={handleSelectMonth}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange(1)}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <CurrencyToggle />

              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Buscar"
                      className={cn(search ? "text-foreground" : "text-muted-foreground")}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  }
                />
                <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-xs">
                  <div className="relative">
                    <input
                      className="filter-input w-full"
                      style={{ paddingRight: "2rem" }}
                      type="text"
                      placeholder="Buscar descripción..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    {search.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Limpiar búsqueda"
                        className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

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
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          <div className="mb-3 rounded-lg border border-border bg-card">
            <div className="grid grid-cols-3 divide-x divide-border">
              <SummaryCell
                label="Ingresos"
                amount={monthSummary.income}
                currency={currency}
                balancesVisible={balancesVisible}
                className="text-green-500"
              />
              <SummaryCell
                label="Gastos"
                amount={monthSummary.expenses}
                currency={currency}
                balancesVisible={balancesVisible}
                className="text-red-500"
              />
              <SummaryCell
                label="Balance neto"
                amount={monthSummary.netBalance}
                currency={currency}
                balancesVisible={balancesVisible}
                className={
                  monthSummary.netBalance >= 0 ? "text-green-500" : "text-red-500"
                }
              />
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
          ) : currencyFilteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm">
                {search || typeFilters.length || accountFilters.length || categoryFilters.length || effectiveSubcategoryFilters.length
                  ? "No hay transacciones con los filtros actuales"
                  : "No hay transacciones en este mes"}
              </p>
            </div>
          ) : (
            <DayGroupedList
              transactions={currencyFilteredTransactions}
              currency={currency}
              balancesVisible={balancesVisible}
              hasMore={hasMore && search === ""}
              categories={categories}
              onLoadMore={handleLoadMore}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Button
        onClick={() => setCreateOpen(true)}
        aria-label="Nueva transacción"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Button>

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
