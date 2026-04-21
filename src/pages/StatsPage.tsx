import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/useStats";
import { formatCurrencyAmount } from "@/lib/utils";
import type { StatsCategoryExpenseItem } from "@/types/stats";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#cc7a2f",
  "#7a5ccf",
  "#3a8f84",
  "#d95f5f",
  "#5f78d9",
];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function formatShortMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("es-AR", { month: "short" });
}

function formatPercent(delta: number): string {
  const arrow = delta >= 0 ? "↑" : "↓";
  const value = Math.abs(delta).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${arrow} ${value}%`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("es-AR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function tooltipCurrencyFormatter(value: ValueType | undefined): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const amount = Number(rawValue);
  if (!Number.isFinite(amount)) {
    return "-";
  }
  return formatCurrencyAmount(amount, "ARS");
}

function getDeltaClasses(metric: "income" | "expenses" | "balance", delta: number): string {
  const wentUp = delta > 0;
  const isGood = metric === "expenses" ? !wentUp : wentUp;
  return isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
}

function MetricCard({
  label,
  total,
  delta,
  metric,
}: {
  label: string;
  total: number;
  delta: number | null;
  metric: "income" | "expenses" | "balance";
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold leading-tight break-words">{formatCurrencyAmount(total, "ARS")}</p>
      {delta !== null && (
        <p className={`mt-1 text-sm font-medium ${getDeltaClasses(metric, delta)}`}>
          {formatPercent(delta)}
        </p>
      )}
    </article>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-36" />
          <Skeleton className="mt-2 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-4 h-5 w-48" />
          <Skeleton className="h-[280px] w-full" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-4 h-5 w-48" />
          <Skeleton className="h-[280px] w-full" />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <Skeleton className="mb-4 h-5 w-56" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    </>
  );
}

function StatsCharts({
  expensesByCategory,
  monthlySeries,
}: {
  expensesByCategory: StatsCategoryExpenseItem[];
  monthlySeries: Array<{
    month: string;
    total_income: number;
    total_expenses: number;
    net_balance: number;
  }>;
}) {
  const lineAndBarData = useMemo(
    () =>
      monthlySeries.map((item) => ({
        ...item,
        label: formatShortMonthLabel(item.month),
      })),
    [monthlySeries],
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Evolución de 6 meses</h2>
          <div className="mt-4 h-[250px] w-full md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineAndBarData}
                margin={{ top: 8, right: 12, left: 18, bottom: 8 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" />
                <YAxis
                  stroke="var(--muted-foreground)"
                  width={52}
                  tickFormatter={(value: number) => formatCompactNumber(value)}
                />
                <Tooltip
                  formatter={tooltipCurrencyFormatter}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--card)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line name="Ingresos" type="monotone" dataKey="total_income" stroke="var(--chart-1)" strokeWidth={2} />
                <Line name="Gastos" type="monotone" dataKey="total_expenses" stroke="var(--chart-5)" strokeWidth={2} />
                <Line name="Balance neto" type="monotone" dataKey="net_balance" stroke="var(--chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Gastos por categoría</h2>
          {expensesByCategory.length === 0 ? (
            <div className="mt-4 flex h-[250px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground md:h-[280px]">
              No hay gastos por categoría este mes.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="h-[220px] w-full md:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={tooltipCurrencyFormatter}
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--card)",
                    }}
                  />
                  <Pie
                    data={expensesByCategory}
                    dataKey="total"
                    nameKey="category_name"
                    innerRadius="50%"
                    outerRadius="78%"
                    paddingAngle={2}
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1 md:max-h-[160px]">
                {expensesByCategory.map((item, index) => (
                  <div key={item.category_name} className="flex items-start gap-2 text-xs">
                    <span
                      className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.category_name}</p>
                      <p className="text-muted-foreground">
                        {formatCurrencyAmount(item.total, "ARS")} ({item.percentage.toLocaleString("es-AR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Ingresos vs gastos por mes</h2>
        <div className="mt-4 h-[280px] w-full md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={lineAndBarData}
              margin={{ top: 8, right: 12, left: 18, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" />
              <YAxis
                stroke="var(--muted-foreground)"
                width={52}
                tickFormatter={(value: number) => formatCompactNumber(value)}
              />
              <Tooltip
                formatter={tooltipCurrencyFormatter}
                contentStyle={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--card)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Ingresos" dataKey="total_income" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
              <Bar name="Gastos" dataKey="total_expenses" fill="var(--chart-5)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}

export default function StatsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, isLoading, isError, refetch, isFetching } = useStats(month);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((prev) => shiftMonth(prev, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-semibold capitalize">{formatMonthLabel(month)}</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((prev) => shiftMonth(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Actualizando...</span>}
      </div>

      {isError ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>No pudimos cargar las estadísticas.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : isLoading || !data ? (
        <>
          <CardsSkeleton />
          <div className="mt-4">
            <ChartsSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard
              label="Balance neto"
              total={data.summary.net_balance}
              delta={data.summary.net_balance_delta_pct}
              metric="balance"
            />
            <MetricCard
              label="Gastos"
              total={data.summary.total_expenses}
              delta={data.summary.expenses_delta_pct}
              metric="expenses"
            />
            <MetricCard
              label="Ingresos"
              total={data.summary.total_income}
              delta={data.summary.income_delta_pct}
              metric="income"
            />
          </div>

          <div className="mt-4">
            <StatsCharts
              expensesByCategory={data.expenses_by_category}
              monthlySeries={data.monthly_series}
            />
          </div>
        </>
      )}
    </div>
  );
}
