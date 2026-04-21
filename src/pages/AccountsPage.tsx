import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, Scale, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AccountDetailDrawer from "@/components/accounts/AccountDetailDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAccounts,
  useAdjustAccountBalance,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAccounts";
import type { Account, AccountTypeCode, CurrencyCode } from "@/types/transaction";

const CARD_ACCENTS = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];
const ACCOUNT_TYPE_LABELS: Record<AccountTypeCode, string> = {
  savings: "Caja de ahorro",
  checking: "Cuenta corriente",
  credit_card: "Tarjeta de crédito",
  digital_wallet: "Billetera virtual",
  cash: "Efectivo",
};
const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountTypeCode; label: string }> = [
  { value: "savings", label: "Caja de ahorro" },
  { value: "checking", label: "Cuenta corriente" },
  { value: "credit_card", label: "Tarjeta de crédito" },
  { value: "digital_wallet", label: "Billetera virtual" },
  { value: "cash", label: "Efectivo" },
];
const CURRENCY_OPTIONS: CurrencyCode[] = ["ARS", "USD", "EUR"];

function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(value: string): string {
  return parseLocalDate(value).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toNullableDate(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function parseBalanceInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading, isError, refetch } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const adjustMutation = useAdjustAccountBalance();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountTypeCode>("savings");
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>("ARS");
  const [newIncludeInTotal, setNewIncludeInTotal] = useState(true);
  const [newBillingPeriodStart, setNewBillingPeriodStart] = useState("");
  const [newBillingPeriodEnd, setNewBillingPeriodEnd] = useState("");
  const [newPaymentDueDate, setNewPaymentDueDate] = useState("");
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountTypeCode>("savings");
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>("ARS");
  const [editIncludeInTotal, setEditIncludeInTotal] = useState(true);
  const [editBillingPeriodStart, setEditBillingPeriodStart] = useState("");
  const [editBillingPeriodEnd, setEditBillingPeriodEnd] = useState("");
  const [editPaymentDueDate, setEditPaymentDueDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [adjustBalance, setAdjustBalance] = useState("");
  const [adjustAffectsBalance, setAdjustAffectsBalance] = useState(false);

  const totalsByCurrency = useMemo(() => {
    return accounts
      .filter((account) => account.include_in_total)
      .reduce<Record<CurrencyCode, number>>(
      (acc, account) => {
        acc[account.currency] += account.balance;
        return acc;
      },
      { ARS: 0, USD: 0, EUR: 0 },
    );
  }, [accounts]);

  const totalsVisible = useMemo(() => {
    const countsByCurrency = accounts
      .filter((account) => account.include_in_total)
      .reduce<Record<CurrencyCode, number>>(
      (acc, account) => {
        acc[account.currency] += 1;
        return acc;
      },
      { ARS: 0, USD: 0, EUR: 0 },
    );

    return CURRENCY_OPTIONS.filter((currency) => countsByCurrency[currency] > 0).map((currency) => ({
      currency,
      total: totalsByCurrency[currency],
      count: countsByCurrency[currency],
    }));
  }, [accounts, totalsByCurrency]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMutation.mutate({
      name: trimmed,
      account_type: newType,
      currency: newCurrency,
      include_in_total: newIncludeInTotal,
      billing_period_start: newType === "credit_card" ? toNullableDate(newBillingPeriodStart) : null,
      billing_period_end: newType === "credit_card" ? toNullableDate(newBillingPeriodEnd) : null,
      payment_due_date: newType === "credit_card" ? toNullableDate(newPaymentDueDate) : null,
    }, {
      onSuccess: () => {
        setNewName("");
        setNewType("savings");
        setNewCurrency("ARS");
        setNewIncludeInTotal(true);
        setNewBillingPeriodStart("");
        setNewBillingPeriodEnd("");
        setNewPaymentDueDate("");
        setCreateOpen(false);
      },
    });
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const openEdit = (account: Account) => {
    setEditTarget(account);
    setEditName(account.name);
    setEditType(account.account_type);
    setEditCurrency(account.currency);
    setEditIncludeInTotal(account.include_in_total);
    setEditBillingPeriodStart(account.billing_period_start ?? "");
    setEditBillingPeriodEnd(account.billing_period_end ?? "");
    setEditPaymentDueDate(account.payment_due_date ?? "");
    setEditOpen(true);
  };

  const openAdjust = (account: Account) => {
    setAdjustTarget(account);
    setAdjustBalance(account.balance.toFixed(2));
    setAdjustAffectsBalance(false);
    setAdjustOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        name: trimmed,
        account_type: editType,
        currency: editCurrency,
        include_in_total: editIncludeInTotal,
        billing_period_start: editType === "credit_card" ? toNullableDate(editBillingPeriodStart) : null,
        billing_period_end: editType === "credit_card" ? toNullableDate(editBillingPeriodEnd) : null,
        payment_due_date: editType === "credit_card" ? toNullableDate(editPaymentDueDate) : null,
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditTarget(null);
        },
      },
    );
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const parsedBalance = parseBalanceInput(adjustBalance);
    if (parsedBalance == null) return;

    adjustMutation.mutate(
      {
        id: adjustTarget.id,
        balance: parsedBalance,
        affects_balance: adjustAffectsBalance,
      },
      {
        onSuccess: () => {
          setAdjustOpen(false);
          setAdjustTarget(null);
          setAdjustAffectsBalance(false);
        },
      },
    );
  };

  const parsedAdjustBalance = parseBalanceInput(adjustBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-serif text-2xl font-medium tracking-[-0.4px]">
            Cuentas
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">
            Saldo actual por cuenta y moneda
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva cuenta
        </Button>
      </div>

      {totalsVisible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {totalsVisible.map(({ currency, total, count }) => (
          <div key={currency} className="rounded-lg border border-border bg-card px-5 py-4">
            <div className="text-[11px] text-muted-foreground font-mono tracking-wider uppercase mb-2">
              Total {currency}
            </div>
            <div className="font-serif text-[28px] tracking-[-0.5px] leading-none">
              {formatMoney(total, currency)}
            </div>
            <div className="text-[11.5px] mt-2 text-muted-foreground">
              {count} cuenta(s)
            </div>
          </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-8 gap-3 text-muted-foreground">
          <p className="text-sm">Error al cargar cuentas</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed border-border rounded-lg bg-card">
          <p className="text-sm mb-3">No tenés cuentas creadas</p>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Crear cuenta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, i) => {
            return (
              <div
                key={account.id}
                className="relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground/40 cursor-pointer"
                onClick={() => setSelectedAccount(account)}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-[3px] ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono tracking-wide uppercase mb-2">
                      {account.name}
                    </div>
                    <div className="font-serif text-[29px] tracking-[-0.6px] leading-none mb-2">
                      {formatMoney(account.balance, account.currency)}
                    </div>
                    <div className="text-[12px] text-muted-foreground mb-1">
                      {ACCOUNT_TYPE_LABELS[account.account_type]} · {account.currency}
                    </div>
                    {!account.include_in_total && (
                      <div className="text-[11.5px] text-amber-600 mb-1">
                        Excluida del saldo total
                      </div>
                    )}
                    {account.account_type === "credit_card" && (
                      <>
                        <div className="text-[11.5px] text-muted-foreground mb-1">
                          {account.billing_period_start && account.billing_period_end
                            ? `Periodo: ${formatIsoDate(account.billing_period_start)} - ${formatIsoDate(account.billing_period_end)} · ${account.closed_period_balance != null ? formatMoney(account.closed_period_balance, account.currency) : "-"}`
                            : "Periodo sin configurar"}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground mb-1">
                          {account.payment_due_date
                            ? `Vence: ${formatIsoDate(account.payment_due_date)}`
                            : "Vencimiento sin configurar"}
                        </div>
                      </>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground/60">
                      Creada{" "}
                      {formatDateTime(account.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(account);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        openAdjust(account);
                      }}
                    >
                      <Scale className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(account);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountDetailDrawer
        key={selectedAccount?.id ?? "no-account"}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Santander, Mercado Pago..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                  Tipo
                </label>
                <select
                  value={newType}
                  onChange={(event) => {
                    const value = event.target.value as AccountTypeCode;
                    setNewType(value);
                    setNewIncludeInTotal(value === "credit_card" ? false : true);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                  Moneda
                </label>
                <select
                  value={newCurrency}
                  onChange={(event) => setNewCurrency(event.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4 rounded-lg border border-border bg-card px-3 py-2.5">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newIncludeInTotal}
                  onChange={(event) => setNewIncludeInTotal(event.target.checked)}
                  className="h-4 w-4"
                />
                Incluir en saldo total
              </label>
            </div>
            {newType === "credit_card" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Inicio periodo
                  </label>
                  <input
                    type="date"
                    value={newBillingPeriodStart}
                    onChange={(event) => setNewBillingPeriodStart(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Cierre periodo
                  </label>
                  <input
                    type="date"
                    value={newBillingPeriodEnd}
                    onChange={(event) => setNewBillingPeriodEnd(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={newPaymentDueDate}
                    onChange={(event) => setNewPaymentDueDate(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!newName.trim() || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crear cuenta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="mb-4">
              <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ej: Santander, Mercado Pago..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                  Tipo
                </label>
                <select
                  value={editType}
                  onChange={(event) => setEditType(event.target.value as AccountTypeCode)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                  Moneda
                </label>
                <select
                  value={editCurrency}
                  onChange={(event) => setEditCurrency(event.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4 rounded-lg border border-border bg-card px-3 py-2.5">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIncludeInTotal}
                  onChange={(event) => setEditIncludeInTotal(event.target.checked)}
                  className="h-4 w-4"
                />
                Incluir en saldo total
              </label>
            </div>
            {editType === "credit_card" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Inicio periodo
                  </label>
                  <input
                    type="date"
                    value={editBillingPeriodStart}
                    onChange={(event) => setEditBillingPeriodStart(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Cierre periodo
                  </label>
                  <input
                    type="date"
                    value={editBillingPeriodEnd}
                    onChange={(event) => setEditBillingPeriodEnd(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={editPaymentDueDate}
                    onChange={(event) => setEditPaymentDueDate(event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditTarget(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !editName.trim()
                  || updateMutation.isPending
                  || !editTarget
                }
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={adjustOpen}
        onOpenChange={(open) => {
          setAdjustOpen(open);
          if (!open) {
            setAdjustTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar saldo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust}>
            <div className="text-sm text-muted-foreground mb-1">
              Cuenta: <span className="text-foreground">{adjustTarget?.name}</span>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Saldo calculado: {adjustTarget ? formatMoney(adjustTarget.balance, adjustTarget.currency) : "-"}
            </div>
            <div className="mb-4">
              <label className="block text-[11.5px] text-muted-foreground font-mono tracking-wide uppercase mb-1.5">
                Saldo real actual
              </label>
              <input
                type="number"
                step="0.01"
                value={adjustBalance}
                onChange={(event) => setAdjustBalance(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none transition-colors focus:border-muted-foreground"
                autoFocus
              />
            </div>
            <div className="mb-4 rounded-lg border border-border bg-card px-3 py-2.5">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={adjustAffectsBalance}
                  onChange={(event) => setAdjustAffectsBalance(event.target.checked)}
                  className="h-4 w-4"
                />
                Afecta balance en Registros
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAdjustOpen(false);
                  setAdjustTarget(null);
                  setAdjustAffectsBalance(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={adjustMutation.isPending || !adjustTarget || parsedAdjustBalance == null}
              >
                {adjustMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Aplicar ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta "{deleteTarget?.name}". Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
