```md
---
name: signalledger-project
description: Use this skill when working on the SignalLedger blockchain course project, including smart contracts, synthetic congestion data, oracle settlement, frontend demo, evaluation, documentation, or integration tasks.
---

# SignalLedger Project Skill

## Purpose

SignalLedger is a local classroom prototype for BU CAS CS595 / QST IT795: Blockchains and their Applications.

It is a play-money prediction market for short-horizon campus congestion forecasting.

The MVP question is:

> Will the library occupancy exceed 85% between 8 PM and 10 PM?

The goal is not to build a production prediction market. The goal is to demonstrate how blockchain can act as a transparent rule-enforcement layer for a small prediction market.

## Core Product Definition

SignalLedger allows demo users to:

1. Register and receive internal play-money credits.
2. Browse a binary YES/NO congestion market.
3. Buy YES or NO shares.
4. See market prices update after trades.
5. Settle the market using synthetic library occupancy data.
6. Redeem winning shares for play-money credits.
7. Stake play-money credits to support opening new congestion markets.
8. View a simple evaluation comparing market forecast vs historical average vs plain poll.

## Non-Negotiable Scope Constraints

Always obey these constraints:

- Use play money only.
- Do not implement real-money trading.
- Do not create tokenomics involving real assets.
- Do not build a public deployment.
- Do not collect personally identifiable information.
- Do not implement unrestricted user-generated markets.
- Do not implement production-grade oracle infrastructure.
- Do not implement full LMSR unless explicitly requested.
- Do not overbuild authentication, governance, wallets, or DeFi mechanics.
- Focus on one end-to-end library occupancy market.
- Dining hall and gym should remain extension templates unless explicitly requested.

## Blockchain Justification

Blockchain is not used merely to store congestion data.

Blockchain is used to enforce and expose the rules for:

- market creation
- YES/NO share trading
- play-money balances
- deterministic price updates
- settlement
- payout
- redemption
- market activation staking

The key value is transparent, auditable rule execution.

If asked “Why not just use a database?”, answer through the following distinction:

- A database can store the same data, but the operator can silently alter balances, trades, market state, or settlement results.
- A smart contract makes the market rules visible and harder to manipulate after users have committed positions.
- This is useful for a classroom prediction-market prototype because participants can verify that prices, payouts, and activation staking follow declared rules.

## Preferred Stack

Use:

- Solidity
- Hardhat
- TypeScript tests
- Next.js
- TypeScript
- Tailwind CSS
- viem or ethers
- local Hardhat network
- synthetic data for settlement

Avoid unnecessary production infrastructure.

## Recommended Repository Structure

Use this structure unless the existing project already differs:

```text
signalledger/
  contracts/
    contracts/
      SignalLedger.sol
    test/
      SignalLedger.test.ts
    scripts/
      deploy.ts
      seed-demo.ts
    hardhat.config.ts
    package.json
    tsconfig.json

  web/
    src/
      app/
        page.tsx
        markets/
        requests/
        evaluation/
      components/
      lib/
        syntheticCongestion.ts
        evaluation.ts
        contract.ts
      types/
    package.json
    tailwind.config.ts
    next.config.ts

  docs/
    architecture.md
    demo-script.md
    evaluation-plan.md

  README.md

```

If the existing structure is different, inspect it first and adapt without unnecessary rewrites.

## Smart Contract Requirements

The core contract should support:

### Registration

- `register()`
- each user registers once
- each user receives initial internal credits, for example 1000

### Market Creation

Admin creates official binary markets.

Each market should include:

- market id
- question
- location name
- metric name
- threshold
- start time
- end time
- settlement source
- status
- actual value after settlement
- winning outcome after settlement

### Outcomes

Use binary outcomes:

- YES wins if `actualValue >= threshold`
- NO wins otherwise

### Trading

Users can buy YES or NO shares while market is open.

The contract should:

- require registered user
- check sufficient play-money credits
- deduct cost
- increase user position
- update market demand
- emit trade event

### Pricing

Use a simple deterministic AMM-like formula.

Do not implement a complex production LMSR unless explicitly requested.

A suitable educational formula:

```solidity
yesPriceBps = ((yesDemand + VIRTUAL_LIQUIDITY) * 10000)
  / (yesDemand + noDemand + 2 * VIRTUAL_LIQUIDITY);

noPriceBps = 10000 - yesPriceBps;

```

Cost can be:

```solidity
cost = sharesToBuy * priceBps / 10000;

```

Round up where needed.

The point is to demonstrate price movement, not production-grade market making.

### Settlement

Admin settles the market with actual congestion value.

The contract should:

- set actual value
- determine winning outcome
- mark market as settled
- emit settlement event

### Redemption

After settlement:

- winning shares redeem for internal credits
- losing shares redeem for zero
- double redemption is forbidden

### Market Activation Staking

Users can stake play-money credits toward requested markets.

Minimum behavior:

- create market request
- stake credits toward request
- track total stake
- mark request activated when threshold is reached
- emit events

It does not need to automatically create a full official market unless this is simple and already requested.

## Required Contract Tests

When editing smart contracts, add or update tests for:

- registration
- duplicate registration rejection
- admin market creation
- non-admin market creation rejection
- buy YES
- buy NO
- price updates after trades
- insufficient credits rejection
- YES settlement
- NO settlement
- redemption
- double redemption rejection
- market request creation
- staking toward activation
- activation threshold reached

All contract changes should preserve passing tests.

## Synthetic Data Requirements

Use synthetic library occupancy data if real data is unavailable.

Synthetic records should include:

- location name
- timestamp
- occupancy percentage
- capacity
- occupied seats
- source

The pattern should be realistic:

- evening occupancy is generally higher
- 8 PM to 10 PM has higher chance of exceeding 85%
- add small variation
- keep demo results deterministic

## Oracle Settlement Requirements

The oracle helper should:

1. Read the market window.
2. Read synthetic library occupancy records.
3. Compute actual value, such as max occupancy percentage in the window.
4. Compare against threshold.
5. Return YES or NO outcome.
6. Optionally call the contract settlement function in local demo mode.

Do not design a production oracle unless explicitly requested.

## Evaluation Requirements

The evaluation should compare:

1. Market forecast:
  - use current or final YES price as implied probability.
2. Historical average baseline:
  - use synthetic historical occupancy probability for the same time window.
3. Plain poll baseline:
  - use simple mock poll vote percentage.

Keep the evaluation simple and presentation-friendly.

The purpose is to show that a prediction market provides a forward-looking signal beyond a static dashboard or a simple poll.

## Frontend Requirements

The frontend should be demo-oriented.

Required UI:

### Home Page

Explain SignalLedger briefly.

Show the MVP market:

> Library occupancy > 85%, 8 PM to 10 PM

### Market Page

Show:

- question
- location
- threshold
- time window
- current YES price
- current NO price
- selected demo user
- play-money balance
- YES/NO position
- buy YES button
- buy NO button
- settlement result if settled

### Requests Page

Show candidate market requests:

- dining hall wait time > 10 minutes
- gym occupancy > 80%

Allow demo users to stake play-money credits toward activation.

### Evaluation Page

Show:

- market forecast
- historical average baseline
- poll baseline
- actual outcome
- short explanation

## UI Style

Use:

- simple cards
- clear labels
- readable spacing
- minimal animation
- no overdesigned dashboard
- no unnecessary charts unless helpful

The UI should help a professor understand the blockchain mechanism quickly.

## Documentation Requirements

Maintain:

- `README.md`
- `docs/architecture.md`
- `docs/demo-script.md`
- `docs/evaluation-plan.md`

README must explain:

- install dependencies
- run contract tests
- start local blockchain
- deploy contract
- seed demo data
- start frontend
- run demo flow

Demo script should follow:

1. Problem
2. Why dashboard is not enough
3. Why blockchain
4. Trading demo
5. Settlement demo
6. Activation staking demo
7. Evaluation
8. Limitations

## Development Behavior

Before making changes:

1. Inspect current files.
2. Identify the smallest useful next step.
3. Avoid broad rewrites.
4. Keep code simple.
5. Add tests when touching contracts.
6. Update docs when behavior changes.
7. Explain what changed after implementation.

## Anti-Patterns to Avoid

Do not:

- turn this into a real-money betting app
- build a generic Polymarket clone
- overbuild wallet integration
- overbuild authentication
- overbuild backend infrastructure
- add ZK proofs
- add governance tokens
- add NFTs
- add real campus surveillance
- add unnecessary production deployment configs
- implement multiple full markets before the library market works end-to-end

## Definition of Done

The MVP is done when a local demo can show:

1. Alice registers.
2. Bob registers.
3. Admin creates the library congestion market.
4. Alice buys YES.
5. Bob buys NO.
6. Market prices change.
7. Synthetic data settles the market.
8. Winning side redeems play-money credits.
9. Users stake toward a new dining hall or gym market.
10. Evaluation compares market forecast against baseline methods.

Prioritize this complete loop over adding extra features.

```

```

