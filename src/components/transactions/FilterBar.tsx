import type { TransactionType, Account, Category } from "@/types/transaction";

interface Props {
  type: TransactionType | undefined;
  account: string | undefined;
  category: string | undefined;
  subcategoryId: string | undefined;
  search: string;
  accounts: Account[];
  categories: Category[];
  onTypeChange: (type: TransactionType | undefined) => void;
  onAccountChange: (account: string | undefined) => void;
  onCategoryChange: (category: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onSearchChange: (search: string) => void;
}

const typeOptions: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Tipo: Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
  { value: "transfer", label: "Transferencias" },
];

export default function FilterBar({
  type,
  account,
  category,
  subcategoryId,
  search,
  accounts,
  categories,
  onTypeChange,
  onAccountChange,
  onCategoryChange,
  onSubcategoryChange,
  onSearchChange,
}: Props) {
  const selectedCategory = categories.find((item) => item.name === category);
  const availableSubcategories = selectedCategory?.subcategories ?? [];
  
  return (
    <div className="filters-bar px-4 py-3">
      <input 
        className="filter-input" 
        type="text" 
        placeholder="Buscar descripción..." 
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      
      <select 
        className="filter-select"
        value={category ?? "__all__"}
        onChange={(e) => onCategoryChange(e.target.value === "__all__" ? undefined : e.target.value)}
      >
        <option value="__all__">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>

      <select 
        className="filter-select"
        value={account ?? "__all__"}
        onChange={(e) => onAccountChange(e.target.value === "__all__" ? undefined : e.target.value)}
      >
        <option value="__all__">Todas las cuentas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.name}>{a.name}</option>
        ))}
      </select>

      <select 
        className="filter-select"
        value={type ?? "all"}
        onChange={(e) => onTypeChange(e.target.value === "all" ? undefined : e.target.value as TransactionType)}
      >
        {typeOptions.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {category && (
        <select
          className="filter-select"
          value={subcategoryId ?? "__all__"}
          onChange={(e) => onSubcategoryChange(e.target.value === "__all__" ? undefined : e.target.value)}
        >
          <option value="__all__">Todas las subcategorías</option>
          {availableSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
