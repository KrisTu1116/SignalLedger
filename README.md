# SignalLedger

A play-money prediction market for short-horizon campus congestion forecasting.

Built for **BU CAS CS595 / QST IT795: Blockchains and their Applications**.

## MVP Question

> Will the library occupancy exceed 85% between 8 PM and 10 PM?

## How It Works

1. Users register and receive play-money credits.
2. Admin creates a binary YES/NO congestion market.
3. Users buy YES or NO shares — prices update after each trade.
4. Synthetic occupancy data settles the market.
5. Winners redeem shares for credits; losers get zero.
6. Users can stake credits to activate new market proposals.
7. An evaluation compares the market forecast against simpler baselines.

Blockchain enforces all market rules transparently — no operator can silently alter balances, trades, or settlement.

## Repository Structure

```
contracts/          Solidity smart contract + Hardhat tests & scripts
  contracts/        Solidity source files
  test/             TypeScript tests
  scripts/          Deploy, seed, and settle scripts
web/                Next.js frontend
  src/app/          Pages (App Router)
  src/components/   Reusable UI components
  src/lib/          Helpers (synthetic data, evaluation, contract)
  src/types/        Shared TypeScript types
docs/               Project documentation
```

## Prerequisites

- Node.js >= 18
- npm >= 9

## Quick Start

### 1. Install contract dependencies

```bash
cd contracts
npm install
```

### 2. Compile the smart contract

```bash
cd contracts
npx hardhat compile
```

### 3. Run tests

```bash
cd contracts
npx hardhat test
```

All 28 tests should pass, covering registration, trading, settlement, redemption, and activation staking.

### 4. Start a local Hardhat node

Open a terminal and keep it running:

```bash
cd contracts
npx hardhat node
```

This starts a local Ethereum network at `http://127.0.0.1:8545` with 20 pre-funded accounts.

### 5. Deploy the contract

In a **second terminal**:

```bash
cd contracts
npm run deploy:local
```

This deploys SignalLedger and saves the contract address to `contracts/deployments/localhost.json`.

### 6. Seed demo data

```bash
cd contracts
npm run seed:local
```

This will:
- Register Alice and Bob (1000 credits each)
- Create the library occupancy market (threshold: 85%)
- Alice buys 50 YES shares (price moves up)
- Bob buys 30 NO shares (price adjusts)
- Print current prices, balances, and positions

### 7. Settle the market

```bash
cd contracts
npm run settle:local
```

This will:
- Settle with synthetic occupancy data (89% → YES wins)
- Alice redeems winning YES shares
- Bob redeems losing NO shares (zero payout)
- Print final balances and evaluation snapshot

### 8. Install frontend dependencies

```bash
cd web
npm install
```

### 9. Start the frontend

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Full Demo Flow (summary)

```
Terminal 1                          Terminal 2
──────────                          ──────────
cd contracts                        
npx hardhat node                    cd contracts
  (keep running)                    npm run deploy:local
                                    npm run seed:local
                                    npm run settle:local
                                    cd ../web
                                    npm run dev
```

## Documentation

- [Architecture](docs/architecture.md)
- [Demo Script](docs/demo-script.md)
- [Evaluation Plan](docs/evaluation-plan.md)

## Constraints

- Play money only — no real-money trading.
- Synthetic data — no real campus sensors.
- Local Hardhat network — no production deployment.
- Educational prototype — not a production prediction market.
