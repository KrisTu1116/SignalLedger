"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DemoUser,
  DEMO_USERS,
  getDemoAddress,
  readMarket,
  readMarketCount,
  readPrices,
  readBalance,
  readPosition,
  readRegistered,
  readRedeemed,
  registerUser,
  buyYes,
  buyNo,
  settleMarket,
  redeemShares,
} from "@/lib/contract";
import { computeLibrarySettlement } from "@/lib/oracle";

type Status = "idle" | "loading" | "success" | "error";

interface MarketData {
  question: string;
  locationName: string;
  metricName: string;
  threshold: bigint;
  startTime: bigint;
  endTime: bigint;
  settlementSource: string;
  status: number;
  actualValue: bigint;
  winningOutcome: number;
  yesDemand: bigint;
  noDemand: bigint;
}

function bps(val: bigint): string {
  return (Number(val) / 100).toFixed(2) + "%";
}

function outcomeLabel(o: number): string {
  return o === 1 ? "YES" : o === 2 ? "NO" : "—";
}

function formatContractTime(ts: bigint): string {
  if (ts === 0n) return "—";
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<DemoUser>("Alice");
  const [isRegistered, setIsRegistered] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [yesPos, setYesPos] = useState<bigint>(0n);
  const [noPos, setNoPos] = useState<bigint>(0n);
  const [hasRedeemed, setHasRedeemed] = useState(false);

  const [market, setMarket] = useState<MarketData | null>(null);
  const [yesBps, setYesBps] = useState<bigint>(5000n);
  const [noBps, setNoBps] = useState<bigint>(5000n);

  const [shares, setShares] = useState("10");
  const [txStatus, setTxStatus] = useState<Status>("idle");
  const [txMsg, setTxMsg] = useState("");

  const marketId = 0n;

  const refresh = useCallback(async () => {
    try {
      const count = await readMarketCount();
      if (count === 0n) {
        setConnected(true);
        setMarket(null);
        return;
      }

      const m = await readMarket(marketId);
      setMarket({
        question: m[0],
        locationName: m[1],
        metricName: m[2],
        threshold: m[3],
        startTime: m[4],
        endTime: m[5],
        settlementSource: m[6],
        status: m[7],
        actualValue: m[8],
        winningOutcome: m[9],
        yesDemand: m[10],
        noDemand: m[11],
      });

      const [yb, nb] = await readPrices(marketId);
      setYesBps(yb);
      setNoBps(nb);

      const addr = getDemoAddress(selectedUser);
      const reg = await readRegistered(addr);
      setIsRegistered(reg);
      if (reg) {
        setBalance(await readBalance(addr));
        const pos = await readPosition(addr, marketId);
        setYesPos(pos[0]);
        setNoPos(pos[1]);
        setHasRedeemed(await readRedeemed(addr, marketId));
      } else {
        setBalance(0n);
        setYesPos(0n);
        setNoPos(0n);
        setHasRedeemed(false);
      }

      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRegister() {
    setTxStatus("loading");
    setTxMsg("Registering...");
    try {
      await registerUser(selectedUser);
      setTxStatus("success");
      setTxMsg(`${selectedUser} registered with 1000 credits.`);
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Registration failed");
    }
  }

  async function handleBuy(isYes: boolean) {
    const n = parseInt(shares, 10);
    if (!n || n <= 0) return;
    setTxStatus("loading");
    setTxMsg(`Buying ${n} ${isYes ? "YES" : "NO"} shares...`);
    try {
      if (isYes) {
        await buyYes(selectedUser, marketId, BigInt(n));
      } else {
        await buyNo(selectedUser, marketId, BigInt(n));
      }
      setTxStatus("success");
      setTxMsg(`Bought ${n} ${isYes ? "YES" : "NO"} shares.`);
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Trade failed");
    }
  }

  async function handleSettle() {
    setTxStatus("loading");
    setTxMsg("Settling market...");
    try {
      const oracle = computeLibrarySettlement();
      await settleMarket(marketId, BigInt(oracle.actualValue));
      setTxStatus("success");
      setTxMsg(
        `Settled. Occupancy: ${oracle.actualValue}% → ${oracle.winningOutcome} wins.`
      );
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Settlement failed");
    }
  }

  async function handleRedeem() {
    setTxStatus("loading");
    setTxMsg("Redeeming...");
    try {
      await redeemShares(selectedUser, marketId);
      setTxStatus("success");
      setTxMsg("Redeemed successfully.");
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Redemption failed");
    }
  }

  // ── Not connected ──
  if (connected === false) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Market</h2>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Hardhat node not detected</p>
          <p className="mt-1">Start the local blockchain and deploy the contract:</p>
          <pre className="mt-2 rounded bg-amber-100 p-2 text-xs">
{`cd contracts
npx hardhat node          # Terminal 1
npm run deploy:local      # Terminal 2
npm run seed:local        # Terminal 2 (optional)`}
          </pre>
          <button
            onClick={refresh}
            className="mt-3 rounded bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── No market yet ──
  if (connected && !market) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Market</h2>
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          <p>No markets found. Run the seed script to create the demo market:</p>
          <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
            cd contracts{"\n"}npm run seed:local
          </pre>
          <button
            onClick={refresh}
            className="mt-3 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const isOpen = market?.status === 0;
  const isSettled = market?.status === 1;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Market</h2>

      {/* Market info */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="font-medium">{market?.question}</h3>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
          <div>Location: <span className="font-medium text-gray-900">{market?.locationName}</span></div>
          <div>Metric: <span className="font-medium text-gray-900">{market?.metricName}</span></div>
          <div>Threshold: <span className="font-medium text-gray-900">{market?.threshold.toString()}%</span></div>
          <div>Source: <span className="font-medium text-gray-900">{market?.settlementSource}</span></div>
          <div className="col-span-2">
            Time Window:{" "}
            <span className="font-medium text-gray-900">
              8:00 PM &ndash; 10:00 PM
            </span>
            {market && market.startTime > 0n && (
              <span className="ml-2 text-xs text-gray-500">
                (contract: {formatContractTime(market.startTime)} &rarr;{" "}
                {formatContractTime(market.endTime)})
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isOpen
                ? "bg-green-100 text-green-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {isOpen ? "Open" : "Settled"}
          </span>
          {isSettled && (
            <span className="text-sm text-gray-600">
              Actual: {market?.actualValue.toString()}% — Winner:{" "}
              <span className="font-bold">
                {outcomeLabel(market?.winningOutcome ?? 0)}
              </span>
            </span>
          )}
        </div>
      </section>

      {/* Prices */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-green-50 p-4 text-center">
          <div className="text-xs text-green-700">YES Price</div>
          <div className="mt-1 text-2xl font-bold text-green-800">
            {bps(yesBps)}
          </div>
        </div>
        <div className="rounded-lg border bg-red-50 p-4 text-center">
          <div className="text-xs text-red-700">NO Price</div>
          <div className="mt-1 text-2xl font-bold text-red-800">
            {bps(noBps)}
          </div>
        </div>
      </section>

      {/* User selection */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Demo User:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value as DemoUser)}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {DEMO_USERS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          {!isRegistered && (
            <button
              onClick={handleRegister}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Register
            </button>
          )}
        </div>

        {isRegistered && (
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Balance:</span>{" "}
              <span className="font-medium">{balance.toString()}</span>
            </div>
            <div>
              <span className="text-gray-500">YES shares:</span>{" "}
              <span className="font-medium">{yesPos.toString()}</span>
            </div>
            <div>
              <span className="text-gray-500">NO shares:</span>{" "}
              <span className="font-medium">{noPos.toString()}</span>
            </div>
          </div>
        )}
      </section>

      {/* Trading */}
      {isOpen && isRegistered && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium">Trade</h4>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-24 rounded border px-3 py-1.5 text-sm"
              placeholder="Shares"
            />
            <button
              onClick={() => handleBuy(true)}
              disabled={txStatus === "loading"}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Buy YES
            </button>
            <button
              onClick={() => handleBuy(false)}
              disabled={txStatus === "loading"}
              className="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Buy NO
            </button>
          </div>
        </section>
      )}

      {/* Settlement */}
      {isOpen && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium">Settlement (Admin)</h4>
          <p className="mt-1 text-xs text-gray-500">
            Uses synthetic occupancy data to settle the market.
          </p>
          <button
            onClick={handleSettle}
            disabled={txStatus === "loading"}
            className="mt-2 rounded bg-gray-800 px-4 py-1.5 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
          >
            Settle with Synthetic Data
          </button>
        </section>
      )}

      {/* Redemption */}
      {isSettled && isRegistered && !hasRedeemed && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium">Redeem Shares</h4>
          <p className="mt-1 text-xs text-gray-500">
            {market?.winningOutcome === 1
              ? "YES wins. YES shares redeem for credits. NO shares redeem for zero."
              : "NO wins. NO shares redeem for credits. YES shares redeem for zero."}
          </p>
          <button
            onClick={handleRedeem}
            disabled={txStatus === "loading"}
            className="mt-2 rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Redeem
          </button>
        </section>
      )}

      {isSettled && hasRedeemed && (
        <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-500">
          {selectedUser} has already redeemed for this market.
        </div>
      )}

      {/* TX feedback */}
      {txMsg && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            txStatus === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : txStatus === "success"
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-blue-300 bg-blue-50 text-blue-800"
          }`}
        >
          {txMsg}
        </div>
      )}
    </div>
  );
}
