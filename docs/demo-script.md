# Demo Script — ≈ 5½-Minute Classroom Presentation

**SignalLedger:** play-money congestion prediction — **library** MVP end-to-end · local Hardhat · **BU CAS CS595 / QST IT795**

**Tip:** Speak slowly; skip live typing if nervous — refer to seeded script output (`npm run seed:local`) and the Evaluation page tab.

**Total target ≈ 5:30** after adding the Decision Signal / Reflexivity slot. Trim the *Why blockchain?* section if running over.

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

Then click `/requests`. Point at the blue **"Why staking instead of voting?"** panel and the priority badges, and say:

> Users **stake** play-money credits toward dining-hall or gym requests. Stake costs something — credits leave your spendable balance — so high-stake requests reveal **real student demand**, not just upvotes. The page sorts by total stake and labels each request **Low / Medium / High Priority**, so the system can decide **what to forecast next**. When stake passes the activation threshold, the badge flips to *Activated · Ready for market launch* and a future version could use that pool to seed the new market's liquidity.

(Optionally let one demo user stake into the dining-hall request to flip a Low → Medium badge live.)

---

## 4:15–4:45 — Decision signal & reflexivity (≈ 30–45 s)

Click back to `/markets`. Point at the **Decision Signal** card directly under the price tiles.

Say:

> The market price isn't just a number. We interpret it as a **decision signal** for students. Below 40 % YES probability we say *Low risk — library is manageable.* From 40 to 70 %, *Medium — check alternatives.* Above 70 %, *High — consider another study space between 8 and 10 PM.*

Then click over to `/evaluation` and scroll to the **Forecast Reflexivity / Behavior Impact** section.

Say:

> Congestion forecasts are different from weather forecasts: the prediction can **change the outcome**. If 20 % of marginal visitors see a *High* signal and pick another space, the projected 89 % occupancy can drop to roughly 81 % — under the threshold. The market would then look "wrong" by raw accuracy, but it actually **reduced congestion**.

Close the slot:

> So a useful campus forecast should be evaluated by **decision usefulness**, not only by raw hit rate. The numbers in this card are illustrative — fixed for clarity, not a real behavioural model.

---

## 4:45–5:15 — Evaluation

Say:

On **Evaluation**, we compare **three**:

1. **Market forecast** — final YES price as implied probability (**from trades**).

2. **Historical average baseline** — from synthetic **seven evenings** exceeding 85% in the slot.

3. **Plain poll** — fixed lecture mock (**60%** yes).

> We illustrate **comparison**, not statistically significant proof — **one deterministic outcome**.

Adjust YES **bps** in the UI to match on-chain finals if demos diverge.

---

## 5:15–5:30 — Limitations and close

Briefly hit:

| Limitation |
|-------------|
| **Synthetic occupancy** |
| Tiny **participant** counts |
| **Simplified AMM**, not LMSR |
| **Play money**, no fiat |
| **No production oracle** |
| Single **canonical** MVP market wired end-to-end; dining/gym = **staking demos** |
| **Behavioural impact card** is an illustrative, fixed-number scenario — *not* a real elasticity model |

Closing line:

> SignalLedger separates **prediction as commitment** supported by enforced rules — from dashboards that only rewind time.

Practice **timing** beforehand to stay within **five minutes**.
