# Evaluation Plan

## Goal

Show how a prediction market expresses a **forward-looking** belief (YES price as implied probability) compared to simpler baselines, using **deterministic synthetic** outcomes so in-class demos are reproducible.

## Why synthetic data

Real-time library occupancy is not wired to this prototype. Synthetic hourly records approximate **evening-heavy** occupancy; a seeded PRNG (`mulberry32`) keeps **repeatable** demos.

Dataset shape shipped in code:

- **7** simulated prior days (**168** hourly rows) plus **today** (**24** hourly rows).
- Each row: `locationName`, timestamp, hour, occupancy %, capacity (**500 seats**), occupied seats, `source: synthetic_library_occupancy_data`.

Peak band **8 PM – 10 PM** is parameterized so demos can exceed threshold **sometimes** depending on RNG output for that build.

---

## How settlement aligns with evaluation

Oracle helper (**off-chain**) steps:

1. Filter **hours 20–21**.
2. `actualValue` = **max** occupancy % in window.
3. Compare **`actualValue` ≥ threshold (85)** → outcome **YES**, else **NO**.

The ** Solidity** contract resolves `settleMarket(marketId, actualValue)` the same inequality.

**Implementation note:** Scripts and frontend settlement pass the **computed** `actualValue` (e.g. **89** in the shipped deterministic path) so ledger truth matches the synthetic oracle.

---

## Methods compared

| Method | Signal | Implemented by |
|--------|--------|----------------|
| **Market Forecast** | Final YES implied probability | User enters **basis points** (e.g., final `getCurrentPrices` YES leg) · API `?yesPriceBps=` |
| **Historical Average** | Fraction of prior **7 evenings** exceeding **threshold** inside window | `web/src/lib/evaluation.ts` |
| **Plain Poll** | Fixed **mock** positivity **60%** | Stub constant |

**Classification rule:**

- Probability **≥ 0.5 → predict YES**.
- Probability **< 0.5 → predict NO**.
- Correct if prediction matches **actual** YES / NO settlement.

Displayed on `/evaluation`.

---

## Limitations — presentation honesty

Single resolved event → illustrative **not** statistically robust.

Trader count tiny → noisy price discovery.

Historical baseline uses synthetic **past** evenings only.

Poll unweighted mock — zero stake.

Play-money credits — **not** equivalent to real incentives.

Do **not** claim peer-reviewed forecasting accuracy.

---

## Where to see it

- **UI:** `/evaluation` — table + summary text.
- **API:** `GET /api/evaluation?yesPriceBps=5357` (example matches default seed script post-trade YES price **~5357 bps**).

---

## Scope echo

One **library** market is **fully** instrumented; dining / gym appear as **activation staking** exercises only.
