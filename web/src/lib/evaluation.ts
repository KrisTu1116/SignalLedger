import { EvaluationResult, EvaluationMethod } from "@/types";
import { generateFullDataset, filterWindow } from "./syntheticCongestion";
import { computeLibrarySettlement } from "./oracle";

/**
 * Compute historical baseline: fraction of past evenings where
 * max occupancy in the 8-10 PM window >= threshold.
 */
function computeHistoricalBaseline(threshold: number): number {
  const { historical } = generateFullDataset();

  const dates = [...new Set(historical.map((r) => r.timestamp.slice(0, 10)))];
  let exceeded = 0;

  for (const date of dates) {
    const dayRecords = historical.filter(
      (r) => r.timestamp.startsWith(date)
    );
    const window = filterWindow(dayRecords, 20, 22);
    const maxPct =
      window.length > 0
        ? Math.max(...window.map((r) => r.occupancyPercentage))
        : 0;
    if (maxPct >= threshold) exceeded++;
  }

  return dates.length > 0 ? exceeded / dates.length : 0.5;
}

/**
 * Mock poll baseline: simulates a simple "Will the library be crowded?" poll.
 * Deterministic — returns a fixed plausible value.
 */
function computePollBaseline(): number {
  return 0.6;
}

/**
 * Run the full evaluation.
 *
 * @param marketYesPriceBps  Current or final YES price in basis points (0-10000)
 *                           from the smart contract. Pass null to use a default.
 */
export function runEvaluation(
  marketYesPriceBps: number | null
): EvaluationResult {
  const threshold = 85;
  const oracle = computeLibrarySettlement(threshold);
  const actualOutcome = oracle.winningOutcome;

  const marketProb =
    marketYesPriceBps !== null ? marketYesPriceBps / 10_000 : 0.5357;

  const historicalProb = computeHistoricalBaseline(threshold);
  const pollProb = computePollBaseline();

  function toOutcome(prob: number): "YES" | "NO" {
    return prob >= 0.5 ? "YES" : "NO";
  }

  const methods: EvaluationMethod[] = [
    {
      name: "Market Forecast",
      description:
        "Final YES price from the SignalLedger prediction market, interpreted as implied probability.",
      impliedProbability: Math.round(marketProb * 10000) / 10000,
      predictedOutcome: toOutcome(marketProb),
      correct: toOutcome(marketProb) === actualOutcome,
    },
    {
      name: "Historical Average",
      description:
        "Fraction of past 7 evenings where library occupancy exceeded 85% in the 8–10 PM window.",
      impliedProbability: Math.round(historicalProb * 10000) / 10000,
      predictedOutcome: toOutcome(historicalProb),
      correct: toOutcome(historicalProb) === actualOutcome,
    },
    {
      name: "Plain Poll",
      description:
        'Mock campus poll asking "Will the library be crowded tonight?" — 60% said yes.',
      impliedProbability: pollProb,
      predictedOutcome: toOutcome(pollProb),
      correct: toOutcome(pollProb) === actualOutcome,
    },
  ];

  const correctCount = methods.filter((m) => m.correct).length;

  const summary =
    `Actual outcome: ${actualOutcome} (occupancy ${oracle.actualValue}% vs ${threshold}% threshold). ` +
    `${correctCount} of ${methods.length} methods predicted correctly. ` +
    `The prediction market aggregates forward-looking beliefs from traders, ` +
    `unlike the backward-looking historical average or the unweighted poll.`;

  return {
    actualOutcome,
    actualValue: oracle.actualValue,
    threshold,
    methods,
    summary,
  };
}
