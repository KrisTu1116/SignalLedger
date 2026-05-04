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

## Beyond raw accuracy — decision usefulness

Congestion markets are not pure financial bets. They produce a **decision
signal** that students can act on. That changes how the market should be
evaluated.

### Ordinary prediction accuracy

The classical metric: did `predictedOutcome` match `actualOutcome`?

- Market YES probability ≥ 0.5 → predict **YES**, else **NO**.
- Compare to the synthetic settlement.
- Counted in the comparison table on `/evaluation`.

This is the metric reported in the comparison table and is the **only** metric
that fits a static, non-reflexive event (e.g. *will it rain?*).

### Decision usefulness

For a congestion forecast the user-facing question is not *"was the YES price
right?"* but *"did the forecast help students make a better decision tonight?"*

The Market page surfaces this directly via the **Decision Signal** card:

| YES probability | Risk level | Suggested action |
|-----------------|------------|------------------|
| < 40 %          | Low        | Library is likely manageable. |
| 40 – 70 %       | Medium     | Check alternatives before going. |
| > 70 %          | High       | Consider avoiding 8–10 PM or pick another space. |

Decision usefulness = the share of users who would have made a worse choice
without the signal. We do not measure this empirically in this prototype; we
illustrate the framing.

### Congestion reduction effect

If the market signals **High** risk and a fraction of would-be visitors choose
to skip or shift their visit, the **observed** maximum occupancy can drop
below the threshold even though the **untreated** projection was above it.

Illustrative deterministic scenario shipped on the `/evaluation` page:

| Quantity | Raw forecast | After 20 % behavioral response |
|----------|--------------|--------------------------------|
| Max occupancy | 89 %    | ≈ 81 %                         |
| Threshold     | 85 %    | 85 %                           |
| Outcome       | YES     | NO                             |

Numbers are fixed for classroom clarity, **not** elasticity-estimated. The
point is qualitative: *behavior responds to the price*.

### Why congestion forecasts are reflexive

A reflexive forecast is one whose publication changes the very quantity it
predicts. Weather is **non-reflexive**: a 70 % chance of rain does not affect
the rain. Congestion is **reflexive**: a high YES price can route students
elsewhere, lowering the realized maximum.

Implications for grading the system:

- Penalising the market only by raw hit-rate is **misleading** when the
  forecast itself is part of the causal chain.
- A forecast that "fails" — predicts YES, observes NO — may be the
  **best-case outcome** if the failure was caused by behaviour change.
- A complete evaluation should report both **(a)** raw accuracy versus
  baselines (the table at the top of `/evaluation`) and **(b)** a frank
  discussion of behavioural impact (the Reflexivity section below it).

This module ships **(a)** with deterministic data and **(b)** as a fixed
illustrative scenario; both are presented with explicit "illustrative" and
"not a production behavioural model" labels.

---

## Where to see it

- **UI:** `/evaluation` — table + summary text + Reflexivity / Behavior
  Impact section.
- **UI:** `/markets` — Decision Signal card derived from current YES price.
- **API:** `GET /api/evaluation?yesPriceBps=5357` (example matches default seed script post-trade YES price **~5357 bps**).

---

## Scope echo

One **library** market is **fully** instrumented; dining / gym appear as **activation staking** exercises only.
