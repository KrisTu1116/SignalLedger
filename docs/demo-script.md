# Demo Script — Five-Minute Classroom Presentation

**SignalLedger:** play-money congestion prediction — **library** MVP end-to-end · local Hardhat · **BU CAS CS595 / QST IT795**

**Tip:** Speak slowly; skip live typing if nervous — refer to seeded script output (`npm run seed:local`) and the Evaluation page tab.

---

## 0:00–0:30 — Title and problem

Say:

> SignalLedger forecasts whether **busy spaces like the library**, and later candidates like **dining** or **gym**, hit a congestion threshold **in an upcoming window** — not whether we like the building today.

Stretch (one sentence):

> Students care whether the **library, dining hall, or gym** will be crowded **soon**.

---

## 0:30–1:15 — Why not just a dashboard?

Say:

> A **dashboard** shows **current or past** occupancy. It does **not** aggregate everyone’s beliefs about **a future interval** tonight.

Say:

> **SignalLedger** targets a future window — MVP: library **above 85% between 8 and 10 PM** — expressed as YES/NO and a price that summarizes beliefs.

Avoid claiming we replace official campus dashboards.

---

## 1:15–2:15 — Why blockchain?

Say:

> We use blockchain as a **rule-enforcement lens**, **not** as fake storage for occupancy streams.

Enumerate **on-chain**: transparent rules for **registration**, internal **balances**, **trades**, **price updates**, **settlement**, **payout/redemption**, and **activation staking** tied to thresholds.

Contrast (one sentence):

> A normal **database** lets an operator revise balances silently; **open bytecode + chain state + events** make the **declared rules** harder to fudge after users take positions — that’s what we illustrate in class.

Keep it proportional: **local prototype**, **play money**.

---

## 2:15–4:15 — Demo (live or narrated slideshow)

**Run order before talking:**

```
Terminal 1:  cd contracts && npx hardhat node
Terminal 2:  cd contracts && npm run deploy:local
             cd contracts && npm run seed:local      ← creates the MVP library market on-chain
Terminal 3:  cd web && npm run dev
```

Mention out loud:

> The MVP library market is **created by the seed script**, not by a frontend admin form. The web UI is for **trading, settlement, redemption, staking, and evaluation** against an already-deployed market. So the seed script is what writes the market on-chain before we open the page.

Narrate the contract flow:

> **Alice** buys YES; **Bob** buys NO → **YES/NO demand** shifts → prices **update** immediately.

Show **Settlement** (script or `/markets`): synthetic library series → **oracle helper** computes **max** occupancy in **8–10 PM** → admin transaction **`settleMarket`** → YES or NO **wins**.

> **Winner redeems** into internal credits — **losers settle at zero.**

Then **Requests**: users **stake** play money toward dining / gym prompts until **threshold** activates the request (**no automated second full market deployment**).

---

## 4:15–4:45 — Evaluation

Say:

On **Evaluation**, we compare **three**:

1. **Market forecast** — final YES price as implied probability (**from trades**).

2. **Historical average baseline** — from synthetic **seven evenings** exceeding 85% in the slot.

3. **Plain poll** — fixed lecture mock (**60%** yes).

> We illustrate **comparison**, not statistically significant proof — **one deterministic outcome**.

Adjust YES **bps** in the UI to match on-chain finals if demos diverge.

---

## 4:45–5:00 — Limitations and close

Briefly hit:

| Limitation |
|-------------|
| **Synthetic occupancy** |
| Tiny **participant** counts |
| **Simplified AMM**, not LMSR |
| **Play money**, no fiat |
| **No production oracle** |
| Single **canonical** MVP market wired end-to-end; dining/gym = **staking demos** |

Closing line:

> SignalLedger separates **prediction as commitment** supported by enforced rules — from dashboards that only rewind time.

Practice **timing** beforehand to stay within **five minutes**.
