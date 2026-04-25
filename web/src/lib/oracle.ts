import { OracleResult, OccupancyRecord } from "@/types";
import { generateFullDataset, filterWindow } from "./syntheticCongestion";

/**
 * Compute settlement result for the library occupancy market.
 *
 * Uses "today"'s synthetic data, filters to the 8 PM – 10 PM window,
 * takes the maximum occupancy percentage, and compares against threshold.
 */
export function computeLibrarySettlement(
  threshold: number = 85,
  windowStartHour: number = 20,
  windowEndHour: number = 22
): OracleResult {
  const { today } = generateFullDataset();
  const windowRecords = filterWindow(today, windowStartHour, windowEndHour);

  const actualValue =
    windowRecords.length > 0
      ? Math.max(...windowRecords.map((r) => r.occupancyPercentage))
      : 0;

  const exceeded = actualValue >= threshold;

  return {
    marketQuestion:
      "Will the library occupancy exceed 85% between 8 PM and 10 PM?",
    locationName: "Library",
    threshold,
    windowStart: windowStartHour,
    windowEnd: windowEndHour,
    actualValue,
    exceeded,
    winningOutcome: exceeded ? "YES" : "NO",
    recordsUsed: windowRecords.length,
  };
}

/**
 * Get the raw window records used for settlement (for transparency).
 */
export function getSettlementRecords(
  windowStartHour: number = 20,
  windowEndHour: number = 22
): OccupancyRecord[] {
  const { today } = generateFullDataset();
  return filterWindow(today, windowStartHour, windowEndHour);
}
