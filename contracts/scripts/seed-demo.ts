import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const DIVIDER = "─".repeat(56);

function bpsToPercent(bps: bigint): string {
  return (Number(bps) / 100).toFixed(2) + "%";
}

async function main() {
  // ------------------------------------------------------------------
  // 1. Connect to deployed contract
  // ------------------------------------------------------------------
  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    "localhost.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    console.error(
      "No deployment found. Run `npm run deploy:local` first."
    );
    process.exit(1);
  }
  const { address } = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const contract = await ethers.getContractAt("SignalLedger", address);
  console.log("Connected to SignalLedger at:", address);

  // ------------------------------------------------------------------
  // 2. Get signers — Hardhat default accounts
  //    signer[0] = admin (deployer), signer[1] = Alice, signer[2] = Bob
  // ------------------------------------------------------------------
  const [admin, alice, bob] = await ethers.getSigners();

  console.log(`\n${DIVIDER}`);
  console.log("  STEP 1 — Register demo users");
  console.log(DIVIDER);

  await (await contract.connect(alice).register()).wait();
  console.log(`  Alice registered  ${alice.address}`);

  await (await contract.connect(bob).register()).wait();
  console.log(`  Bob   registered  ${bob.address}`);

  const aliceBal = await contract.getUserBalance(alice.address);
  const bobBal = await contract.getUserBalance(bob.address);
  console.log(`  Alice credits: ${aliceBal}`);
  console.log(`  Bob   credits: ${bobBal}`);

  // ------------------------------------------------------------------
  // 3. Admin creates the MVP library market
  // ------------------------------------------------------------------
  console.log(`\n${DIVIDER}`);
  console.log("  STEP 2 — Create library occupancy market");
  console.log(DIVIDER);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now;
  const endTime = now + 7200; // +2 hours

  await (
    await contract.createMarket(
      "Will the library occupancy exceed 85% between 8 PM and 10 PM?",
      "Library",
      "occupancy_percentage",
      85,
      startTime,
      endTime,
      "synthetic_library_occupancy_data"
    )
  ).wait();

  const marketId = 0;
  const market = await contract.getMarket(marketId);
  console.log(`  Market #${marketId} created`);
  console.log(`  Question:   ${market.question}`);
  console.log(`  Location:   ${market.locationName}`);
  console.log(`  Threshold:  ${market.threshold}%`);
  console.log(`  Source:     ${market.settlementSource}`);

  const [yBefore, nBefore] = await contract.getCurrentPrices(marketId);
  console.log(
    `  Prices:     YES ${bpsToPercent(yBefore)}  /  NO ${bpsToPercent(nBefore)}`
  );

  // ------------------------------------------------------------------
  // 4. Sample trades
  // ------------------------------------------------------------------
  console.log(`\n${DIVIDER}`);
  console.log("  STEP 3 — Alice buys 50 YES shares");
  console.log(DIVIDER);

  await (await contract.connect(alice).buyYes(marketId, 50)).wait();
  const [yAfterAlice, nAfterAlice] = await contract.getCurrentPrices(marketId);
  console.log(
    `  Prices now: YES ${bpsToPercent(yAfterAlice)}  /  NO ${bpsToPercent(nAfterAlice)}`
  );

  console.log(`\n${DIVIDER}`);
  console.log("  STEP 4 — Bob buys 30 NO shares");
  console.log(DIVIDER);

  await (await contract.connect(bob).buyNo(marketId, 30)).wait();
  const [yAfterBob, nAfterBob] = await contract.getCurrentPrices(marketId);
  console.log(
    `  Prices now: YES ${bpsToPercent(yAfterBob)}  /  NO ${bpsToPercent(nAfterBob)}`
  );

  // ------------------------------------------------------------------
  // 5. Summary
  // ------------------------------------------------------------------
  console.log(`\n${DIVIDER}`);
  console.log("  SUMMARY — Balances & Positions");
  console.log(DIVIDER);

  const aliceBalAfter = await contract.getUserBalance(alice.address);
  const bobBalAfter = await contract.getUserBalance(bob.address);
  const alicePos = await contract.getUserPosition(alice.address, marketId);
  const bobPos = await contract.getUserPosition(bob.address, marketId);

  console.log(`  Alice  credits: ${aliceBalAfter}`);
  console.log(`         YES shares: ${alicePos.yes}   NO shares: ${alicePos.no}`);
  console.log(`  Bob    credits: ${bobBalAfter}`);
  console.log(`         YES shares: ${bobPos.yes}   NO shares: ${bobPos.no}`);

  const m = await contract.getMarket(marketId);
  console.log(`\n  Market demand — YES: ${m.yesDemand}  NO: ${m.noDemand}`);
  console.log(`  Market status: ${m.status === 0n ? "Open" : "Settled"}`);

  console.log(`\n${DIVIDER}`);
  console.log("  Demo seed complete. Market is open for more trades.");
  console.log(`  Next: settle with  npx hardhat run scripts/settle-demo.ts --network localhost`);
  console.log(DIVIDER);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
