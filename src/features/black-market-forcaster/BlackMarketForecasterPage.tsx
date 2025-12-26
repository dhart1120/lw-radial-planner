import type React from "react";
import { useMemo, useState } from "react";
import {
  buildExpectedCostToTarget,
  buildPercentileQuantities,
  buildTargetCosts,
  forecasterData,
  probabilityToHitTarget,
  probabilityWithoutHighCost,
  runForecaster,
  type ForecasterData,
} from "./math";

type AnalysisMode = "buy-all" | "target";

type SupportedItem = {
  id: string;
  dataItemId: keyof ForecasterData["items"];
  label: string;
  description: string;
};

const supportedItems: SupportedItem[] = [
  {
    id: "ew-choice-shards",
    dataItemId: "hero_weapon_shard_choice_chest_ii",
    label: "EW Choice Shards (Season 1)",
    description: "Exclusive Weapon shard choice chest odds across free, discounted, and regular slots.",
  },
  {
    id: "ur-hero-shards",
    dataItemId: "ur_hero_shard",
    label: "UR Hero Shards",
    description: "Baseline UR shard drops used by alliance planners and budget watchers.",
  },
];

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneDecimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const twoDecimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

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
  data: Array<{ quantity: number; probability: number }>;
};

function ProbabilityChart({ data }: ProbabilityChartProps) {
  const width = 640;
  const height = 320;
  const padding = 50;
  const maxQuantity = data[data.length - 1]?.quantity ?? 0;
  const safeMaxQuantity = maxQuantity === 0 ? 1 : maxQuantity;

  const path = data
    .map((point) => {
      const x = padding + (point.quantity / safeMaxQuantity) * (width - padding * 2);
      const y = height - padding - point.probability * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" L ");

  const xTicks = 4;
  const yTicks = 4;

  return (
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

      {/* shaded area */}
      <path
        d={`M ${padding},${height - padding} L ${path} L ${width - padding},${height - padding} Z`}
        fill="url(#probabilityGradient)"
        stroke="none"
      />

      {/* probability line */}
      <path d={`M ${path}`} fill="none" stroke="#0ea5e9" strokeWidth={3} strokeLinecap="round" />

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
      <text x={padding - 35} y={height / 2} fill="#cbd5e1" fontSize={12} textAnchor="middle" transform={`rotate(-90 ${padding - 35},${height / 2})`}>
        P(quantity ≥ X)
      </text>
    </svg>
  );
}

export function BlackMarketForecasterPage() {
  const [selectedItem, setSelectedItem] = useState<SupportedItem>(supportedItems[0]);
  const [eventDays, setEventDays] = useState<number>(forecasterData.eventLengthDays ?? 28);
  const [refreshesPerDay, setRefreshesPerDay] = useState<number>(8);
  const [startingCurrency, setStartingCurrency] = useState<number>(0);
  const [dailyIncome, setDailyIncome] = useState<number>(300);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("buy-all");
  const [targetQuantity, setTargetQuantity] = useState<number>(100);

  const setsPerEvent = eventDays * refreshesPerDay;
  const availableCash = startingCurrency + dailyIncome * eventDays;

  const results = useMemo(
    () =>
      runForecaster({
        itemId: selectedItem.dataItemId,
        setsPerEvent,
        targetQuantity: analysisMode === "target" ? targetQuantity : undefined,
      }),
    [selectedItem.dataItemId, setsPerEvent, analysisMode, targetQuantity],
  );

  const costPerUnit = results.mean > 0 ? results.expectedCost / results.mean : 0;
  const percentileQuantities = useMemo(
    () => buildPercentileQuantities(results.mean, results.variance),
    [results.mean, results.variance],
  );

  const percentileCosts = useMemo(
    () =>
      buildTargetCosts(
        targetQuantity,
        results.expectedCost,
        percentileQuantities,
        results.highCostPurchase,
      ),
    [targetQuantity, results.expectedCost, percentileQuantities, results.highCostPurchase],
  );

  const expectedCostToTarget = useMemo(
    () =>
      buildExpectedCostToTarget(
        targetQuantity,
        results.mean,
        results.expectedCost,
        results.highCostPurchase,
      ),
    [results.expectedCost, results.highCostPurchase, results.mean, targetQuantity],
  );

  const probabilityWithoutExpensive = useMemo(
    () => probabilityWithoutHighCost(targetQuantity, results.cheapMean, results.cheapVariance),
    [results.cheapMean, results.cheapVariance, targetQuantity],
  );

  const probabilityAllSources = useMemo(
    () => probabilityToHitTarget(targetQuantity, results.mean, results.variance),
    [results.mean, results.variance, targetQuantity],
  );

  const affordabilityNote = availableCash >= results.expectedCost
    ? "Covers expected spend if you buy every appearance."
    : "Expected spend exceeds available currency."

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
          <InputField label="Item" helper="Hardcoded Season 1 odds">
            <select
              className={inputStyle}
              value={selectedItem.id}
              onChange={(event) => {
                const next = supportedItems.find((item) => item.id === event.target.value);
                if (next) setSelectedItem(next);
              }}
            >
              {supportedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-400">{selectedItem.description}</p>
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

          <InputField label="Starting currency" helper="Coins on hand">
            <input
              className={inputStyle}
              type="number"
              min={0}
              value={startingCurrency}
              onChange={(event) => setStartingCurrency(Math.max(0, Number(event.target.value) || 0))}
            />
          </InputField>

          <InputField label="Daily income" helper="Coins gained per day">
            <input
              className={inputStyle}
              type="number"
              min={0}
              value={dailyIncome}
              onChange={(event) => setDailyIncome(Math.max(0, Number(event.target.value) || 0))}
            />
            <p className="text-sm text-slate-400">
              Available currency over the event: {formatNumber(availableCash)}.
            </p>
          </InputField>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Expected quantity"
            value={formatDecimal(results.mean)}
            helper={`${formatDecimal(results.expectedAppearances)} expected appearances`}
          />
          <StatCard
            label="Expected cost"
            value={`${formatNumber(results.expectedCost)} coins`}
            helper={affordabilityNote}
          />
          <StatCard
            label="Cost per unit"
            value={results.mean > 0 ? formatDecimal(costPerUnit) : "—"}
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
                  metric: "Total slot rolls",
                  value: formatNumber(results.totalSlotRolls),
                }, {
                  metric: "Expected appearances",
                  value: formatDecimal(results.expectedAppearances),
                }, {
                  metric: "Expected quantity",
                  value: formatDecimal(results.mean),
                }, {
                  metric: "Expected cost",
                  value: `${formatNumber(results.expectedCost)} coins`,
                }, {
                  metric: "Cost per unit",
                  value: results.mean > 0 ? `${formatDecimal(costPerUnit)} coins` : "—",
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
                      <td className="px-5 py-3 text-sm text-slate-100">{formatNumber(expectedCostToTarget)} coins</td>
                    </tr>
                    {percentileCosts.map((entry) => (
                      <tr key={entry.percentile}>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-200">
                          Cost for {entry.percentile}th percentile
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-100">
                          {formatNumber(entry.cost)} coins (quantity ≈ {formatNumber(entry.quantity)})
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
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Probability distribution</p>
            <p className="text-sm text-slate-400">Normal approximation of the combined binomials.</p>
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
                {results.buckets.map((bucket) => (
                  <tr key={bucket.label}>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-200">{bucket.label}</td>
                    <td className="px-5 py-3 text-sm text-slate-100">{formatPercent(bucket.probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-neutral-900/70 shadow-lg">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cumulative probability</p>
            <p className="text-sm text-slate-400">P(quantity ≥ X) using normal CDF with continuity correction.</p>
          </div>
          <div className="p-4">
            <ProbabilityChart data={results.chart} />
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
