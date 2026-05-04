# SignalLedger

## 1. Project overview

**SignalLedger** is a play-money prediction market prototype for short-horizon campus congestion forecasting.

**Course:** BU CAS CS595 / QST IT795 — *Blockchains and their Applications*

**MVP question:**

> Will the library occupancy exceed 85% between 8 PM and 10 PM?

Students register, trade YES/NO shares (internal credits only), see prices move after trades, settle the market using deterministic synthetic library occupancy data, redeem winning shares, optionally stake credits toward **candidate** dining-hall and gym markets, and compare the market’s implied probability to simple baselines.

The project is a **local classroom demo**: no real money, no production deployment, no real student data.

---

## 2. Blockchain justification

Blockchain is used as a **transparent rule-enforcement layer**, not as “the database for campus sensors.”

On-chain rules include: who is registered, play-money balances, market state, YES/NO trades, price updates (via demand and a simple AMM formula), admin settlement, redemption, and activation staking. Anyone with the contract address and RPC can verify that balances and outcomes follow the same code.

A central server could store the same facts, but **a single operator could change balances or settlement off the record**. A smart contract commits the rules in public bytecode and makes state changes auditable through transactions and events.

---

## 3. MVP scope

**In scope:**

- One fully wired **library occupancy** market (create → trade → settle → redeem).
- Synthetic library occupancy data + oracle-style helper (max occupancy in 8–10 PM window vs 85% threshold).
- Simple AMM-style pricing (not full LMSR).
- Activation staking for **two candidate** questions (dining hall wait, gym occupancy) — staking only; they do not auto-deploy new full markets.

**Out of scope (by design):**

- Real-money trading, ERC-20, or production wallet products.
- Production oracle or real campus APIs.
- Unlimited user-created markets; only admin-created official market + user-created *requests* with staking.

---

## 4. Local setup

**Prerequisites**

- Node.js ≥ 18  
- npm ≥ 9  

**Clone and install**

```bash
git clone <your-repo-url>
cd FinalBlock
```

Install **contracts** and **web** separately:

```bash
cd contracts && npm install
cd ../web && npm install
```

---

## 5. How to run contract tests

From the `contracts` folder:

```bash
cd contracts
npx hardhat compile
npx hardhat test
```

Expect **28 passing** tests (registration, trading, settlement, redemption, activation staking, view helpers).

---

## 6. How to start local Hardhat node

Keep this terminal open:

```bash
cd contracts
npx hardhat node
```

Runs a local chain at `http://127.0.0.1:8545` with standard Hardhat accounts.

---

## 7. How to deploy contract

With the node running, in a **second** terminal:

```bash
cd contracts
npm run deploy:local
```

Deploys `SignalLedger` and writes `contracts/deployments/localhost.json` (address for scripts; this path is gitignored by default).

---

## 8. How to seed demo market

Still on localhost, after deploy:

```bash
cd contracts
npm run seed:local
```

> **Important:** The MVP library market is **created by this seed script**, not by any frontend admin form. The web UI focuses on trading, settlement, redemption, staking, and evaluation against an already-deployed market — so the seed script must be run **before** opening the frontend or the `/markets` page will show *“No markets found.”*

This registers **Alice** and **Bob**, creates the **library** market (threshold 85%), runs sample trades (Alice YES, Bob NO), and prints prices and positions.

Optional — full settle + redeem via CLI:

```bash
npm run settle:local
```

Settles using the same deterministic synthetic logic as the web oracle helper (max occupancy in the 8–10 PM window; in the shipped implementation this resolves to **89%** for “today,” so **YES** wins if threshold is 85%). Then redeems for Alice and Bob.

---

## 9. How to start frontend

```bash
cd web
npm run dev
```

Open **http://localhost:3000**.

> **Run order matters:** start the Hardhat node, deploy, and **seed the library market** (steps 6–8) **before** starting the frontend. The frontend assumes the MVP library market already exists on-chain; it does not provide an admin “create market” form.

The UI expects the contract at the default local address **0x5FbDB2315678afecb367f032d93F642f64180aa3** on chain id **31337** (matches first deploy to a fresh Hardhat node). Uses built-in Hardhat demo keys in the browser **for local demo only** — not for mainnet.

---

## 10. Full demo flow

The first three terminal steps **must run before** the frontend; the seed script is what puts the MVP library market on-chain.

| Step | Where | What |
|------|--------|------|
| 1 | Terminal | `npx hardhat node` — start local chain |
| 2 | Terminal | `npm run deploy:local` — deploy `SignalLedger` |
| 3 | Terminal | `npm run seed:local` — **create the library market** + register Alice/Bob + sample trades (and optionally `npm run settle:local`) |
| 4 | Terminal | `cd ../web && npm run dev` — start the frontend |
| 5 | Web: Home | Explain project and open **Market**, **Requests**, **Evaluation**. |
| 6 | Web: `/markets` | Pick Alice/Bob/Carol, **Register**, **Buy YES / NO**, see prices refresh. Use **Settle with Synthetic Data** (admin path in UI), then **Redeem**. |
| 7 | Web: `/requests` | Create candidate requests; **Stake** credits until activation threshold (**500**) is reached. |
| 8 | Web: `/evaluation` | Adjust YES price (bps) to match final contract YES price if needed; compare market vs historical baseline vs poll. |

Minimal three-terminal overview:

```
Terminal 1:  cd contracts && npx hardhat node
Terminal 2:  cd contracts && npm run deploy:local && npm run seed:local
             (optional) npm run settle:local
Terminal 3:  cd web && npm run dev
```

---

## 11. Limitations

- **Play money only** — credits are internal `uint256` in the contract, not ETH or ERC-20.
- **Synthetic data** — no real occupancy sensors; results are deterministic for reproducible demos.
- **Local Hardhat network** — not audited for production; keys in the frontend are demo keys.
- **Simplified AMM** — educational price movement, not institutional market making.
- **Small demo** — a few scripted traders; evaluation on one resolved event is illustrative, not statistically significant.
- **Admin-created library market** in the default scripts; the UI demonstrates trading and settlement, not permissionless market creation for the MVP market.

---

## Repository layout

```
contracts/     Hardhat — SignalLedger.sol, tests, deploy/seed/settle scripts
web/           Next.js — pages, viem contract helpers, synthetic/oracle/evaluation libs, API routes
docs/          Architecture, demo script, evaluation plan
README.md      This file
```

## More documentation

- [docs/architecture.md](docs/architecture.md) — layers, on-chain vs off-chain  
- [docs/demo-script.md](docs/demo-script.md) — 5-minute presentation outline  
- [docs/evaluation-plan.md](docs/evaluation-plan.md) — metrics and caveats  

---

## Constraints (course / project rules)

Play money only · No gambling mechanics · No production deployment · No PII · No unrestricted user-generated markets · No production oracle · No full LMSR unless explicitly requested · Focus on one end-to-end library occupancy market  
