import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { TransactionType, Account, Category } from "@/types/transaction";

interface Props {
  type: TransactionType | undefined;
  account: string | undefined;
  category: string | undefined;
  accounts: Account[];
  categories: Category[];
  onTypeChange: (type: TransactionType | undefined) => void;
  onAccountChange: (account: string | undefined) => void;
  onCategoryChange: (category: string | undefined) => void;
}

const typeOptions: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
];

function TypeChips({
  selected,
  onChange,
}: {
  selected: TransactionType | undefined;
  onChange: (t: TransactionType | undefined) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {typeOptions.map((opt) => {
        const isActive =
          opt.value === "all" ? !selected : selected === opt.value;
        return (
          <Badge
            key={opt.value}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer whitespace-nowrap select-none",
              isActive && "pointer-events-none",
            )}
            onClick={() =>
              onChange(opt.value === "all" ? undefined : opt.value)
            }
          >
            {opt.label}
          </Badge>
        );
      })}
    </div>
  );
}

function AccountSelect({
  value,
  accounts,
  onChange,
}: {
  value: string | undefined;
  accounts: Account[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Select
      value={value ?? "__all__"}
      onValueChange={(v) => onChange(v === "__all__" || v === null ? undefined : v)}
    >
      <SelectTrigger className="w-full md:w-40">
        <SelectValue placeholder="Cuenta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Todas las cuentas</SelectItem>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.name}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CategorySelect({
  value,
  categories,
  onChange,
}: {
  value: string | undefined;
  categories: Category[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Select
      value={value ?? "__all__"}
      onValueChange={(v) => onChange(v === "__all__" || v === null ? undefined : v)}
    >
      <SelectTrigger className="w-full md:w-40">
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Todas las categorías</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.name}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function FilterBar({
  type,
  account,
  category,
  accounts,
  categories,
  onTypeChange,
  onAccountChange,
  onCategoryChange,
}: Props) {
  const hasExtraFilters = !!account || !!category;

  return (
    <div className="px-4 py-3 border-b border-border space-y-2">
      {/* Type chips — always visible */}
      <div className="flex items-center gap-2">
        <TypeChips selected={type} onChange={onTypeChange} />

        {/* Mobile: filter button for account/category */}
        <Sheet>
          <SheetTrigger
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 shrink-0 md:hidden hover:bg-accent hover:text-accent-foreground",
              hasExtraFilters && "border-primary text-primary",
            )}
          >
            <Filter className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Cuenta
                </label>
                <AccountSelect
                  value={account}
                  accounts={accounts}
                  onChange={onAccountChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Categoría
                </label>
                <CategorySelect
                  value={category}
                  categories={categories}
                  onChange={onCategoryChange}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: account + category inline */}
      <div className="hidden md:flex gap-2">
        <AccountSelect
          value={account}
          accounts={accounts}
          onChange={onAccountChange}
        />
        <CategorySelect
          value={category}
          categories={categories}
          onChange={onCategoryChange}
        />
      </div>
    </div>
  );
}
