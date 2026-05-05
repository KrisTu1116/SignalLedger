"use client";

import { useEffect, useState } from "react";
import { readAuditEvents } from "@/lib/contract";

interface AuditEvent {
  eventName: string;
  blockNumber?: bigint;
  transactionHash?: string;
  args?: unknown;
}

function shortenAddress(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("0x") && value.length > 16) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(shortenAddress);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, shortenAddress(val)])
    );
  }

  return value;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);

  async function refresh() {
    try {
      const logs = await readAuditEvents();
      setEvents(logs);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (connected === false) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Audit Trail</h2>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Hardhat node not detected. Start the local chain and deploy the contract.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-lg font-semibold">Audit Trail</h2>
            <p className="text-sm text-gray-600">
                On-chain event history for registration, trades, settlement,
                redemption, staking, and disputes.
            </p>
            <p className="text-xs text-gray-500">
                Privacy note: this demo uses local Hardhat addresses only. In a production
                campus deployment, the audit trail should avoid displaying personally
                identifying information and may show pseudonymous or role-based IDs instead.
            </p>
        </div>
        <button
          onClick={refresh}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <section className="rounded-lg border bg-white p-4 text-sm text-gray-600 shadow-sm">
          No events found yet. Try registering, trading, settling, redeeming,
          staking, or submitting a dispute.
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Block</th>
                <th className="px-4 py-3 font-medium">Transaction</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {e.eventName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.blockNumber?.toString() ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {e.transactionHash
                      ? `${e.transactionHash.slice(0, 10)}...${e.transactionHash.slice(-8)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <pre className="max-w-xs overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                      {JSON.stringify(shortenAddress(e.args), null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}