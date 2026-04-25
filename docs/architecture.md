# Architecture

## Overview

SignalLedger is a play-money prediction market that uses blockchain as a transparent rule-enforcement layer.

## Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | Solidity / Hardhat | Market rules, balances, trades, settlement, staking |
| Frontend | Next.js / TypeScript / Tailwind | Demo UI for trading, staking, evaluation |
| Synthetic Data | TypeScript | Generates library occupancy data for settlement |
| Local Network | Hardhat Node | Local Ethereum network for classroom demo |

## Contract Responsibilities

- User registration and play-money credit issuance
- Binary market creation (library occupancy > 85%)
- YES/NO share trading with simple AMM pricing
- Market settlement with synthetic congestion data
- Winning share redemption
- Market activation staking

## Data Flow

```
User → Frontend → Smart Contract (Hardhat local network)
                       ↑
              Synthetic Data (oracle helper)
```

<!-- Expand as implementation progresses -->
