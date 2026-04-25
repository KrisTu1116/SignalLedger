import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const DIVIDER = "─".repeat(56);

function bpsToPercent(bps: bigint): string {
  return (Number(bps) / 100).toFixed(2) + "%";
}

async function main() {
  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    "localhost.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    console.error("No deployment found. Run `npm run deploy:local` first.");
    process.exit(1);
  }
  const { address } = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const contract = await ethers.getContractAt("SignalLedger", address);

  const [admin, alice, bob] = await ethers.getSigners();
  const marketId = 0;

  // ------------------------------------------------------------------
  // Synthetic occupancy value — simulates oracle reading
  // In a real demo you could randomize or prompt for this value.
  // ------------------------------------------------------------------
  const syntheticOccupancy = 89; // matches oracle helper output (deterministic seed)

  console.log(`\n${DIVIDER}`);
  console.log("  STEP 5 — Settle market with synthetic data");
  console.log(DIVIDER);
  console.log(`  Synthetic occupancy: ${syntheticOccupancy}%`);
  console.log(`  Threshold:           85%`);
  console.log(
    `  Outcome:             ${syntheticOccupancy >= 85 ? "YES wins" : "NO wins"}`
  );

  await (await contract.settleMarket(marketId, syntheticOccupancy)).wait();

  const m = await contract.getMarket(marketId);
  console.log(`  Market status:       ${m.status === 1n ? "Settled" : "Open"}`);
  console.log(
    `  Winning outcome:     ${m.winningOutcome === 1n ? "YES" : "NO"}`
  );

  // ------------------------------------------------------------------
  // Redemption
  // ------------------------------------------------------------------
  console.log(`\n${DIVIDER}`);
  console.log("  STEP 6 — Redeem shares");
  console.log(DIVIDER);

  const aliceBalBefore = await contract.getUserBalance(alice.address);
  const bobBalBefore = await contract.getUserBalance(bob.address);

  await (await contract.connect(alice).redeem(marketId)).wait();
  await (await contract.connect(bob).redeem(marketId)).wait();

  const aliceBalAfter = await contract.getUserBalance(alice.address);
  const bobBalAfter = await contract.getUserBalance(bob.address);

  console.log(`  Alice  credits: ${aliceBalBefore} → ${aliceBalAfter}`);
  console.log(`  Bob    credits: ${bobBalBefore} → ${bobBalAfter}`);

  // ------------------------------------------------------------------
  // Final YES price as implied probability for evaluation
  // ------------------------------------------------------------------
  const [yFinal] = await contract.getCurrentPrices(marketId);
  console.log(`\n${DIVIDER}`);
  console.log("  EVALUATION SNAPSHOT");
  console.log(DIVIDER);
  console.log(`  Final YES price (implied prob): ${bpsToPercent(yFinal)}`);
  console.log(`  Actual occupancy:               ${syntheticOccupancy}%`);
  console.log(
    `  Outcome:                        ${syntheticOccupancy >= 85 ? "Exceeded threshold" : "Below threshold"}`
  );

  console.log(`\n${DIVIDER}`);
  console.log("  Settlement and redemption complete.");
  console.log(DIVIDER);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
