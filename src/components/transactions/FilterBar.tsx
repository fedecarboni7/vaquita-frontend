import { useMemo } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCategoryEmoji } from "@/lib/categoryDisplay";
import type { TransactionType, Account, Category } from "@/types/transaction";

interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  emptyLabel: string;
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  emptyLabel,
}: MultiSelectDropdownProps) {
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const triggerLabel = selectedValues.length > 0 ? `${label}: ${selectedValues.length}` : label;

  const groupedOptions = useMemo(() => {
    const ungrouped: MultiSelectOption[] = [];
    const groups = new Map<string, MultiSelectOption[]>();
    for (const option of options) {
      if (option.group === undefined) {
        ungrouped.push(option);
        continue;
      }
      const groupOptions = groups.get(option.group);
      if (groupOptions) {
        groupOptions.push(option);
      } else {
        groups.set(option.group, [option]);
      }
    }
    return { ungrouped, groups };
  }, [options]);

  const renderOption = (option: MultiSelectOption) => {
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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
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
          <>
            {groupedOptions.ungrouped.map(renderOption)}
            {[...groupedOptions.groups.entries()].map(([groupLabel, groupOptions]) => (
              <DropdownMenuGroup key={groupLabel}>
                <DropdownMenuLabel inset>{groupLabel}</DropdownMenuLabel>
                {groupOptions.map(renderOption)}
              </DropdownMenuGroup>
            ))}
          </>
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
  onClearFilters: () => void;
}

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
  { value: "transfer", label: "Transferencias" },
];

const UNCATEGORIZED_CATEGORY_FILTER = "none";

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
  onClearFilters,
}: Props) {
  const accountOptions = useMemo(
    () => accounts.map((account) => ({ value: account.id, label: account.name })),
    [accounts]
  );

  const categoryOptions = useMemo(
    () => [
      { value: UNCATEGORIZED_CATEGORY_FILTER, label: "🚫 Sin categoría" },
      ...categories.map((category) => ({
        value: category.id,
        label: [getCategoryEmoji(category), category.name].filter(Boolean).join(" "),
        group:
          category.type === "expense"
            ? "Gastos"
            : category.type === "income"
              ? "Ingresos"
              : undefined,
      })),
    ],
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
    () =>
      new Map<string, string>([
        ...categories.map((category): [string, string] => [category.id, category.name]),
        [UNCATEGORIZED_CATEGORY_FILTER, "Sin categoría"],
      ]),
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

  const activeFilterCount =
    accountIds.length + categoryIds.length + subcategoryIds.length + types.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Filtros"
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-none text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm">
        <div className="grid gap-2">
          <MultiSelectDropdown
            label="Categorias"
            options={categoryOptions}
            selectedValues={categoryIds}
            onChange={onCategoriesChange}
            emptyLabel="No hay categorias disponibles"
          />

          <MultiSelectDropdown
            label="Subcategorias"
            options={availableSubcategories}
            selectedValues={subcategoryIds}
            onChange={onSubcategoriesChange}
            emptyLabel="No hay subcategorias para las categorias seleccionadas"
          />

          <MultiSelectDropdown
            label="Cuentas"
            options={accountOptions}
            selectedValues={accountIds}
            onChange={onAccountsChange}
            emptyLabel="No hay cuentas disponibles"
          />

          <MultiSelectDropdown
            label="Tipos"
            options={typeOptions}
            selectedValues={types}
            onChange={(values) => onTypesChange(values as TransactionType[])}
            emptyLabel="No hay tipos disponibles"
          />
        </div>

        {selectedChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="mt-3 w-full justify-center"
        >
          Limpiar filtros
        </Button>
      </PopoverContent>
    </Popover>
  );
}
