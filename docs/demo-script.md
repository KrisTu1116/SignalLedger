# Demo Script

## 1. Problem

Students want to know: will the library be crowded tonight?

Current tools (dashboards, social media) show **what happened**, not **what will happen**.

## 2. Why a Dashboard Is Not Enough

A dashboard reports historical or current occupancy. It does not aggregate forward-looking beliefs from the campus community.

## 3. Why Blockchain

A prediction market needs transparent, tamper-resistant rules for trading, settlement, and payout. Blockchain makes these rules visible and auditable — no single operator can silently change the outcome.

## 4. Trading Demo

1. Alice registers → receives 1000 credits.
2. Bob registers → receives 1000 credits.
3. Admin creates market: "Library occupancy > 85%, 8–10 PM?"
4. Alice buys YES shares → price moves up.
5. Bob buys NO shares → price adjusts.

## 5. Settlement Demo

1. Synthetic occupancy data is generated for the 8–10 PM window.
2. Oracle helper reads the data and calls `settleMarket()`.
3. Contract determines winning outcome (YES or NO).

## 6. Redemption

1. Winners call `redeem()` → credits returned.
2. Losers call `redeem()` → zero payout.

## 7. Activation Staking Demo

1. Show candidate market requests (dining hall, gym).
2. Users stake credits toward a request.
3. Request becomes "activated" when it reaches the staking threshold.

## 8. Evaluation

Compare:
- Market forecast (final YES price as implied probability)
- Historical average baseline
- Plain poll baseline

## 9. Limitations

- Play money only — not a real financial instrument.
- Synthetic data — not real campus sensors.
- Local network — not production deployment.
- Educational prototype — not a production prediction market.
