import forecasterData from "./data.json";

export type ForecasterData = typeof forecasterData;

type TierId = keyof typeof forecasterData.tiers;

type ItemOccurrence = {
  tier: TierId;
  rolls: number;
  probability: number;
  quantity: number;
  cost: number;
};

type Moments = {
  mean: number;
  variance: number;
  expectedCost: number;
  expectedAppearances: number;
};

const Z_SCORES: Record<number, number> = {
  50: 0,
  75: 0.674,
  90: 1.282,
};

function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const sign = Math.sign(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const poly = (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t);
  const expComponent = Math.exp(-absX * absX);

  return sign * (1 - poly * expComponent);
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function safeProbability(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function probabilityAtLeast(target: number, mean: number, sigma: number): number {
  if (sigma === 0) {
    return mean >= target ? 1 : 0;
  }

  const z = (target - mean) / sigma;
  return safeProbability(1 - normalCdf(z));
}

function probabilityBetween(
  lowerInclusive: number,
  upperInclusive: number,
  mean: number,
  sigma: number,
): number {
  if (sigma === 0) {
    return mean >= lowerInclusive && mean <= upperInclusive ? 1 : 0;
  }

  const upperZ = (upperInclusive + 0.5 - mean) / sigma;
  const lowerZ = (lowerInclusive - 0.5 - mean) / sigma;

  return safeProbability(normalCdf(upperZ) - normalCdf(lowerZ));
}

function percentileQuantity(percentile: number, mean: number, sigma: number): number {
  const z = Z_SCORES[percentile] ?? 0;
  const raw = mean + z * sigma;
  return Math.max(0, Math.round(raw));
}

function selectHighCostPurchase(occurrences: ItemOccurrence[]): { cost: number; quantity: number } | null {
  return occurrences.reduce<{ cost: number; quantity: number } | null>((current, occ) => {
    if (!current || occ.cost > current.cost) {
      return { cost: occ.cost, quantity: occ.quantity };
    }
    return current;
  }, null);
}

function calculateMoments(
  occurrences: ItemOccurrence[],
  filter?: (occurrence: ItemOccurrence) => boolean,
): Moments {
  const relevant = filter ? occurrences.filter(filter) : occurrences;

  return relevant.reduce<Moments>(
    (acc, occ) => {
      const expectedHits = occ.rolls * occ.probability;
      acc.mean += expectedHits * occ.quantity;
      acc.expectedAppearances += expectedHits;
      acc.expectedCost += expectedHits * occ.cost;
      acc.variance += occ.rolls * occ.probability * (1 - occ.probability) * occ.quantity * occ.quantity;
      return acc;
    },
    { mean: 0, variance: 0, expectedCost: 0, expectedAppearances: 0 },
  );
}

function buildOccurrences(itemId: string, setsPerEvent: number): ItemOccurrence[] {
  const tiers = forecasterData.tiers;
  const tierIds = Object.keys(tiers) as TierId[];

  const occurrences: ItemOccurrence[] = [];

  tierIds.forEach((tierId) => {
    const tier = tiers[tierId];
    const rolls = setsPerEvent * tier.slots;

    tier.odds.forEach((odds) => {
      if (odds.itemId !== itemId) return;

      occurrences.push({
        tier: tierId,
        rolls,
        probability: odds.rate / 100,
        quantity: odds.quantity,
        cost: odds.cost,
      });
    });
  });

  return occurrences;
}

function chooseRangeStep(anchor: number): number {
  const candidates = [5, 10, 25, 50, 100, 250, 500, 1000];
  const targetBuckets = 4;

  for (const step of candidates) {
    if (anchor / step <= targetBuckets) {
      return step;
    }
  }

  return 2000;
}

function buildProbabilityBuckets(
  mean: number,
  sigma: number,
  target?: number,
): { label: string; probability: number }[] {
  const anchor = Math.max(target ?? 0, mean + 2 * sigma, 10);
  const step = chooseRangeStep(anchor);

  const bounds = [step, step * 2, step * 3];
  const buckets: { label: string; probability: number }[] = [];

  let lower = 0;
  bounds.forEach((upper) => {
    const probability = probabilityBetween(lower, upper, mean, sigma);
    buckets.push({
      label: `${lower}–${upper}`,
      probability,
    });
    lower = upper + 1;
  });

  buckets.push({
    label: `${lower}+`,
    probability: probabilityAtLeast(lower, mean, sigma),
  });

  return buckets;
}

function buildChartPoints(mean: number, sigma: number, target?: number): Array<{ quantity: number; probability: number }> {
  const maxQuantity = Math.max(mean + 3 * sigma, target ?? 0, 30);
  const safeMax = Number.isFinite(maxQuantity) ? maxQuantity : mean;
  const step = Math.max(1, Math.round(safeMax / 50));

  const data: Array<{ quantity: number; probability: number }> = [];
  for (let quantity = 0; quantity <= safeMax; quantity += step) {
    const probability = probabilityAtLeast(quantity, mean, sigma);
    data.push({ quantity: Math.round(quantity), probability });
  }

  if (data.length === 0) {
    data.push({ quantity: 0, probability: 1 });
  }

  return data;
}

export type ForecasterInputs = {
  itemId: keyof ForecasterData["items"];
  setsPerEvent: number;
  targetQuantity?: number;
};

export type ForecasterResults = {
  totalSlotRolls: number;
  mean: number;
  variance: number;
  expectedCost: number;
  expectedAppearances: number;
  freeMean: number;
  freeVariance: number;
  cheapMean: number;
  cheapVariance: number;
  cheapCost: number;
  highCostPurchase: { cost: number; quantity: number } | null;
  buckets: { label: string; probability: number }[];
  chartAll: Array<{ quantity: number; probability: number }>;
  chartCheap: Array<{ quantity: number; probability: number }>;
  chartFree: Array<{ quantity: number; probability: number }>;
};

export function runForecaster(inputs: ForecasterInputs): ForecasterResults {
  const occurrences = buildOccurrences(inputs.itemId, inputs.setsPerEvent);

  const totalSlotRolls = Object.values(forecasterData.tiers).reduce(
    (sum, tier) => sum + tier.slots * inputs.setsPerEvent,
    0,
  );

  const primaryMoments = calculateMoments(occurrences);
  const cheapMoments = calculateMoments(occurrences, (occ) => occ.tier !== "regular");
  const freeMoments = calculateMoments(occurrences, (occ) => occ.tier === "free");

  const sigmaAll = Math.sqrt(primaryMoments.variance);
  const sigmaCheap = Math.sqrt(cheapMoments.variance);
  const sigmaFree = Math.sqrt(freeMoments.variance);

  const buckets = buildProbabilityBuckets(primaryMoments.mean, sigmaAll, inputs.targetQuantity);
  const chartAll = buildChartPoints(primaryMoments.mean, sigmaAll, inputs.targetQuantity);
  const chartCheap = buildChartPoints(cheapMoments.mean, sigmaCheap, inputs.targetQuantity);
  const chartFree = buildChartPoints(freeMoments.mean, sigmaFree, inputs.targetQuantity);

  return {
    totalSlotRolls,
    mean: primaryMoments.mean,
    variance: primaryMoments.variance,
    expectedCost: primaryMoments.expectedCost,
    expectedAppearances: primaryMoments.expectedAppearances,
    freeMean: freeMoments.mean,
    freeVariance: freeMoments.variance,
    cheapMean: cheapMoments.mean,
    cheapVariance: cheapMoments.variance,
    cheapCost: cheapMoments.expectedCost,
    highCostPurchase: selectHighCostPurchase(occurrences),
    buckets,
    chartAll,
    chartCheap,
    chartFree,
  };
}

export function buildPercentileQuantities(mean: number, variance: number): Array<{ percentile: number; quantity: number }> {
  const sigma = Math.sqrt(variance);
  return [50, 75, 90].map((percentile) => ({
    percentile,
    quantity: percentileQuantity(percentile, mean, sigma),
  }));
}

export function buildTargetCosts(
  targetQuantity: number,
  baseCost: number,
  percentiles: Array<{ percentile: number; quantity: number }>,
  highCostPurchase: { cost: number; quantity: number } | null,
): Array<{ percentile: number; cost: number; quantity: number }> {
  if (!highCostPurchase) {
    return percentiles.map((entry) => ({ ...entry, cost: baseCost }));
  }

  return percentiles.map((entry) => {
    const shortfall = Math.max(0, targetQuantity - entry.quantity);
    const packs = Math.ceil(shortfall / highCostPurchase.quantity);
    const additionalCost = packs * highCostPurchase.cost;

    return {
      ...entry,
      cost: baseCost + additionalCost,
    };
  });
}

export function buildExpectedCostToTarget(
  targetQuantity: number,
  mean: number,
  baseCost: number,
  highCostPurchase: { cost: number; quantity: number } | null,
): number {
  if (!highCostPurchase) return baseCost;

  const shortfall = Math.max(0, targetQuantity - mean);
  const packs = Math.ceil(shortfall / highCostPurchase.quantity);
  return baseCost + packs * highCostPurchase.cost;
}

export function probabilityWithoutHighCost(targetQuantity: number, mean: number, variance: number): number {
  const sigma = Math.sqrt(variance);
  return probabilityAtLeast(targetQuantity, mean, sigma);
}

export function probabilityToHitTarget(targetQuantity: number, mean: number, variance: number): number {
  const sigma = Math.sqrt(variance);
  return probabilityAtLeast(targetQuantity, mean, sigma);
}

export type ForecasterData = typeof forecasterData;
export { forecasterData };
