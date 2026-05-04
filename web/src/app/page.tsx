import Link from "next/link";
import WeeklyForecastPreview from "@/components/WeeklyForecastPreview";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">SignalLedger</h2>
        <p className="mt-2 text-sm text-gray-600">
          A play-money prediction market for short-horizon campus congestion
          forecasting. Built for BU CAS CS595 / QST IT795.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Blockchain enforces all market rules transparently — no operator can
          silently alter balances, trades, or settlement results.
        </p>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="font-medium">MVP Market</h3>
        <p className="mt-1 text-sm text-gray-600">
          Will the library occupancy exceed 85% between 8 PM and 10 PM?
        </p>
        <div className="mt-4">
          <Link
            href="/markets"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Open Market
          </Link>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="font-medium">How It Works</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
          <li>Users register and receive 1,000 play-money credits.</li>
          <li>Admin creates a binary YES/NO congestion market.</li>
          <li>Users buy YES or NO shares — prices update after each trade.</li>
          <li>Synthetic occupancy data settles the market.</li>
          <li>Winners redeem shares for credits; losers get zero.</li>
          <li>Users can stake credits to activate new market proposals.</li>
          <li>
            An evaluation compares the market forecast against simpler
            baselines.
          </li>
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/markets"
          className="rounded-lg border bg-white p-4 shadow-sm hover:border-blue-400 transition-colors"
        >
          <h4 className="font-medium">Market</h4>
          <p className="mt-1 text-xs text-gray-500">
            Trade YES/NO shares on library occupancy.
          </p>
        </Link>
        <Link
          href="/requests"
          className="rounded-lg border bg-white p-4 shadow-sm hover:border-blue-400 transition-colors"
        >
          <h4 className="font-medium">Requests</h4>
          <p className="mt-1 text-xs text-gray-500">
            Stake credits to activate new markets.
          </p>
        </Link>
        <Link
          href="/evaluation"
          className="rounded-lg border bg-white p-4 shadow-sm hover:border-blue-400 transition-colors"
        >
          <h4 className="font-medium">Evaluation</h4>
          <p className="mt-1 text-xs text-gray-500">
            Compare market forecast vs baselines.
          </p>
        </Link>
      </div>

      <WeeklyForecastPreview />
    </div>
  );
}
