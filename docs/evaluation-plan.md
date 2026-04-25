# Evaluation Plan

## Goal

Demonstrate that a prediction market produces a useful forward-looking signal compared to simpler alternatives.

## Why Synthetic Data

Real-time library sensor data is not available for a classroom prototype. Instead, SignalLedger uses deterministic synthetic occupancy data that follows a realistic daily pattern:

- Low occupancy in early morning (2–5%)
- Gradual increase through the day (30–70%)
- Peak during evening hours, especially 8–10 PM (82–90%)
- Decline after 10 PM

A seeded pseudo-random number generator (mulberry32) ensures that every run produces the same numbers, making demo results reproducible.

The synthetic dataset contains:
- 7 days of historical records (one record per hour, 24 × 7 = 168 records)
- 1 day of "today" records (24 records)

Each record includes: `locationName`, `timestamp`, `hour`, `occupancyPercentage`, `capacity`, `occupiedSeats`, `source`.

## How Settlement Works

1. The oracle helper reads "today"'s synthetic records.
2. It filters to the market window (8 PM – 10 PM, hours 20 and 21).
3. It computes `actualValue` = maximum occupancy percentage in that window.
4. It compares `actualValue` against the market threshold (85%).
5. If `actualValue >= 85` → **YES wins**. Otherwise → **NO wins**.

In a real system, this would read from a campus sensor API. For the demo, the synthetic data module acts as the data source.

## Methods Compared

| Method | Signal | Source | Type |
|--------|--------|--------|------|
| Market Forecast | Final YES price as implied probability | SignalLedger contract | Forward-looking, incentivized |
| Historical Average | Fraction of past 7 evenings exceeding 85% | Synthetic historical data | Backward-looking |
| Plain Poll | Simple yes/no vote percentage (60% yes) | Mock poll | Unweighted opinions |

### Market Forecast

The final YES price from the prediction market is interpreted as an implied probability. For example, a YES price of 5357 bps means the market implies a 53.57% chance of exceeding 85% occupancy.

The key advantage: traders who buy shares are putting play-money credits at risk, so the price reflects weighted conviction rather than costless opinions.

### Historical Average

For each of the past 7 evenings, check whether the max occupancy in the 8–10 PM window exceeded 85%. The fraction of evenings that exceeded is the historical probability.

This is backward-looking — it tells you what typically happened, not what traders currently believe about tonight.

### Plain Poll

A mock campus poll where 60% of respondents said "yes, the library will be crowded tonight." This is a simple unweighted average of opinions with no cost to participating.

## Metric

Binary accuracy: did the method's implied probability correctly indicate the actual outcome?

- If implied probability ≥ 50% → predicted YES
- If implied probability < 50% → predicted NO
- Compare predicted outcome against actual outcome

## Presentation

The evaluation page displays:

1. A table with all three methods, their probabilities, predictions, and correctness.
2. The actual outcome and actual occupancy value.
3. A short narrative explaining why the market signal is conceptually different from the baselines.

## Limitations

- **One market, one evening.** This is a classroom demonstration, not a statistical study. Comparing accuracy on a single binary event is illustrative, not rigorous.
- **Synthetic data.** The occupancy pattern is plausible but invented. Real campus data may behave differently.
- **Mock poll.** The 60% figure is fixed, not collected from real respondents.
- **Small trader pool.** With only 2 demo traders, the market price reflects very limited information.
- **No real incentives.** Play money does not create the same incentive alignment as real-money prediction markets.

Despite these limitations, the demo successfully shows the conceptual distinction: a prediction market aggregates forward-looking, incentivized beliefs, while a dashboard shows the past and a poll shows unweighted opinions.
