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
  question: string;
  creator: string;
  totalStake: bigint;
  activated: boolean;
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
          question: r[0],
          creator: r[1],
          totalStake: r[2],
          activated: r[3],
        });
      }
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

      {/* Existing requests */}
      {requests.map((req, idx) => {
        const pct =
          ACTIVATION_THRESHOLD > 0n
            ? Math.min(
                100,
                Number((req.totalStake * 100n) / ACTIVATION_THRESHOLD)
              )
            : 100;
        return (
          <section
            key={idx}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium">{req.question}</h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  req.activated
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.activated ? "Activated" : "Pending"}
              </span>
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
            {!req.activated && isRegistered && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={stakeAmounts[idx] || ""}
                  onChange={(e) =>
                    setStakeAmounts((p) => ({ ...p, [idx]: e.target.value }))
                  }
                  className="w-24 rounded border px-3 py-1.5 text-sm"
                  placeholder="Amount"
                />
                <button
                  onClick={() => handleStake(idx)}
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
