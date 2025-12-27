import type React from "react";
import { useMemo, useState } from "react";
import {
  buildExpectedCostToTarget,
  buildDistributionBuckets,
  buildChartSeries,
  buildPercentileQuantities,
  buildTargetCosts,
  forecasterData,
  probabilityToHitTarget,
  probabilityWithoutHighCost,
  runForecaster,
  type ForecasterData,
} from "./math";
import { isItemInCatalog, listItems, type ForecasterItem } from "./itemCatalog";

type AnalysisMode = "buy-all" | "target";
type DistributionScope = "all" | "cheap" | "free";

const itemCatalog = listItems();

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneDecimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const twoDecimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inputStyle =
  "w-full rounded-xl border border-slate-700 bg-neutral-900/70 px-4 py-2 text-base text-slate-100 shadow-inner focus:border-sky-500 focus:outline-none";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(Math.round(value));
}

function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return twoDecimalFormatter.format(value);
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return currencyFormatter.format(Math.round(value * 100) / 100);
}

function formatPercent(value: number): string {
  return percentFormatter.format(Math.max(0, Math.min(1, value)));
}

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-neutral-900/80 p-5 shadow-lg">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

type InputFieldProps = {
  label: string;
  helper?: string;
  children: React.ReactNode;
};

function InputField({ label, helper, children }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-neutral-900/60 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {helper ? <span className="text-xs text-slate-400">{helper}</span> : null}
      </div>
      {children}
    </label>
  );
}

type ProbabilityChartProps = {
  all: Array<{ quantity: number; probability: number }>;
  cheap: Array<{ quantity: number; probability: number }>;
  free: Array<{ quantity: number; probability: number }>;
};

function ProbabilityChart({ all, cheap, free }: ProbabilityChartProps) {
  const series = [
    { label: "All items", color: "#0ea5e9", data: all },
    { label: "Free + discounted", color: "#22d3ee", data: cheap },
    { label: "Free only", color: "#a855f7", data: free },
  ];

  const width = 640;
  const height = 320;
  const padding = 50;
  const maxQuantity = Math.max(
    all[all.length - 1]?.quantity ?? 0,
    cheap[cheap.length - 1]?.quantity ?? 0,
    free[free.length - 1]?.quantity ?? 0,
  );
  const safeMaxQuantity = maxQuantity === 0 ? 1 : maxQuantity;

  const [hoverQuantity, setHoverQuantity] = useState<number | null>(null);

  const pathForSeries = (data: Array<{ quantity: number; probability: number }>) =>
    data
      .map((point) => {
        const x = padding + (point.quantity / safeMaxQuantity) * (width - padding * 2);
        const y = height - padding - point.probability * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" L ");

  const paths = series.map((entry) => ({
    label: entry.label,
    color: entry.color,
    path: pathForSeries(entry.data),
  }));

  const xTicks = 4;
  const yTicks = 4;

  const findNearestPoint = (
    data: Array<{ quantity: number; probability: number }>,
    quantity: number,
  ) => {
    let nearest = data[0];
    let best = Number.POSITIVE_INFINITY;
    data.forEach((point) => {
      const diff = Math.abs(point.quantity - quantity);
      if (diff < best) {
        nearest = point;
        best = diff;
      }
    });
    return nearest;
  };

  const hoverInfo =
    hoverQuantity == null
      ? null
      : series.map((entry) => {
          const nearest = findNearestPoint(entry.data, hoverQuantity);
          return {
            label: entry.label,
            color: entry.color,
            point: nearest,
          };
        });

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    const rect = (event.currentTarget.parentNode as SVGSVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = (x - padding) / (width - padding * 2);
    const quantity = Math.max(0, Math.min(safeMaxQuantity, ratio * safeMaxQuantity));
    setHoverQuantity(quantity);
  };

  const handleMouseLeave = () => setHoverQuantity(null);

  return (
    <div className="space-y-3 pl-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full rounded-2xl border border-slate-800 bg-neutral-950/70 p-3 shadow-inner">
        <defs>
          <linearGradient id="probabilityGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
          </linearGradient>
      </defs>

      {/* grid lines */}
      {Array.from({ length: xTicks + 1 }).map((_, index) => {
        const x = padding + (index / xTicks) * (width - padding * 2);
        return (
          <line
            key={`x-${index}`}
            x1={x}
            x2={x}
            y1={padding}
            y2={height - padding}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth={1}
          />
        );
      })}
      {Array.from({ length: yTicks + 1 }).map((_, index) => {
        const y = padding + (index / yTicks) * (height - padding * 2);
        return (
          <line
            key={`y-${index}`}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth={1}
          />
        );
      })}

      {/* axes */}
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#94a3b8" strokeWidth={1.5} />

      {/* shaded area for all items */}
      <path
        d={`M ${padding},${height - padding} L ${paths[0].path} L ${width - padding},${height - padding} Z`}
        fill="url(#probabilityGradient)"
        stroke="none"
      />

      {/* probability lines */}
      {paths.map((line) => (
        <path
          key={line.label}
          d={`M ${line.path}`}
          fill="none"
          stroke={line.color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}

      {/* x-axis labels */}
      {Array.from({ length: xTicks + 1 }).map((_, index) => {
        const x = padding + (index / xTicks) * (width - padding * 2);
        const quantity = Math.round((index / xTicks) * safeMaxQuantity);
        return (
          <text key={`xlabel-${index}`} x={x} y={height - padding + 25} fill="#cbd5e1" fontSize={12} textAnchor="middle">
            {formatNumber(quantity)}
          </text>
        );
      })}

      {/* y-axis labels */}
      {Array.from({ length: yTicks + 1 }).map((_, index) => {
        const y = height - padding - (index / yTicks) * (height - padding * 2);
        const probability = index / yTicks;
        return (
          <text key={`ylabel-${index}`} x={padding - 15} y={y + 4} fill="#cbd5e1" fontSize={12} textAnchor="end">
            {oneDecimalFormatter.format(probability * 100)}%
          </text>
        );
      })}

      <text x={width / 2} y={height - 10} fill="#cbd5e1" fontSize={12} textAnchor="middle">
        Quantity obtained
      </text>
      <text x={padding - 45} y={height / 2} fill="#cbd5e1" fontSize={12} textAnchor="middle" transform={`rotate(-90 ${padding - 45},${height / 2})`}>
        P(quantity ≥ X)
      </text>

      {/* hover cursor */}
      {hoverInfo && (
        <>
          <line
            x1={padding + (hoverInfo[0].point.quantity / safeMaxQuantity) * (width - padding * 2)}
            x2={padding + (hoverInfo[0].point.quantity / safeMaxQuantity) * (width - padding * 2)}
            y1={padding}
            y2={height - padding}
            stroke="rgba(148, 163, 184, 0.5)"
            strokeDasharray="4 4"
          />
          {hoverInfo.map((entry) => {
            const cx = padding + (entry.point.quantity / safeMaxQuantity) * (width - padding * 2);
            const cy = height - padding - entry.point.probability * (height - padding * 2);
            return (
              <g key={entry.label}>
                <circle cx={cx} cy={cy} r={5} fill={entry.color} stroke="#0b1220" strokeWidth={2} />
              </g>
            );
          })}
          <rect
            x={padding + 10}
            y={padding + 10}
            width={180}
            height={20 + hoverInfo.length * 20}
            rx={10}
            ry={10}
            fill="rgba(15, 23, 42, 0.9)"
            stroke="rgba(226, 232, 240, 0.2)"
          />
          <text x={padding + 20} y={padding + 30} fill="#cbd5e1" fontSize={12} fontWeight={600}>
            Qty ~ {formatNumber(hoverInfo[0].point.quantity)}
          </text>
          {hoverInfo.map((entry, index) => (
            <text
              key={entry.label}
              x={padding + 20}
              y={padding + 50 + index * 18}
              fill={entry.color}
              fontSize={12}
            >
              {entry.label}: {oneDecimalFormatter.format(entry.point.probability * 100)}%
            </text>
          ))}
        </>
      )}

      {/* hover capture */}
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      </svg>

      <div className="flex flex-wrap items-center justify-end gap-3 px-3 text-sm text-slate-200">
        {series.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlackMarketForecasterPage() {
  const [selectedItem, setSelectedItem] = useState<ForecasterItem>(itemCatalog[0]);
  const [eventDays, setEventDays] = useState<number>(forecasterData.eventLengthDays ?? 28);
  const [refreshesPerDay, setRefreshesPerDay] = useState<number>(8);
  const [startingCurrency, setStartingCurrency] = useState<number>(1500);
  const [dailyIncome, setDailyIncome] = useState<number>(300);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("buy-all");
  const [targetQuantity, setTargetQuantity] = useState<number>(100);
  const [distributionScope, setDistributionScope] = useState<DistributionScope>("all");
  const [limitByCash, setLimitByCash] = useState<boolean>(false);

  const setsPerEvent = eventDays * refreshesPerDay;
  const availableCash = startingCurrency + dailyIncome * eventDays;

  const results = useMemo(
    () =>
      runForecaster({
        itemId: selectedItem.id,
        setsPerEvent,
        targetQuantity: analysisMode === "target" ? targetQuantity : undefined,
      }),
    [selectedItem.id, setsPerEvent, analysisMode, targetQuantity],
  );

  const costPerUnit = results.mean > 0 ? results.expectedCost / results.mean : 0;

  const paidCostAll = results.discountedCost + results.regularCost;
  const paidCostCheap = results.discountedCost;
  const factorAll = !limitByCash || paidCostAll === 0 ? 1 : Math.min(1, availableCash / paidCostAll);
  const factorCheap = !limitByCash || paidCostCheap === 0 ? 1 : Math.min(1, availableCash / paidCostCheap);
  const isCappedAll = factorAll < 1;
  const isCappedCheap = factorCheap < 1;

  const cappedMeanAll = results.freeMean + factorAll * (results.discountedMean + results.regularMean);
  const cappedVarianceAll = results.freeVariance + factorAll * (results.discountedVariance + results.regularVariance);
  const cappedCostAll = factorAll * paidCostAll;

  const cappedMeanCheap = results.freeMean + factorCheap * results.discountedMean;
  const cappedVarianceCheap = results.freeVariance + factorCheap * results.discountedVariance;
  const cappedCostCheap = factorCheap * paidCostCheap;

  const cappedCostPerUnit = cappedMeanAll > 0 ? cappedCostAll / cappedMeanAll : 0;
  const percentileQuantities = useMemo(
    () => buildPercentileQuantities(results.mean, results.variance),
    [results.mean, results.variance],
  );

  const percentileCosts = useMemo(
    () =>
      buildTargetCosts(
        targetQuantity,
        limitByCash ? cappedCostAll : results.expectedCost,
        percentileQuantities,
        results.highCostPurchase,
      ),
    [targetQuantity, limitByCash, cappedCostAll, results.expectedCost, percentileQuantities, results.highCostPurchase],
  );

  const expectedCostToTarget = useMemo(
    () =>
      buildExpectedCostToTarget(
        targetQuantity,
        limitByCash ? cappedMeanAll : results.mean,
        limitByCash ? cappedCostAll : results.expectedCost,
        results.highCostPurchase,
      ),
    [limitByCash, cappedMeanAll, cappedCostAll, results.expectedCost, results.highCostPurchase, results.mean, targetQuantity],
  );

  const probabilityWithoutExpensive = useMemo(
    () =>
      probabilityWithoutHighCost(
        targetQuantity,
        limitByCash ? cappedMeanCheap : results.cheapMean,
        limitByCash ? cappedVarianceCheap : results.cheapVariance,
      ),
    [limitByCash, cappedMeanCheap, cappedVarianceCheap, results.cheapMean, results.cheapVariance, targetQuantity],
  );

  const probabilityAllSources = useMemo(
    () =>
      probabilityToHitTarget(
        targetQuantity,
        limitByCash ? cappedMeanAll : results.mean,
        limitByCash ? cappedVarianceAll : results.variance,
      ),
    [limitByCash, cappedMeanAll, cappedVarianceAll, results.mean, results.variance, targetQuantity],
  );

  const distributionBuckets = useMemo(() => {
    if (distributionScope === "free") {
      return buildDistributionBuckets(results.freeMean, results.freeVariance, targetQuantity);
    }
    if (distributionScope === "cheap") {
      return buildDistributionBuckets(
        limitByCash ? cappedMeanCheap : results.cheapMean,
        limitByCash ? cappedVarianceCheap : results.cheapVariance,
        targetQuantity,
      );
    }
    return buildDistributionBuckets(
      limitByCash ? cappedMeanAll : results.mean,
      limitByCash ? cappedVarianceAll : results.variance,
      targetQuantity,
    );
  }, [
    distributionScope,
    limitByCash,
    results.freeMean,
    results.freeVariance,
    results.cheapMean,
    results.cheapVariance,
    results.mean,
    results.variance,
    cappedMeanCheap,
    cappedVarianceCheap,
    cappedMeanAll,
    cappedVarianceAll,
    targetQuantity,
  ]);

  const distributionCappedWarning = (distributionScope === "cheap" && isCappedCheap) || (distributionScope === "all" && isCappedAll);

  const chartAll = useMemo(
    () => buildChartSeries(limitByCash ? cappedMeanAll : results.mean, limitByCash ? cappedVarianceAll : results.variance, targetQuantity),
    [limitByCash, cappedMeanAll, cappedVarianceAll, results.mean, results.variance, targetQuantity],
  );
  const chartCheap = useMemo(
    () => buildChartSeries(limitByCash ? cappedMeanCheap : results.cheapMean, limitByCash ? cappedVarianceCheap : results.cheapVariance, targetQuantity),
    [limitByCash, cappedMeanCheap, cappedVarianceCheap, results.cheapMean, results.cheapVariance, targetQuantity],
  );
  const chartFree = useMemo(
    () => buildChartSeries(results.freeMean, results.freeVariance, targetQuantity),
    [results.freeMean, results.freeVariance, targetQuantity],
  );

  const discountedUnitCost = results.discountedMean > 0 ? results.discountedCost / results.discountedMean : 0;
  const regularUnitCost = results.regularMean > 0 ? results.regularCost / results.regularMean : 0;

  const discountedCap = limitByCash ? factorCheap * results.discountedMean : results.discountedMean;
  const regularCap = limitByCash ? factorAll * results.regularMean : results.regularMean;

  const freeQtyUsed = Math.min(targetQuantity, results.freeMean);
  const remainingAfterFree = Math.max(0, targetQuantity - freeQtyUsed);
  const discountedQtyUsed = Math.min(remainingAfterFree, discountedCap);
  const remainingAfterDiscounted = Math.max(0, remainingAfterFree - discountedQtyUsed);
  const regularQtyUsed = Math.min(remainingAfterDiscounted, regularCap);
  const optimalCostTotal = discountedQtyUsed * discountedUnitCost + regularQtyUsed * regularUnitCost;
  const optimalUnfilled = Math.max(0, remainingAfterDiscounted - regularQtyUsed);

  const affordabilityNote = availableCash >= results.expectedCost
    ? "Covers expected Black Market Cash if you buy every appearance."
    : "Expected spend exceeds available Black Market Cash."

  return (
    <div className="space-y-8 text-left">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Season {forecasterData.season}</p>
        <h1 className="text-3xl font-bold text-slate-100">Black Market Forecaster</h1>
        <p className="text-lg text-slate-300">
          Deterministic math for the Last War Black Market. Pick an item, set income and duration, and
          explore expected value, variance, and confidence bands without simulations.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-neutral-900/70 p-6 shadow-lg">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Item" helper="Season 1 catalog (tap to select)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 max-h-72 overflow-y-auto pr-1">
              {itemCatalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={
                    "group flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition " +
                    (selectedItem.id === item.id
                      ? "border-sky-400 bg-sky-500/15 text-sky-100 shadow"
                      : "border-slate-700 bg-neutral-900/70 text-slate-200 hover:border-sky-500/70")
                  }
                >
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg bg-neutral-800 object-contain p-1 shadow-inner"
                    loading="lazy"
                    onError={(event) => {
                      if (!isItemInCatalog(item.id)) return;
                      event.currentTarget.style.opacity = "0.3";
                    }}
                  />
                  <span className="text-center leading-tight group-hover:text-sky-100">{item.name}</span>
                </button>
              ))}
            </div>
          </InputField>

          <InputField label="Analysis mode" helper="Expected value vs target budgeting">
            <div className="flex gap-3">
              {(["buy-all", "target"] as AnalysisMode[]).map((mode) => (
                <button
                  key={mode}
                  className={
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition " +
                    (analysisMode === mode
                      ? "border-sky-400 bg-sky-500/20 text-sky-100 shadow"
                      : "border-slate-700 bg-neutral-900/70 text-slate-200 hover:border-sky-500/70")
                  }
                  onClick={() => setAnalysisMode(mode)}
                  type="button"
                >
                  {mode === "buy-all" ? "Buy everything shown" : "Target quantity"}
                </button>
              ))}
            </div>
            {analysisMode === "target" ? (
              <div className="mt-3">
                <label className="text-sm text-slate-300">Target quantity</label>
                <input
                  className={inputStyle + " mt-1"}
                  type="number"
                  min={0}
                  value={targetQuantity}
                  onChange={(event) => setTargetQuantity(Number(event.target.value) || 0)}
                />
              </div>
            ) : null}
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={limitByCash}
                onChange={(event) => setLimitByCash(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-neutral-900 text-sky-500 focus:ring-sky-500"
              />
              <span>Limit item quantity based on available Black Market Cash</span>
            </label>
          </InputField>

          <InputField label="Event duration" helper="Days">
            <input
              className={inputStyle}
              type="number"
              min={1}
              value={eventDays}
              onChange={(event) => setEventDays(Math.max(1, Number(event.target.value) || 0))}
            />
          </InputField>

          <InputField label="Refreshes per day" helper="Slot sets per day">
            <input
              className={inputStyle}
              type="number"
              min={1}
              value={refreshesPerDay}
              onChange={(event) => setRefreshesPerDay(Math.max(1, Number(event.target.value) || 0))}
            />
          </InputField>

          <InputField label="Starting currency" helper="Black Market Cash on hand">
            <input
              className={inputStyle}
              type="number"
              min={0}
              value={startingCurrency}
              onChange={(event) => setStartingCurrency(Math.max(0, Number(event.target.value) || 0))}
            />
          </InputField>

          <InputField label="Daily income" helper="Black Market Cash per day">
            <input
              className={inputStyle}
              type="number"
              min={0}
              value={dailyIncome}
              onChange={(event) => setDailyIncome(Math.max(0, Number(event.target.value) || 0))}
            />
            <p className="text-sm text-slate-400">
              Available Black Market Cash over the event: {formatCurrency(availableCash)}.
            </p>
          </InputField>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Expected quantity"
            value={formatDecimal(cappedMeanAll)}
            helper={
              isCappedAll
                ? "Capped by available Black Market Cash."
                : `${formatDecimal(results.expectedAppearances)} expected appearances`
            }
          />
          {analysisMode === "target" ? (
            <div className="rounded-2xl border border-slate-800 bg-neutral-900/80 p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Optimal Cost</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{formatCurrency(optimalCostTotal)}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                <p>{formatNumber(Math.round(freeQtyUsed))} Free = {formatCurrency(0)}</p>
                <p>{formatNumber(Math.round(discountedQtyUsed))} Discounted = {formatCurrency(discountedQtyUsed * discountedUnitCost)}</p>
                <p>{formatNumber(Math.round(regularQtyUsed))} Regular = {formatCurrency(regularQtyUsed * regularUnitCost)}</p>
                {optimalUnfilled > 0 ? (
                  <p className="text-amber-300">Unfilled quantity: {formatNumber(Math.round(optimalUnfilled))}</p>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {isCappedAll || isCappedCheap ? "Capped by available Black Market Cash." : "Uses expected odds; free, then discounted, then regular slots."}
              </p>
            </div>
          ) : (
            <StatCard
              label="Expected cost"
              value={formatCurrency(cappedCostAll)}
              helper={isCappedAll ? "Capped by available Black Market Cash." : affordabilityNote}
            />
          )}
          <StatCard
            label="Cost per unit"
            value={cappedMeanAll > 0 ? formatCurrency(cappedCostPerUnit) : "—"}
            helper={analysisMode === "target" ? `Target: ${formatNumber(targetQuantity)}` : "Pure EV"}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-neutral-900/70 shadow-lg">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Summary</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-neutral-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Metric</th>
                  <th className="px-5 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100">
                {[{
                  metric: "Total items shown",
                  value: formatNumber(results.totalSlotRolls),
                }, {
                  metric: "Expected appearances",
                  value: formatDecimal(results.expectedAppearances),
                }, {
                  metric: "Expected quantity",
                  value: formatDecimal(results.mean),
                }, {
                  metric: "Expected cost",
                  value: formatCurrency(results.expectedCost),
                }, {
                  metric: "Cost per unit",
                  value: results.mean > 0 ? formatCurrency(costPerUnit) : "—",
                }].map((row) => (
                  <tr key={row.metric}>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-200">{row.metric}</td>
                    <td className="px-5 py-3 text-sm text-slate-100">{row.value}</td>
                  </tr>
                ))}

                {analysisMode === "target" ? (
                  <>
                    <tr>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-200">Target quantity</td>
                      <td className="px-5 py-3 text-sm text-slate-100">{formatNumber(targetQuantity)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-200">Probability without high-cost slots</td>
                      <td className="px-5 py-3 text-sm text-slate-100">{formatPercent(probabilityWithoutExpensive)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-200">Probability with all slots</td>
                      <td className="px-5 py-3 text-sm text-slate-100">{formatPercent(probabilityAllSources)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-200">Expected cost to reach target</td>
                      <td className="px-5 py-3 text-sm text-slate-100">{formatCurrency(expectedCostToTarget)}</td>
                    </tr>
                    {percentileCosts.map((entry) => (
                      <tr key={entry.percentile}>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-200">
                          Cost for {entry.percentile}th percentile
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-100">
                          {formatCurrency(entry.cost)} (quantity ≈ {formatNumber(entry.quantity)})
                        </td>
                      </tr>
                    ))}
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-neutral-900/70 shadow-lg">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Probability distribution</p>
                <p className="text-sm text-slate-400">Normal approximation of the combined binomials.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scope</label>
                <select
                  className="rounded-lg border border-slate-700 bg-neutral-900/70 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
                  value={distributionScope}
                  onChange={(event) => setDistributionScope(event.target.value as DistributionScope)}
                >
                  <option value="free">Free only</option>
                  <option value="cheap">Free + discounted</option>
                  <option value="all">All items</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="bg-neutral-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Quantity range</th>
                  <th className="px-5 py-3">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100">
                {distributionBuckets.map((bucket) => (
                  <tr key={bucket.label}>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-200">{bucket.label}</td>
                    <td className="px-5 py-3 text-sm text-slate-100">{formatPercent(bucket.probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {distributionCappedWarning ? (
              <p className="px-5 pb-4 pt-2 text-xs text-amber-300">
                Probabilities reflect caps based on available Black Market Cash.
              </p>
            ) : null}
          </div>
        </div>

          <div className="rounded-2xl border border-slate-800 bg-neutral-900/70 shadow-lg">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cumulative probability</p>
            <p className="text-sm text-slate-400">P(quantity ≥ X) using normal CDF with continuity correction.</p>
          </div>
          <div className="p-4">
            <ProbabilityChart all={chartAll} cheap={chartCheap} free={chartFree} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-neutral-900/60 p-5 shadow-inner">
        <p className="text-sm text-slate-400">
          Assumptions: slots are independent, rates come from the static Season 1 table, and calculations are
          deterministic (no Monte Carlo). Costs are treated as conditional on the item appearing in a slot.
        </p>
      </section>
    </div>
  );
}
