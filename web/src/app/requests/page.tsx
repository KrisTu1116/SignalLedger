"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DemoUser,
  DEMO_USERS,
  getDemoAddress,
  readBalance,
  readRegistered,
  readRequestCount,
  readMarketRequest,
  registerUser,
  createMarketRequest,
  stakeForRequest,
} from "@/lib/contract";

const CANDIDATE_QUESTIONS = [
  "Will dining hall wait time exceed 10 minutes between 6 PM and 6:30 PM?",
  "Will gym occupancy exceed 80% between 5:30 PM and 7 PM?",
];

const ACTIVATION_THRESHOLD = 500n;

type Status = "idle" | "loading" | "success" | "error";

interface RequestData {
  id: number;
  question: string;
  creator: string;
  totalStake: bigint;
  activated: boolean;
}

type PriorityLevel = "Low" | "Medium" | "High" | "Activated";

interface PriorityBadge {
  level: PriorityLevel;
  label: string;
  styles: string;
}

function derivePriority(totalStake: bigint, activated: boolean): PriorityBadge {
  if (activated) {
    return {
      level: "Activated",
      label: "Activated · Ready for market launch",
      styles: "bg-green-100 text-green-800 border-green-300",
    };
  }
  if (totalStake < 100n) {
    return {
      level: "Low",
      label: "Low Priority",
      styles: "bg-gray-100 text-gray-700 border-gray-300",
    };
  }
  if (totalStake < 300n) {
    return {
      level: "Medium",
      label: "Medium Priority",
      styles: "bg-amber-100 text-amber-800 border-amber-300",
    };
  }
  return {
    level: "High",
    label: "High Priority",
    styles: "bg-orange-100 text-orange-800 border-orange-300",
  };
}

export default function RequestsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<DemoUser>("Alice");
  const [isRegistered, setIsRegistered] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stakeAmounts, setStakeAmounts] = useState<Record<number, string>>({});
  const [txStatus, setTxStatus] = useState<Status>("idle");
  const [txMsg, setTxMsg] = useState("");

  const refresh = useCallback(async () => {
    try {
      const addr = getDemoAddress(selectedUser);
      const reg = await readRegistered(addr);
      setIsRegistered(reg);
      if (reg) {
        setBalance(await readBalance(addr));
      }

      const count = await readRequestCount();
      const reqs: RequestData[] = [];
      for (let i = 0n; i < count; i++) {
        const r = await readMarketRequest(i);
        reqs.push({
          id: Number(i),
          question: r[0],
          creator: r[1],
          totalStake: r[2],
          activated: r[3],
        });
      }
      reqs.sort((a, b) => {
        if (a.totalStake > b.totalStake) return -1;
        if (a.totalStake < b.totalStake) return 1;
        return a.id - b.id;
      });
      setRequests(reqs);
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
      setTxMsg(`${selectedUser} registered.`);
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Registration failed");
    }
  }

  async function handleCreateRequest(question: string) {
    setTxStatus("loading");
    setTxMsg("Creating request...");
    try {
      await createMarketRequest(selectedUser, question);
      setTxStatus("success");
      setTxMsg("Request created.");
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Create request failed");
    }
  }

  async function handleStake(requestId: number) {
    const amt = parseInt(stakeAmounts[requestId] || "0", 10);
    if (!amt || amt <= 0) return;
    setTxStatus("loading");
    setTxMsg(`Staking ${amt} credits...`);
    try {
      await stakeForRequest(selectedUser, BigInt(requestId), BigInt(amt));
      setTxStatus("success");
      setTxMsg(`Staked ${amt} credits.`);
      setStakeAmounts((p) => ({ ...p, [requestId]: "" }));
      await refresh();
    } catch (e: unknown) {
      setTxStatus("error");
      setTxMsg(e instanceof Error ? e.message : "Stake failed");
    }
  }

  if (connected === false) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Market Requests</h2>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Hardhat node not detected</p>
          <p className="mt-1">
            Start the local blockchain and deploy the contract first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Market Requests</h2>
      <p className="text-sm text-gray-600">
        Stake play-money credits to activate candidate congestion markets.
        A request becomes activated when total stake reaches{" "}
        {ACTIVATION_THRESHOLD.toString()} credits.
      </p>

      {/* Why staking instead of voting? */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-blue-900">
          Why staking instead of voting?
        </h3>
        <p className="mt-2 text-xs text-blue-900">
          Activation staking helps discover which campus congestion questions
          students actually care about. Unlike a simple upvote, staking
          requires users to commit scarce play-money credits, so total stake
          is a stronger signal of demand.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-blue-900/80">
          <li>
            Upvotes are <strong>free</strong> — no opportunity cost, easy to
            spam.
          </li>
          <li>
            Stake has <strong>opportunity cost</strong> — credits are locked,
            so users only stake on questions they actually want forecast.
          </li>
          <li>
            Total stake <strong>ranks</strong> requests, surfacing the highest-
            demand questions for the next market launch.
          </li>
        </ul>
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
          {isRegistered && (
            <span className="text-sm text-gray-500">
              Balance: <span className="font-medium">{balance.toString()}</span>
            </span>
          )}
        </div>
      </section>

      {/* Create requests if none exist */}
      {requests.length === 0 && isRegistered && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium">Create Candidate Requests</h3>
          <p className="mt-1 text-xs text-gray-500">
            No requests exist yet. Create the candidate markets below.
          </p>
          <div className="mt-3 space-y-2">
            {CANDIDATE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleCreateRequest(q)}
                disabled={txStatus === "loading"}
                className="block w-full rounded border px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Existing requests — sorted by totalStake desc */}
      {requests.map((req) => {
        const pct =
          ACTIVATION_THRESHOLD > 0n
            ? Math.min(
                100,
                Number((req.totalStake * 100n) / ACTIVATION_THRESHOLD)
              )
            : 100;
        const priority = derivePriority(req.totalStake, req.activated);
        return (
          <section
            key={req.id}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium">{req.question}</h3>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${priority.styles}`}
              >
                {priority.label}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              Request #{req.id}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Staked: {req.totalStake.toString()} /{" "}
                  {ACTIVATION_THRESHOLD.toString()}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all ${
                    req.activated ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {req.totalStake > 0n && (
              <div className="mt-3 rounded border border-dashed border-gray-300 bg-gray-50 p-2 text-[11px] text-gray-600">
                <span className="font-semibold text-gray-700">
                  Initial Incentive Pool:
                </span>{" "}
                Committed stake <em>can be interpreted as</em> an initial
                participation incentive pool once the market is activated. A
                future production version could use it to subsidise early
                liquidity or seed traders. In this prototype, it is shown as a
                demand and priority signal — payout logic is unchanged.
              </div>
            )}

            {!req.activated && isRegistered && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={stakeAmounts[req.id] || ""}
                  onChange={(e) =>
                    setStakeAmounts((p) => ({
                      ...p,
                      [req.id]: e.target.value,
                    }))
                  }
                  className="w-24 rounded border px-3 py-1.5 text-sm"
                  placeholder="Amount"
                />
                <button
                  onClick={() => handleStake(req.id)}
                  disabled={txStatus === "loading"}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Stake
                </button>
              </div>
            )}
          </section>
        );
      })}

      {/* Only show "create missing" if some candidates aren't created yet */}
      {requests.length > 0 &&
        requests.length < CANDIDATE_QUESTIONS.length &&
        isRegistered && (
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium">Create More Requests</h3>
            <div className="mt-2 space-y-2">
              {CANDIDATE_QUESTIONS.slice(requests.length).map((q) => (
                <button
                  key={q}
                  onClick={() => handleCreateRequest(q)}
                  disabled={txStatus === "loading"}
                  className="block w-full rounded border px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
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
