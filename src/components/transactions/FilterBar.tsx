import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TransactionType, Account, Category } from "@/types/transaction";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  emptyLabel: string;
  className?: string;
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  emptyLabel,
  className,
}: MultiSelectDropdownProps) {
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const triggerLabel = selectedValues.length > 0 ? `${label}: ${selectedValues.length}` : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 text-sm ${className ?? ""}`}
      >
        <span className="truncate">{triggerLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          options.map((option) => {
            const isChecked = selectedSet.has(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  const nextChecked = checked === true;
                  if (nextChecked && !isChecked) {
                    onChange([...selectedValues, option.value]);
                    return;
                  }
                  if (!nextChecked && isChecked) {
                    onChange(selectedValues.filter((value) => value !== option.value));
                  }
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface Props {
  types: TransactionType[];
  accountIds: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  search: string;
  accounts: Account[];
  categories: Category[];
  onTypesChange: (types: TransactionType[]) => void;
  onAccountsChange: (accountIds: string[]) => void;
  onCategoriesChange: (categoryIds: string[]) => void;
  onSubcategoriesChange: (subcategoryIds: string[]) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
  { value: "transfer", label: "Transferencias" },
];

export default function FilterBar({
  types,
  accountIds,
  categoryIds,
  subcategoryIds,
  search,
  accounts,
  categories,
  onTypesChange,
  onAccountsChange,
  onCategoriesChange,
  onSubcategoriesChange,
  onSearchChange,
  onClearFilters,
}: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ value: account.id, label: account.name })),
    [accounts]
  );

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const availableSubcategories = useMemo(() => {
    const selectedCategorySet = new Set(categoryIds);
    const sourceCategories =
      selectedCategorySet.size === 0
        ? categories
        : categories.filter((category) => selectedCategorySet.has(category.id));

    return sourceCategories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
      }))
    );
  }, [categories, categoryIds]);

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const subcategoryNameById = useMemo(
    () =>
      new Map(
        categories
          .flatMap((category) => category.subcategories)
          .map((subcategory) => [subcategory.id, subcategory.name])
      ),
    [categories]
  );
  const typeLabelByValue = useMemo(
    () => new Map(typeOptions.map((option) => [option.value, option.label])),
    []
  );

  const selectedChips = [
    ...accountIds
      .filter((accountId) => accountNameById.has(accountId))
      .map((accountId) => ({
        key: `account:${accountId}`,
        label: `Cuenta: ${accountNameById.get(accountId)}`,
        onRemove: () => onAccountsChange(accountIds.filter((value) => value !== accountId)),
      })),
    ...categoryIds
      .filter((categoryId) => categoryNameById.has(categoryId))
      .map((categoryId) => ({
        key: `category:${categoryId}`,
        label: `Categoria: ${categoryNameById.get(categoryId)}`,
        onRemove: () => onCategoriesChange(categoryIds.filter((value) => value !== categoryId)),
      })),
    ...subcategoryIds
      .filter((subcategoryId) => subcategoryNameById.has(subcategoryId))
      .map((subcategoryId) => ({
        key: `subcategory:${subcategoryId}`,
        label: `Subcategoria: ${subcategoryNameById.get(subcategoryId)}`,
        onRemove: () => onSubcategoriesChange(subcategoryIds.filter((value) => value !== subcategoryId)),
      })),
    ...types
      .filter((type) => typeLabelByValue.has(type))
      .map((type) => ({
        key: `type:${type}`,
        label: `Tipo: ${typeLabelByValue.get(type)}`,
        onRemove: () => onTypesChange(types.filter((value) => value !== type)),
      })),
  ];

  const hasActiveFilters =
    search.trim().length > 0 ||
    accountIds.length > 0 ||
    categoryIds.length > 0 ||
    subcategoryIds.length > 0 ||
    types.length > 0;

  const filterControls = (
    <>
      <input
        className="filter-input w-full md:w-64"
        type="text"
        placeholder="Buscar descripción..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <MultiSelectDropdown
        label="Categorias"
        options={categoryOptions}
        selectedValues={categoryIds}
        onChange={onCategoriesChange}
        emptyLabel="No hay categorias disponibles"
        className="w-full md:w-52"
      />

      <MultiSelectDropdown
        label="Subcategorias"
        options={availableSubcategories}
        selectedValues={subcategoryIds}
        onChange={onSubcategoriesChange}
        emptyLabel="No hay subcategorias para las categorias seleccionadas"
        className="w-full md:w-52"
      />

      <MultiSelectDropdown
        label="Cuentas"
        options={accountOptions}
        selectedValues={accountIds}
        onChange={onAccountsChange}
        emptyLabel="No hay cuentas disponibles"
        className="w-full md:w-52"
      />

      <MultiSelectDropdown
        label="Tipos"
        options={typeOptions}
        selectedValues={types}
        onChange={(values) => onTypesChange(values as TransactionType[])}
        emptyLabel="No hay tipos disponibles"
        className="w-full md:w-44"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="justify-center md:justify-start"
      >
        Limpiar filtros
      </Button>
    </>
  );
  
  return (
    <div className="px-2 py-2 sm:px-4 sm:py-3 border-b border-border/60">
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </span>
          <span className="text-xs text-muted-foreground">
            {mobileFiltersOpen ? "Ocultar" : "Mostrar"}
          </span>
        </Button>

        {mobileFiltersOpen && (
          <div className="mt-2 grid gap-2">
            {filterControls}
            {selectedChips.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedChips.map((chip) => (
                  <Badge key={chip.key} variant="secondary" className="gap-1.5 pr-1">
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className="rounded-sm p-0.5 hover:bg-foreground/10"
                      aria-label={`Quitar ${chip.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:flex md:items-center md:gap-2.5 md:mb-3 md:flex-wrap">
        {filterControls}
      </div>

      {selectedChips.length > 0 && (
        <div className="hidden md:flex md:flex-wrap md:gap-1.5">
          {selectedChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1.5 pr-1">
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-sm p-0.5 hover:bg-foreground/10"
                aria-label={`Quitar ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
