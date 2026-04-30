import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountSummary } from "@/hooks/useAccounts";
import { cn, formatCurrencyAmount } from "@/lib/utils";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import type { Account } from "@/types/transaction";

type DatePreset = "this-month" | "custom";

interface AccountDetailDrawerProps {
  account: Account | null;
  onClose: () => void;
}

interface RangeValues {
  from: string;
  to: string;
}

const PRESET_LABELS: Record<DatePreset, string> = {
  "this-month": "Este mes",
  custom: "Personalizado",
};

function toIsoDateLocal(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(): RangeValues {
  const today = new Date();
  const to = toIsoDateLocal(today);

  return {
    from: toIsoDateLocal(new Date(today.getFullYear(), today.getMonth(), 1)),
    to,
  };
}

function MetricCard({
  title,
  value,
  highlighted,
}: {
  title: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">{title}</div>
      <div
        className={cn(
          "mt-2 min-w-0 break-words font-serif text-[clamp(1rem,2.2vw,1.25rem)] leading-tight tabular-nums",
          highlighted && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function AccountDetailDrawer({ account, onClose }: AccountDetailDrawerProps) {
  const [preset, setPreset] = useState<DatePreset>("this-month");
  const [customRange, setCustomRange] = useState<RangeValues>(() => getPresetRange());

  const range = useMemo(() => {
    if (preset === "custom") {
      return customRange;
    }
    return getPresetRange();
  }, [customRange, preset]);
  const summaryQuery = useAccountSummary(account?.id ?? null, range.from, range.to);

  const { balancesVisible } = useBalanceVisibility();

  const currency = summaryQuery.data?.currency ?? account?.currency ?? "ARS";
  const isDateRangeOrderError =
    preset === "custom" &&
    summaryQuery.isError &&
    summaryQuery.error instanceof Error &&
    summaryQuery.error.message.includes("'from' date must be less than or equal to 'to' date");

  return (
    <Sheet open={Boolean(account)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{account?.name ?? "Detalle de cuenta"}</SheetTitle>
          <p className="text-sm text-muted-foreground">Resumen por periodo</p>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={preset === item ? "default" : "outline"}
                onClick={() => setPreset(item)}
              >
                {PRESET_LABELS[item]}
              </Button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="account-summary-from" className="text-sm text-muted-foreground">
                    Desde
                  </label>
                  <input
                    id="account-summary-from"
                    type="date"
                    value={customRange.from}
                    onChange={(event) =>
                      setCustomRange((prev) => ({
                        ...prev,
                        from: event.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="account-summary-to" className="text-sm text-muted-foreground">
                    Hasta
                  </label>
                  <input
                    id="account-summary-to"
                    type="date"
                    value={customRange.to}
                    onChange={(event) =>
                      setCustomRange((prev) => ({
                        ...prev,
                        to: event.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              {isDateRangeOrderError && (
                <p className="text-sm text-destructive">La fecha de inicio debe ser anterior a la fecha de fin</p>
              )}
            </div>
          )}

          {summaryQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : summaryQuery.isError && !isDateRangeOrderError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">No se pudo cargar el resumen de la cuenta.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => summaryQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  title="Ingresos"
                  value={balancesVisible ? formatCurrencyAmount(summaryQuery.data?.total_income ?? 0, currency) : "••••••"}
                />
                <MetricCard
                  title="Gastos"
                  value={balancesVisible ? formatCurrencyAmount(summaryQuery.data?.total_expenses ?? 0, currency) : "••••••"}
                />
                <MetricCard
                  title="Balance neto"
                  value={balancesVisible ? formatCurrencyAmount(summaryQuery.data?.net_balance ?? 0, currency) : "••••••"}
                  highlighted={(summaryQuery.data?.net_balance ?? 0) < 0}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {summaryQuery.data?.transaction_count ?? 0} transacciones en el período
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
