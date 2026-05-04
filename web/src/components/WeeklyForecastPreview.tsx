"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const SLOTS = [
  "8–10 AM",
  "10 AM–12 PM",
  "12–2 PM",
  "2–4 PM",
  "4–6 PM",
  "6–8 PM",
  "8–10 PM",
] as const;

// Deterministic illustrative baseline — NOT linked to oracle, contract, or
// synthetic data generator. Matrix shape: rows = days, cols = time slots.
// Pattern: weekday evenings build toward a peak; Fri/Sat dip (students out);
// Sun evening rebounds before Monday classes.
const BASELINE: readonly (readonly number[])[] = [
  // 8-10  10-12  12-2  2-4  4-6  6-8  8-10
  [25, 45, 58, 62, 72, 85, 89], // Mon
  [28, 48, 60, 65, 74, 82, 88], // Tue
  [30, 50, 63, 68, 78, 87, 91], // Wed
  [32, 52, 65, 70, 80, 88, 93], // Thu
  [25, 42, 55, 52, 48, 42, 38], // Fri
  [18, 32, 48, 52, 45, 40, 35], // Sat
  [20, 35, 45, 55, 65, 78, 87], // Sun
];

type RiskLevel = "Low" | "Medium" | "High";

interface RiskStyle {
  level: RiskLevel;
  cell: string;
  pill: string;
}

function classify(pct: number): RiskStyle {
  if (pct < 40) {
    return {
      level: "Low",
      cell: "bg-green-100 hover:bg-green-200 border-green-300 text-green-900",
      pill: "bg-green-200 text-green-900",
    };
  }
  if (pct <= 70) {
    return {
      level: "Medium",
      cell: "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900",
      pill: "bg-amber-200 text-amber-900",
    };
  }
  return {
    level: "High",
    cell: "bg-red-100 hover:bg-red-200 border-red-300 text-red-900",
    pill: "bg-red-200 text-red-900",
  };
}

interface SelectedCell {
  dayIdx: number;
  slotIdx: number;
  pct: number;
  level: RiskLevel;
}

export default function WeeklyForecastPreview() {
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">Weekly Library Forecast Preview</h3>
          <p className="mt-1 text-xs text-gray-500">
            A V2 illustrative mock — not currently connected to chain markets.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
          V2 preview
        </span>
      </div>

      {/* Heatmap */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="w-24 px-2 py-1 text-left font-medium text-gray-500"></th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="px-2 py-1 text-center font-medium text-gray-700"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, slotIdx) => (
              <tr key={slot}>
                <th className="px-2 py-1 text-left font-medium text-gray-600">
                  {slot}
                </th>
                {DAYS.map((d, dayIdx) => {
                  const pct = BASELINE[dayIdx][slotIdx];
                  const style = classify(pct);
                  const isSelected =
                    selected?.dayIdx === dayIdx &&
                    selected?.slotIdx === slotIdx;
                  return (
                    <td key={d} className="p-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelected({
                            dayIdx,
                            slotIdx,
                            pct,
                            level: style.level,
                          })
                        }
                        aria-label={`${d} ${slot}: ${pct}% ${style.level} risk`}
                        className={`w-full rounded border px-2 py-1.5 text-center transition-colors ${style.cell} ${
                          isSelected ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="font-mono font-bold">{pct}%</div>
                        <div className="text-[10px]">{style.level}</div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-gray-500">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-200"></span>
          <span>
            <strong>Green</strong> · likely manageable
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-amber-300 bg-amber-200"></span>
          <span>
            <strong>Yellow</strong> · check alternatives
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-red-300 bg-red-200"></span>
          <span>
            <strong>Red</strong> · likely crowded
          </span>
        </span>
      </div>

      {/* Selected cell detail */}
      {selected && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-blue-700">
                Selected slot
              </div>
              <div className="mt-0.5 text-sm font-medium text-blue-900">
                {DAYS[selected.dayIdx]} · {SLOTS[selected.slotIdx]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-blue-700 hover:underline"
            >
              Close
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-blue-900 sm:grid-cols-2">
            <div>
              Baseline risk:{" "}
              <span className="font-mono font-bold">{selected.pct}%</span>{" "}
              <span
                className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${classify(selected.pct).pill}`}
              >
                {selected.level}
              </span>
            </div>
            <div>
              Possible future market:{" "}
              <em>&ldquo;Will library occupancy exceed 85% during this slot?&rdquo;</em>
            </div>
          </div>
          <div className="mt-2 rounded bg-white/60 p-2 text-[11px] italic text-blue-800">
            Preview only — not an active on-chain market in this MVP.
          </div>
        </div>
      )}

      {/* Explanatory note */}
      <p className="mt-4 text-xs text-gray-600">
        This is a <strong>V2 preview</strong>. In a full deployment, each cell
        could become a separate YES/NO congestion market. Users would not need
        to trade on every slot — they would select the slots they personally
        care about. The current MVP implements one end-to-end slot
        (<span className="whitespace-nowrap">Library 8 PM – 10 PM</span>) to
        prove the mechanism.
      </p>
    </section>
  );
}
