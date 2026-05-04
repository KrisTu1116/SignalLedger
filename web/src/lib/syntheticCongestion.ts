import { OccupancyRecord } from "@/types";

const LIBRARY_CAPACITY = 500;
const LOCATION = "Library";
const SOURCE = "synthetic_library_occupancy_data";

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Using a seeded PRNG keeps outputs reproducible across runs.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Base occupancy curve by hour of day (0-23).
 * Pattern: low morning, moderate afternoon, peak evening, drop late night.
 */
function baseOccupancyForHour(hour: number): number {
  const curve: Record<number, number> = {
    0: 10, 1: 5, 2: 3, 3: 2, 4: 2, 5: 5,
    6: 10, 7: 15, 8: 30, 9: 45, 10: 55, 11: 60,
    12: 50, 13: 55, 14: 60, 15: 65, 16: 70, 17: 72,
    18: 75, 19: 79, 20: 83, 21: 81, 22: 65, 23: 35,
  };
  return curve[hour] ?? 50;
}

/**
 * Generate one day of hourly library occupancy records.
 *
 * @param dateStr  ISO date string for the day, e.g. "2025-04-25"
 * @param seed     Deterministic seed for that day's variation
 */
export function generateDailyRecords(
  dateStr: string,
  seed: number
): OccupancyRecord[] {
  const rng = mulberry32(seed);
  const records: OccupancyRecord[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const base = baseOccupancyForHour(hour);
    const noise = (rng() - 0.5) * 20;
    const pct = Math.max(0, Math.min(100, Math.round(base + noise)));
    const occupied = Math.round((pct / 100) * LIBRARY_CAPACITY);

    records.push({
      locationName: LOCATION,
      timestamp: `${dateStr}T${String(hour).padStart(2, "0")}:00:00`,
      hour,
      occupancyPercentage: pct,
      capacity: LIBRARY_CAPACITY,
      occupiedSeats: occupied,
      source: SOURCE,
    });
  }
  return records;
}

/**
 * Generate 7 days of historical data plus "today".
 * Seeds are derived from the day index so results are fully deterministic.
 */
export function generateFullDataset(): {
  historical: OccupancyRecord[];
  today: OccupancyRecord[];
} {
  const BASE_SEED = 20250425;

  const historical: OccupancyRecord[] = [];
  for (let d = 7; d >= 1; d--) {
    const day = new Date(2025, 3, 25 - d); // April 18-24
    const dateStr = day.toISOString().slice(0, 10);
    historical.push(...generateDailyRecords(dateStr, BASE_SEED + d));
  }

  const today = generateDailyRecords("2025-04-25", BASE_SEED);

  return { historical, today };
}

/**
 * Filter records to a specific hour window (inclusive start, exclusive end).
 */
export function filterWindow(
  records: OccupancyRecord[],
  startHour: number,
  endHour: number
): OccupancyRecord[] {
  return records.filter((r) => r.hour >= startHour && r.hour < endHour);
}
