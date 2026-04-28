# Architecture

SignalLedger is a **local classroom prototype**: a Solidity contract on Hardhat holds market rules and state; synthetic occupancy is generated off-chain TypeScript helpers; the Next.js frontend and Hardhat scripts call the contract and display results.

---

## Smart contract layer

**Technology:** Solidity 0.8.x, Hardhat, TypeScript tests.

**Responsibilities:**

| Area | Behavior |
|------|----------|
| Registration | `register()` once per address; initial internal credits (**1000**). |
| Markets | Admin `createMarket()` — binary YES/NO, threshold, window metadata, settlement source label. |
| Pricing | Simple AMM: demand + virtual liquidity → YES/NO prices in basis points. |
| Trading | `buyYes` / `buyNo`; deduct credits, update positions and demand; **non-payable**. |
| Settlement | Admin `settleMarket(actualValue)` sets outcome: YES if `actualValue >= threshold`, else NO. |
| Redemption | `redeem()` after settlement; winning side converts shares to credits; losers get **0**. |
| Activation | `createMarketRequest` + `stakeForRequest`; total stake reaches **500** activates the request (does not deploy a full new market automatically). |

**Deployment:** Compiled artifact + deploy script write `contracts/deployments/localhost.json` when targeting `localhost` (ignored from git by default).

---

## Synthetic data / oracle layer

**Technology:** TypeScript in `web/src/lib/` (and mirrored concepts in API routes).

**Synthetic data**

- Deterministic seeded generator (`mulberry32`) builds hourly library occupancy for a fictional day plus 7 historical days.
- Fields per record include location, timestamp, occupancy %, capacity, occupied seats, and a `synthetic_library_occupancy_data` source label — **no PII**.

**Oracle-style helper**

- Reads “today”’s hourly records for the MVP window (**8 PM – 10 PM**, hours **20–21**).
- Computes **`actualValue` = maximum** occupancy in that window (not raw sensor upload to chain).
- Compares `actualValue` to the contract threshold (**85**) to decide the **intended** YES/NO outcome before calling `settleMarket`.

**Important:** The “oracle” **does not** run as a decentralized network. It is a **deterministic calculator** invoked by scripts or by the frontend before sending one admin transaction.

---

## Frontend layer

**Technology:** Next.js (App Router), TypeScript, Tailwind CSS, viem.

**Pages**

| Route | Purpose |
|-------|---------|
| `/` | Project overview and links. |
| `/markets` | Library MVP: balances, YES/NO prices, trade, synthetic settlement trigger, redeem. |
| `/requests` | Candidate dining hall / gym questions; stake credits; activation progress. |
| `/evaluation` | Baseline comparison (market vs historical fraction vs mock poll); can pass YES price in bps via query or UI. |

**Contract access:** Browser uses viem wallet clients seeded with **Hardhat default private keys** for demo users (Alice/Bob/Carol) against `http://127.0.0.1:8545`. Intended for **localhost demo only.**

**API routes:** `GET /api/synthetic/library`, `/api/oracle/library-settlement`, `/api/evaluation` return JSON built from the same TypeScript libs for inspection or UI.

---

## What is on-chain

- Registration flags and **internal credit balances** (mapping, not ERC-20).
- Market definitions and **open/settled** state, **actualValue** after settlement, **winningOutcome**.
- **YES/NO shares** per user per market ID; **YES/NO cumulative demand** for pricing.
- **Redeemed** flag per user per market to prevent double redemption.
- Market **requests**, **per-request stake totals**, **per-user stake**, **activated** flags.
- **Events** for trades, settlement, redemption, staking — auditable alongside state.

Nothing on-chain asserts that synthetic numbers came from real buildings; **settlement inputs are submitted by admin** (`settleMarket`) in this prototype.

---

## What is off-chain

- Synthetic occupancy **generation** (full hourly time series for demo).
- **Presentation** — tables, prose, lecture slides.
- **Evaluation** arithmetic that compares implied probability vs historical fraction vs poll (could be replicated on-chain, but isn’t — kept off-chain for simplicity).
- **Deployment JSON** artifact path (localhost) for scripts.
- Traditional **HTTPS** frontend server (`npm run dev`).

---

## Why blockchain is useful here (narrow claim)

Blockchain does **not** replace a congestion dashboard.

It **does** help a classroom demo argue that:

1. **Rules are explicit** — Anyone can inspect the Solidity for how trades, balances, settlement, payout, and staking thresholds work.

2. **State changes are append-only and attributable** — Transfers of credits and settlement are visible as transactions/events rather than an opaque backend row update.

3. **Misalignment costs are clearer** — The teaching point “operator can’t silently rewrite your balance after settlement” contrasts with an unexamined centralized DB (even if a course still trusts the lecturer’s deployed bytecode — the contract is inspectable).

4. **Play-money abstraction** Still shows how **commitment rules** sit in consensus logic rather than scattered in app code.

Production prediction markets introduce custody, oracle games, liquidity, regulation — **out of scope** for SignalLedger.

---

## Data flow (high level)

```
┌─────────────────────────────────────────────────────────┐
│  User (demo account) ──► Next.js ──► viem ──► Hardhat RPC │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼ (reads)
┌─────────────────────────────────────────────────────────┐
│  Synthetic TS helper ─► proposed actualValue ─►       │
│  Admin signer calls settleMarket(marketId, actualValue)   │
└─────────────────────────────────────────────────────────┘
```

For CLI scripts: **ethers.js** wallets (same deterministic Hardhat keys) execute the same contract functions.
