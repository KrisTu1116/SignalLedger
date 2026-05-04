"use client";

import { useEffect, useState } from "react";
import type { EvaluationResult } from "@/types";

export default function EvaluationPage() {
  const [data, setData] = useState<EvaluationResult | null>(null);
  const [yesBps, setYesBps] = useState("5357");
  const [loading, setLoading] = useState(false);

  async function fetchEvaluation(bps: string) {
    setLoading(true);
    try {
      const params = bps ? `?yesPriceBps=${bps}` : "";
      const res = await fetch(`/api/evaluation${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEvaluation(yesBps);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Evaluation</h2>
      <p className="text-sm text-gray-600">
        Compare the prediction market forecast against simpler baselines.
        This demonstrates that a market aggregates forward-looking, incentivized
        beliefs — unlike a backward-looking dashboard or an unweighted poll.
      </p>

      {/* YES price input */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">
            Market YES Price (bps):
          </label>
          <input
            type="number"
            value={yesBps}
            onChange={(e) => setYesBps(e.target.value)}
            className="w-28 rounded border px-3 py-1.5 text-sm"
            min="0"
            max="10000"
          />
          <button
            onClick={() => fetchEvaluation(yesBps)}
            disabled={loading}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Update
          </button>
          <span className="text-xs text-gray-400">
            ({(Number(yesBps) / 100).toFixed(2)}% implied probability)
          </span>
        </div>
      </section>

      {data && (
        <>
          {/* Outcome */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  data.actualOutcome === "YES"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.actualOutcome}
              </span>
              <span className="text-sm text-gray-600">
                Actual occupancy: {data.actualValue}% vs {data.threshold}%
                threshold
              </span>
            </div>
          </section>

          {/* Comparison table */}
          <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Probability
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    Predicted
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    Correct?
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.methods.map((m) => (
                  <tr key={m.name} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.name}</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {m.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {(m.impliedProbability * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          m.predictedOutcome === "YES"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.predictedOutcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.correct ? (
                        <span className="text-green-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-red-600 font-bold">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Summary */}
          <section className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
            {data.summary}
          </section>

          {/* Conceptual note */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium">
              Why is this more than a dashboard?
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-600">
              <li>
                A dashboard shows <strong>past or current</strong> occupancy.
                It does not predict tonight.
              </li>
              <li>
                A poll collects costless opinions — respondents have no stake
                in accuracy.
              </li>
              <li>
                A prediction market requires traders to commit play-money
                credits. The price reflects <strong>weighted conviction</strong>,
                not just popularity.
              </li>
              <li>
                Blockchain makes the market rules transparent: prices, trades,
                and settlement are all on-chain and auditable.
              </li>
            </ul>
          </section>

          {/* Forecast Reflexivity / Behavior Impact */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">
                Forecast Reflexivity &amp; Behavior Impact
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
                Illustrative impact simulation
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              Congestion forecasts are <strong>reflexive</strong>: if the market
              predicts crowding, students may avoid the location. Avoidance can
              reduce the final observed occupancy. A forecast can therefore be
              socially useful <em>even if</em> the final outcome ends up
              different from the prediction.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded border border-red-200 bg-red-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                  Raw forecast (no behavior change)
                </div>
                <div className="mt-2 space-y-1 text-sm text-red-900">
                  <div>
                    Projected max occupancy:{" "}
                    <span className="font-mono font-bold">89%</span>
                  </div>
                  <div>
                    Threshold:{" "}
                    <span className="font-mono font-bold">85%</span>
                  </div>
                  <div>
                    Predicted outcome:{" "}
                    <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-bold">
                      YES (over threshold)
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded border border-green-200 bg-green-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                  Adjusted after 20% response
                </div>
                <div className="mt-2 space-y-1 text-sm text-green-900">
                  <div>
                    Adjusted max occupancy:{" "}
                    <span className="font-mono font-bold">~81%</span>
                  </div>
                  <div>
                    Assumption: 20% of marginal visitors see the warning and
                    pick another study space.
                  </div>
                  <div>
                    Observed outcome:{" "}
                    <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-bold">
                      NO (under threshold)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded border bg-blue-50 p-3 text-xs text-blue-900">
              <strong>Interpretation:</strong> The forecast may look
              &ldquo;inaccurate&rdquo; in raw accuracy terms (predicted YES,
              observed NO), but it helped reduce congestion. For congestion
              forecasts, <em>decision usefulness</em> matters as much as raw
              hit rate.
            </div>

            <ul className="mt-3 list-inside list-disc space-y-1 text-[11px] text-gray-500">
              <li>Illustrative impact simulation — fixed numbers for clarity.</li>
              <li>
                Not a production behavioral model — no real elasticity
                estimation, no real student tracking.
              </li>
              <li>
                Used to explain why congestion forecasts should be evaluated by
                decision usefulness, not only raw accuracy.
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
